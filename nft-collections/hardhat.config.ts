import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: process.env.GOERLI_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!]
    }
  },
  etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY!,
  },
};

export default config;
