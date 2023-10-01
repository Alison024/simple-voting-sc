// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISimpleVoting {
  error NotVoter();

  struct Voting {
    mapping(uint256 => string) options;
    mapping(address => uint256) votedVoters;
    uint256 votingsTotalAmount;
  }

  event AddedVoter(address newVoter);
  event RemovedVoter(address voter);
}
