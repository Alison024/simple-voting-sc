import {
  takeSnapshot,
  time,
  SnapshotRestorer,
} from "@nomicfoundation/hardhat-network-helpers";
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
let globalSnapshot: SnapshotRestorer;
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
    let currentTime: number;
    let startTime: number;
    let duration: number;
    let options: any;
    before(async () => {
      currentTime = await time.latest();
      startTime = currentTime + 100;
      duration = 120;
      options = ["opt1", "opt2", "opt3"];
    });
    after(async () => {
      await globalSnapshot.restore();
    });
    it("Must revert if sender isn't owner", async () => {
      await expect(
        voting.connect(user1).createVoting(options, startTime, duration),
      ).to.be.revertedWith(OWNABLE_ERROR);
    });
    it("Must revert if voting start date is less than current date", async () => {
      await expect(
        voting.createVoting(options, 0, duration),
      ).to.be.revertedWithCustomError(voting, "InvalidStartDate");
    });
    it("Must revert if voting duration equals to zero", async () => {
      await expect(
        voting.createVoting(options, startTime, 0),
      ).to.be.revertedWithCustomError(voting, "InvalidVotingDuration");
    });
    it("Must revert if options length equals to zero", async () => {
      await expect(
        voting.createVoting([], startTime, duration),
      ).to.be.revertedWithCustomError(voting, "ZeroOptions");
    });
    it("Must create a Voting correctly", async () => {
      let tx = await voting.createVoting(options, startTime, duration);
      expect(tx)
        .to.be.emit(voting, "AddedNewVoting")
        .withArgs(0, startTime, startTime + duration, ["opt1", "opt2", "opt3"]);
      let votingDataObj = await voting.getVotingData(0);
      let optionsCount = options.length + 1;
      expect(votingDataObj[0]).to.be.equal(startTime);
      expect(votingDataObj[1]).to.be.equal(startTime + duration);
      expect(votingDataObj[2]).to.be.equal(0);
      expect(votingDataObj[3].length).to.be.equal(optionsCount);
      expect(votingDataObj[3]).to.be.deep.equal([1, 2, 3, 4]);
      expect(votingDataObj[4].length).to.be.equal(optionsCount);
      expect(votingDataObj[4]).to.be.deep.equal([
        "opt1",
        "opt2",
        "opt3",
        "disagree",
      ]);
      expect(votingDataObj[5].length).to.be.equal(optionsCount);
      expect(votingDataObj[5]).to.be.deep.equal([0, 0, 0, 0]);
      expect(await voting.getOptionByIndex(0,1)).to.be.equal(options[0]);
      expect(await voting.getOptionByIndex(0,2)).to.be.equal(options[1]);
      expect(await voting.getOptionByIndex(0,3)).to.be.equal(options[2]);
      expect(await voting.getOptionByIndex(0,4)).to.be.equal("disagree");
    });
  });
  describe("vote", async () => {
    let localSnapshot: SnapshotRestorer;
    let currentTime: number;
    let startTime: number;
    let duration: number;
    let options: any;
    before(async () => {
      currentTime = await time.latest();
      startTime = currentTime + 100;
      duration = 120;
      options = ["opt1", "opt2"];
      await voting.createVoting(options, startTime, duration);
      await voting.addVoters([owner.address, user1.address, user2.address]);
      // console.log(await voting.getVotingData(0));
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await globalSnapshot.restore();
    });
    it("Must revert if sender isn't Voting", async () => {
      await expect(
        voting.connect(user3).vote(0, 1),
      ).to.be.revertedWithCustomError(voting, "NotVoter");
    });
    it("Must revert if a Voting with passed id doesn't exist", async () => {
      await expect(voting.vote(1, 1)).to.be.revertedWithCustomError(
        voting,
        "InvalidVoting",
      );
    });
    it("Must revert if Voting haven't started or finished already", async () => {
      await expect(voting.vote(0, 1)).to.be.revertedWithCustomError(
        voting,
        "InvalidTimeToVote",
      );
      await time.increaseTo(startTime + duration + 1);
      await expect(voting.vote(0, 1)).to.be.revertedWithCustomError(
        voting,
        "InvalidTimeToVote",
      );
    });
    it("Must revert if option with passed index doesn't exists", async () => {
      await time.increaseTo(startTime + 1);
      await expect(voting.vote(0, 0)).to.be.revertedWithCustomError(
        voting,
        "InvalidOption",
      );
      await expect(voting.vote(0, 100)).to.be.revertedWithCustomError(
        voting,
        "InvalidOption",
      );
    });
    it("Must vote correctly", async () => {
      await time.increaseTo(startTime + 1);
      await voting.vote(0, 1);
      await voting.connect(user1).vote(0, 1);
      await voting.connect(user2).vote(0, 2);
      expect(await voting.getVotesAmount(0)).to.be.equal(3);
      let winOption = await voting.getWonOption(0);
      // console.log(winOption);
      expect(winOption[0]).to.be.equal(1);
      expect(winOption[1]).to.be.true;
    });
    it("Must revote correctly", async () => {
      await time.increaseTo(startTime + 1);
      await voting.vote(0, 1);
      await voting.connect(user1).vote(0, 1);
      await voting.connect(user2).vote(0, 2);
      await voting.vote(0, 2);
      expect(await voting.getVotesAmount(0)).to.be.equal(3);
      let winOption = await voting.getWonOption(0);
      // console.log(winOption);
      expect(winOption[0]).to.be.equal(2);
      expect(winOption[1]).to.be.true;
    });
    it("Must vote second time correctly", async () => {
      await time.increaseTo(startTime + 1);
      await voting.vote(0, 1);
      await voting.vote(0, 1);
      expect(await voting.getVotesAmount(0)).to.be.equal(1);
      let winOption = await voting.getWonOption(0);
      expect(winOption[0]).to.be.equal(1);
      expect(winOption[1]).to.be.true;
    });
  });

  describe("revokeVote", async () => {
    let localSnapshot: SnapshotRestorer;
    let currentTime: number;
    let startTime: number;
    let duration: number;
    let options: any;
    before(async () => {
      currentTime = await time.latest();
      startTime = currentTime + 100;
      duration = 120;
      options = ["opt1", "opt2"];
      await voting.createVoting(options, startTime, duration);
      await voting.addVoters([owner.address, user1.address, user2.address]);
      await time.increaseTo(startTime + 1);
      await voting.connect(user1).vote(0, 1);
      await voting.connect(user2).vote(0, 2);
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await globalSnapshot.restore();
    });
    it("Must revert if sender isn't Voting", async () => {
      await expect(
        voting.connect(user3).revokeVote(0),
      ).to.be.revertedWithCustomError(voting, "NotVoter");
    });
    it("Must revert if Voting with passed id doesn't exist", async () => {
      await expect(voting.revokeVote(100)).to.be.revertedWithCustomError(
        voting,
        "InvalidVoting",
      );
    });
    it("Must revert if voter hasn't voted", async () => {
      await expect(voting.revokeVote(0)).to.be.revertedWithCustomError(
        voting,
        "VoteNotExist",
      );
    });
    it("Must revoke a vote correctly", async () => {
      let tx = await voting.connect(user1).revokeVote(0);
      await voting.vote(0, 1);
      expect(tx).to.be.emit(voting, "RevokedVote").withArgs(0, user1.address);
      expect(await voting.getVotesAmount(0)).to.be.equal(2);
      let votingDataObj = await voting.getVotingData(0);
      expect(votingDataObj[5]).to.be.deep.equal([1, 1, 0]);
      let winOption = await voting.getWonOption(0);
      expect(winOption[0]).to.be.equal(1);
      expect(winOption[1]).to.be.false;
    });
  });
});
