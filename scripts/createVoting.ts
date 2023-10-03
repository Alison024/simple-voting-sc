import { ethers, network } from "hardhat";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { HttpNetworkConfig } from "hardhat/types";
import {
  encryptDataField,
  decryptNodeResponse,
} from "@swisstronik/swisstronik.js";

const sendShieldedQuery = async (
  provider: HardhatEthersProvider,
  destination: string,
  data: string,
) => {
  const rpclink = (network.config as HttpNetworkConfig).url;
  const [encryptedData, usedEncryptedKey] = await encryptDataField(
    rpclink,
    data,
  );
  const response = await provider.call({
    to: destination,
    data: encryptedData,
  });
  return await decryptNodeResponse(rpclink, response, usedEncryptedKey);
};

async function main() {
  let votingAddress: string = "0x1667F680B940754c2eB98D48cB82D40C7296F6a5";
  const Voting = await ethers.getContractAt("SimpleVoting", votingAddress);
  let signer: HardhatEthersSigner;
  [signer] = await ethers.getSigners();
  let provider: HardhatEthersProvider =
    signer.provider as HardhatEthersProvider;
  const currentTimestemp: number = (
    await provider.getBlock(await provider.getBlockNumber())
  )?.timestamp as number;
  let startDate: number = 1696343483; //currentTimestemp + 600;
  let duration: number = 60 * 60 * 24 * 7;
  let options: any = ["opt1", "opt2"];
  console.log([options, startDate, duration]);
  const res1 = await sendShieldedQuery(
    provider,
    votingAddress,
    Voting.interface.encodeFunctionData("createVoting", [
      options,
      startDate,
      duration,
    ]),
  );
  console.log(
    "Creating of voting was successful",
    Voting.interface.decodeFunctionResult("createVoting", res1),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
