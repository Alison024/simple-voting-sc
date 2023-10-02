import { takeSnapshot, time } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumberish, Transaction } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SimpleVoting, SimpleVoting__factory } from "../typechain-types/";
let owner: HardhatEthersSigner;
let user1: HardhatEthersSigner;
let user2: HardhatEthersSigner;
let user3: HardhatEthersSigner;
let VotingFactory: SimpleVoting__factory;
let voting: SimpleVoting;
let globalSnapshot;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const OWNABLE_ERROR = "Ownable: caller is not the owner";

describe("SimpleVoting", async () => {
  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
    VotingFactory = (await ethers.getContractFactory(
      "SimpleVoting",
    )) as SimpleVoting__factory;
    voting = await VotingFactory.deploy();
    globalSnapshot = await takeSnapshot();
  });
  describe("constructor", async () => {
    it("Must be deployed correctly", async () => {
      expect(await voting.owner()).to.be.equal(owner.address);
    });
  });
  describe("add Voters", async () => {
    it("Must revert if sender isn't a owner", async () => {
      await expect(
        voting.connect(user1).addVoter(user1.address),
      ).to.be.revertedWith(OWNABLE_ERROR);
      await expect(
        voting.connect(user1).addVoters([user1.address, user2.address]),
      ).to.be.revertedWith(OWNABLE_ERROR);
      expect(await voting.owner()).to.be.equal(owner.address);
    });
    it("Must revert if passed address equals to zero address", async () => {
      await expect(voting.addVoter(ZERO_ADDRESS)).to.be.revertedWithCustomError(
        voting,
        "ZeroAddress",
      );
    });
    it("Must add voter address correctly", async () => {
      let tx = await voting.addVoter(user1.address);
      expect(tx).to.be.emit(voting, "AddedVoter").withArgs(user1.address);
    });
    it("Must add voter addresses correctly", async () => {
      let tx = await voting.addVoters([user1.address, user2.address]);
      expect(tx).to.be.emit(voting, "AddedVoter").withArgs(user1.address);
      expect(tx).to.be.emit(voting, "AddedVoter").withArgs(user2.address);
    });
  });
  describe("remove Voters", async () => {
    it("Must revert if sender isn't a owner", async () => {
      await expect(
        voting.connect(user1).removeVoter(user1.address),
      ).to.be.revertedWith(OWNABLE_ERROR);
      await expect(
        voting.connect(user1).removeVoters([user1.address, user2.address]),
      ).to.be.revertedWith(OWNABLE_ERROR);
      expect(await voting.owner()).to.be.equal(owner.address);
    });
    it("Must revert if passed address equals to zero address", async () => {
      await expect(
        voting.removeVoter(ZERO_ADDRESS),
      ).to.be.revertedWithCustomError(voting, "ZeroAddress");
    });
    it("Must remove voter address correctly", async () => {
      let tx = await voting.removeVoter(user1.address);
      expect(tx).to.be.emit(voting, "RemovedVoter").withArgs(user1.address);
    });
    it("Must remove voter addresses correctly", async () => {
      let tx = await voting.removeVoters([user1.address, user2.address]);
      expect(tx).to.be.emit(voting, "RemovedVoter").withArgs(user1.address);
      expect(tx).to.be.emit(voting, "RemovedVoter").withArgs(user2.address);
    });
  });
  describe("createVoting", async () => {
    it("Must create a Voting correctly", async () => {
      let currentTime = await time.latest();
      let startTime = currentTime + 100;
      let duration = 120;
      let tx = await voting.createVoting(
        ["opt1", "opt2", "opt3"],
        startTime,
        duration,
      );
      expect(tx)
        .to.be.emit(voting, "AddedNewVoting")
        .withArgs(0, startTime, startTime + duration, ["opt1", "opt2", "opt3"]);
      let votingDataObj = await voting.getVotingData(0);
      console.log(votingDataObj);
    });
  });
});
