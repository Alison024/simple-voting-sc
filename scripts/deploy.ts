import { ethers } from "hardhat";

async function main() {
  const voting = await ethers.deployContract("SimpleVoting");

  await voting.waitForDeployment();

  console.log(`Voting address ${await voting.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
