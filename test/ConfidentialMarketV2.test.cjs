const { expect } = require("chai");
const hre = require("hardhat");

describe("ConfidentialMarketV2", function () {
  let market;
  let marketAddress;
  let owner;
  let user1;
  let user2;

  async function deployMarketFixture(deployer) {
    const contractFactory = await hre.ethers.getContractFactory("ConfidentialMarketV2");
    const contract = await contractFactory.connect(deployer).deploy();
    await contract.waitForDeployment();
    return contract;
  }

  before(async function () {
    // 获取测试账户
    [owner, user1, user2] = await hre.ethers.getSigners();

    // 部署合约
    market = await deployMarketFixture(owner);
    marketAddress = await market.getAddress();

    // 初始化 coprocessor
    await hre.fhevm.assertCoprocessorInitialized(market, "ConfidentialMarketV2");
  });

  describe("Market Creation", function () {
    it("Should allow owner to create a market", async function () {
      const question = "Will Bitcoin reach $100k by end of 2025?";
      const duration = 86400; // 1 day

      const tx = await market.createMarket(question, duration);
      await tx.wait();

      const marketInfo = await market.getMarketInfo(0);
      expect(marketInfo.question).to.equal(question);
      expect(marketInfo.resolved).to.equal(false);
      expect(marketInfo.totalParticipants).to.equal(0);
    });

    it("Should not allow non-owner to create a market", async function () {
      const question = "Test question?";
      const duration = 86400;

      await expect(
        market.connect(user1).createMarket(question, duration)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should reject empty question", async function () {
      await expect(
        market.createMarket("", 86400)
      ).to.be.revertedWith("Question cannot be empty");
    });

    it("Should reject zero duration", async function () {
      await expect(
        market.createMarket("Test question?", 0)
      ).to.be.revertedWith("Duration must be positive");
    });

    it("Should increment market counter", async function () {
      const counter1 = await market.marketCounter();

      await market.createMarket("Question 1?", 86400);
      const counter2 = await market.marketCounter();

      await market.createMarket("Question 2?", 86400);
      const counter3 = await market.marketCounter();

      expect(counter2).to.equal(counter1 + BigInt(1));
      expect(counter3).to.equal(counter1 + BigInt(2));
    });
  });

  describe("Betting", function () {
    let marketId;

    beforeEach(async function () {
      // 为每个测试创建一个新市场
      const counter = await market.marketCounter();
      const tx = await market.createMarket(`Test Market ${counter}?`, 86400);
      await tx.wait();
      marketId = counter;
    });

    it("Should allow users to place encrypted bets (YES)", async function () {
      // 创建加密输入：1 表示 YES
      const input = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input.add32(1); // YES vote
      const encryptedVote = await input.encrypt();

      // 下注
      const tx = await market
        .connect(user1)
        .placeBet(marketId, encryptedVote.handles[0], encryptedVote.inputProof);
      await tx.wait();

      // 验证状态
      const hasVoted = await market.hasVoted(marketId, user1.address);
      expect(hasVoted).to.equal(true);

      const marketInfo = await market.getMarketInfo(marketId);
      expect(marketInfo.totalParticipants).to.equal(1);
    });

    it("Should allow users to place encrypted bets (NO)", async function () {
      // 创建加密输入：0 表示 NO
      const input = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input.add32(0); // NO vote
      const encryptedVote = await input.encrypt();

      const tx = await market
        .connect(user1)
        .placeBet(marketId, encryptedVote.handles[0], encryptedVote.inputProof);
      await tx.wait();

      const hasVoted = await market.hasVoted(marketId, user1.address);
      expect(hasVoted).to.equal(true);
    });

    it("Should not allow double voting", async function () {
      // 第一次投票
      const input1 = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input1.add32(1);
      const encryptedVote1 = await input1.encrypt();

      await market
        .connect(user1)
        .placeBet(marketId, encryptedVote1.handles[0], encryptedVote1.inputProof);

      // 尝试第二次投票
      const input2 = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input2.add32(0);
      const encryptedVote2 = await input2.encrypt();

      await expect(
        market
          .connect(user1)
          .placeBet(marketId, encryptedVote2.handles[0], encryptedVote2.inputProof)
      ).to.be.revertedWith("Already voted on this market");
    });

    it("Should allow multiple users to vote", async function () {
      // User1 投票 YES
      const input1 = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input1.add32(1);
      const encryptedVote1 = await input1.encrypt();
      await market
        .connect(user1)
        .placeBet(marketId, encryptedVote1.handles[0], encryptedVote1.inputProof);

      // User2 投票 NO
      const input2 = hre.fhevm.createEncryptedInput(marketAddress, user2.address);
      input2.add32(0);
      const encryptedVote2 = await input2.encrypt();
      await market
        .connect(user2)
        .placeBet(marketId, encryptedVote2.handles[0], encryptedVote2.inputProof);

      const marketInfo = await market.getMarketInfo(marketId);
      expect(marketInfo.totalParticipants).to.equal(2);
    });

    it("Should not allow betting on non-existent market", async function () {
      const input = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input.add32(1);
      const encryptedVote = await input.encrypt();

      await expect(
        market
          .connect(user1)
          .placeBet(999, encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.be.revertedWith("Market does not exist");
    });
  });

  describe("Market Resolution", function () {
    let marketId;

    beforeEach(async function () {
      // 创建一个短时间的市场
      const counter = await market.marketCounter();
      const tx = await market.createMarket(`Short Market ${counter}?`, 1); // 1 second duration
      await tx.wait();
      marketId = counter;

      // 等待市场结束
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it("Should allow owner to resolve market after end time", async function () {
      const tx = await market.resolveMarket(marketId, true);
      await tx.wait();

      const marketInfo = await market.getMarketInfo(marketId);
      expect(marketInfo.resolved).to.equal(true);
      expect(marketInfo.outcome).to.equal(true);
    });

    it("Should not allow non-owner to resolve market", async function () {
      await expect(
        market.connect(user1).resolveMarket(marketId, true)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow resolving before end time", async function () {
      // 创建一个长时间的市场
      const counter = await market.marketCounter();
      const tx = await market.createMarket(`Long Market ${counter}?`, 86400);
      await tx.wait();
      const longMarketId = counter;

      await expect(
        market.resolveMarket(longMarketId, true)
      ).to.be.revertedWith("Market has not ended yet");
    });

    it("Should not allow resolving twice", async function () {
      await market.resolveMarket(marketId, true);

      await expect(
        market.resolveMarket(marketId, false)
      ).to.be.revertedWith("Market already resolved");
    });

    it("Should not allow betting on resolved market", async function () {
      await market.resolveMarket(marketId, true);

      const input = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input.add32(1);
      const encryptedVote = await input.encrypt();

      await expect(
        market
          .connect(user1)
          .placeBet(marketId, encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.be.revertedWith("Market already resolved");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      // 先获取当前 owner 以便后续恢复
      const originalOwner = await market.owner();

      await market.transferOwnership(user1.address);
      expect(await market.owner()).to.equal(user1.address);

      // 恢复 ownership 以不影响其他测试
      await market.connect(user1).transferOwnership(originalOwner);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        market.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not allow transferring to zero address", async function () {
      await expect(
        market.transferOwnership(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("New owner cannot be zero address");
    });

    it("Should allow new owner to create markets", async function () {
      const originalOwner = await market.owner();

      await market.transferOwnership(user1.address);

      const counter = await market.marketCounter();
      const tx = await market.connect(user1).createMarket("New Market?", 86400);
      await tx.wait();

      const marketInfo = await market.getMarketInfo(counter);
      expect(marketInfo.question).to.equal("New Market?");

      // 恢复 ownership
      await market.connect(user1).transferOwnership(originalOwner);
    });
  });

  describe("Market Data Retrieval", function () {
    it("Should get encrypted market data", async function () {
      const counter = await market.marketCounter();
      const tx = await market.createMarket("Test Market for Data?", 86400);
      await tx.wait();
      const marketId = counter;

      const [yesVotes, noVotes] = await market.getMarket(marketId);
      // 在 mock 模式下，这些值应该是加密类型的 handle
      expect(yesVotes).to.exist;
      expect(noVotes).to.exist;
    });

    it("Should get market info", async function () {
      const question = "Test Market Info?";
      const duration = 86400;

      const counter = await market.marketCounter();
      const tx = await market.createMarket(question, duration);
      await tx.wait();
      const marketId = counter;

      const marketInfo = await market.getMarketInfo(marketId);
      expect(marketInfo.question).to.equal(question);
      expect(marketInfo.resolved).to.equal(false);
      expect(marketInfo.totalParticipants).to.equal(0);
    });

    it("Should not get data for non-existent market", async function () {
      await expect(
        market.getMarket(999)
      ).to.be.revertedWith("Market does not exist");

      await expect(
        market.getMarketInfo(999)
      ).to.be.revertedWith("Market does not exist");
    });
  });

  describe("Events", function () {
    it("Should emit MarketCreated event", async function () {
      const question = "Test Market Event?";
      const duration = 86400;

      await expect(market.createMarket(question, duration))
        .to.emit(market, "MarketCreated");
    });

    it("Should emit BetPlaced event", async function () {
      const counter = await market.marketCounter();
      await market.createMarket("Test Market?", 86400);
      const marketId = counter;

      const input = hre.fhevm.createEncryptedInput(marketAddress, user1.address);
      input.add32(1);
      const encryptedVote = await input.encrypt();

      await expect(
        market
          .connect(user1)
          .placeBet(marketId, encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.emit(market, "BetPlaced")
        .withArgs(marketId, user1.address);
    });

    it("Should emit MarketResolved event", async function () {
      const counter = await market.marketCounter();
      const tx = await market.createMarket("Test Market Event?", 1);
      await tx.wait();
      const marketId = counter;

      await new Promise(resolve => setTimeout(resolve, 2000));

      await expect(market.resolveMarket(marketId, true))
        .to.emit(market, "MarketResolved")
        .withArgs(marketId, true);
    });
  });
});
