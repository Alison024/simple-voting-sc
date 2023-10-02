import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.19",
};

export default config;
