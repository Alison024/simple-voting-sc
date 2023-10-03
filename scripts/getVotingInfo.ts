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
  // Get the RPC link from the network configuration
  const rpclink = (network.config as HttpNetworkConfig).url;
  // Encrypt the call data using the SwisstronikJS function encryptDataField()
  const [encryptedData, usedEncryptedKey] = await encryptDataField(
    rpclink,
    data,
  );
  // Execute the call/query using the provider
  const response = await provider.call({
    to: destination,
    data: encryptedData,
  });
  // Decrypt the call result using SwisstronikJS function decryptNodeResponse()
  return await decryptNodeResponse(rpclink, response, usedEncryptedKey);
};

async function main() {
  let votingAddress: string = "0x1667F680B940754c2eB98D48cB82D40C7296F6a5";
  let votingId = 0;
  const Voting = await ethers.getContractAt("SimpleVoting", votingAddress);
  let signer: HardhatEthersSigner;
  [signer] = await ethers.getSigners();
  let provider: HardhatEthersProvider =
    signer.provider as HardhatEthersProvider;
  const res1 = await sendShieldedQuery(
    provider,
    votingAddress,
    Voting.interface.encodeFunctionData("getVotingData", [votingId]),
  );
  console.log(
    "Voting with id",
    votingId,
    "data:",
    Voting.interface.decodeFunctionResult("getVotingData", res1),
  );
  const res2 = await sendShieldedQuery(
    provider,
    votingAddress,
    Voting.interface.encodeFunctionData("getVotesAmount", [votingId]),
  );
  console.log(
    "Voting with id",
    votingId,
    "votes amount:",
    Voting.interface.decodeFunctionResult("getVotesAmount", res2),
  );
  const res3 = await sendShieldedQuery(
    provider,
    votingAddress,
    Voting.interface.encodeFunctionData("getWonOption", [votingId]),
  );
  console.log(
    "Voting with id",
    votingId,
    "won option:",
    Voting.interface.decodeFunctionResult("getWonOption", res3),
  );
  const res4 = await sendShieldedQuery(
    provider,
    votingAddress,
    Voting.interface.encodeFunctionData("owner"),
  );
  console.log(
    "Owner of the contract:",
    Voting.interface.decodeFunctionResult("owner", res4),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
