import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();
const config: HardhatUserConfig = {
  solidity:{
    version:"0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false,
    currency: 'USD',
    gasPrice: 18
  }
};

export default config;
