require("dotenv/config");
require("@nomicfoundation/hardhat-toolbox");
require("@fhevm/hardhat-plugin");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    // 本地测试网络 (使用 fhevm-mock)
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Zama fhEVM Devnet (推荐 - 支持 FHE)
    zama: {
      url: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
    },
    // Sepolia (不支持 FHE)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // fhevm-mock configuration
  fhevm: {
    mock: true, // 启用 mock 模式进行本地测试
  },
};
