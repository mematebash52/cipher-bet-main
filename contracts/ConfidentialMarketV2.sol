// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, euint64, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialMarketV2
 * @notice Enhanced version with access control, market management, and security improvements
 * @dev Uses Zama's FHE (Fully Homomorphic Encryption) for confidential betting
 */
contract ConfidentialMarketV2 is SepoliaConfig {
    struct Bet {
        euint64 yesVotes;
        euint64 noVotes;
    }

    struct Market {
        string question;
        uint256 endTime;
        bool resolved;
        bool outcome; // true = yes, false = no
        uint256 totalParticipants;
    }

    address public owner;
    uint256 public marketCounter;

    // marketId => encrypted votes
    mapping(uint256 => Bet) public encryptedBets;

    // marketId => market info
    mapping(uint256 => Market) public markets;

    // marketId => user => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, address indexed better);
    event MarketResolved(uint256 indexed marketId, bool outcome);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier marketExists(uint256 marketId) {
        require(marketId < marketCounter, "Market does not exist");
        _;
    }

    modifier marketActive(uint256 marketId) {
        require(!markets[marketId].resolved, "Market already resolved");
        require(block.timestamp < markets[marketId].endTime, "Market has ended");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new prediction market
     * @param question The question to be predicted
     * @param duration Duration in seconds until market ends
     */
    function createMarket(string calldata question, uint256 duration) external onlyOwner returns (uint256) {
        require(duration > 0, "Duration must be positive");
        require(bytes(question).length > 0, "Question cannot be empty");

        uint256 marketId = marketCounter++;
        uint256 endTime = block.timestamp + duration;

        markets[marketId] = Market({
            question: question,
            endTime: endTime,
            resolved: false,
            outcome: false,
            totalParticipants: 0
        });

        // votes 默认即为 0，无需显式初始化以避免在普通 EVM 上回退

        emit MarketCreated(marketId, question, endTime);
        return marketId;
    }

    /**
     * @notice Place an encrypted bet on a market
     * @param marketId The market to bet on
     * @param encryptedOption Encrypted option (1 for yes, 0 for no)
     * @param inputProof ZK proof for the encrypted input
     */
    function placeBet(
        uint256 marketId,
        externalEuint32 encryptedOption,
        bytes calldata inputProof
    ) external marketExists(marketId) marketActive(marketId) {
        require(!hasVoted[marketId][msg.sender], "Already voted on this market");

        // 使用新的 FHE API 处理外部加密输入
        euint32 option = FHE.fromExternal(encryptedOption, inputProof);
        FHE.allowThis(option);

        // option: 1 => yes, 0 => no
        ebool isYes = FHE.eq(FHE.asEuint64(option), FHE.asEuint64(1));

        // NOTE: 无法在链上解密验证 0/1，这里依赖客户端与 proof 的正确性

        Bet storage b = encryptedBets[marketId];
        b.yesVotes = FHE.add(b.yesVotes, FHE.select(isYes, FHE.asEuint64(1), FHE.asEuint64(0)));
        b.noVotes = FHE.add(b.noVotes, FHE.select(isYes, FHE.asEuint64(0), FHE.asEuint64(1)));

        FHE.allowThis(b.yesVotes);
        FHE.allowThis(b.noVotes);

        hasVoted[marketId][msg.sender] = true;
        markets[marketId].totalParticipants++;

        emit BetPlaced(marketId, msg.sender);
    }

    /**
     * @notice Resolve a market (owner only)
     * @param marketId The market to resolve
     * @param outcome The outcome (true for yes, false for no)
     */
    function resolveMarket(uint256 marketId, bool outcome)
        external
        onlyOwner
        marketExists(marketId)
    {
        require(block.timestamp >= markets[marketId].endTime, "Market has not ended yet");
        require(!markets[marketId].resolved, "Market already resolved");

        markets[marketId].resolved = true;
        markets[marketId].outcome = outcome;

        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Get encrypted market data
     * @param marketId The market ID
     * @return yesVotes Encrypted yes votes
     * @return noVotes Encrypted no votes
     */
    function getMarket(uint256 marketId)
        external
        view
        marketExists(marketId)
        returns (euint64, euint64)
    {
        Bet storage b = encryptedBets[marketId];
        return (b.yesVotes, b.noVotes);
    }

    /**
     * @notice Get market information
     * @param marketId The market ID
     * @return question The market question
     * @return endTime When the market ends
     * @return resolved Whether the market is resolved
     * @return outcome The outcome (if resolved)
     * @return totalParticipants Number of participants
     */
    function getMarketInfo(uint256 marketId)
        external
        view
        marketExists(marketId)
        returns (
            string memory question,
            uint256 endTime,
            bool resolved,
            bool outcome,
            uint256 totalParticipants
        )
    {
        Market storage m = markets[marketId];
        return (m.question, m.endTime, m.resolved, m.outcome, m.totalParticipants);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
