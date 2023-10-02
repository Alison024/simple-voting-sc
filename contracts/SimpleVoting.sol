// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISimpleVoting.sol";

/**
  @title SimpleVoting 
  @author Andrii Ublinskykh
  @notice It is simple Voting contract which allows:
  - owner to add/remove voters
  - create voting with several options of vote
  - vote for voting options as voter
  - get information about votings and options
**/
contract SimpleVoting is Ownable, ISimpleVoting {
  using EnumerableSet for EnumerableSet.UintSet;
  mapping(uint256 => Voting) private _votings;
  mapping(address => bool) private _voters;
  uint256 private _votingCounter;

  modifier onlyVoter() {
    if (!_voters[msg.sender]) {
      revert NotVoter();
    }
    _;
  }

  modifier onlyExistingVoting(uint256 _votingId) {
    if (isVotingExist(_votingId)) {
      revert InvalidVoting();
    }
    _;
  }

  //--------------Owner function--------------

  /**
    @notice add new address of a voter to the contract.
    @dev Only owner can call this function;
    If passed address equals to zero address - reverts with error ZeroAddress;
    Emits event AddedVoter.
    @param _newVoter address of new voter.
  **/
  function addVoter(address _newVoter) external onlyOwner {
    _addVoter(_newVoter);
  }

  /**
    @notice add new addresses of voters to the contract.
    @dev Only owner can call this function;
    If one of the passed addresses equals to zero address - reverts with error ZeroAddress;
    Emits event AddedVoter.
    @param _newVoters addresses of new voters.
  **/
  function addVoters(address[] calldata _newVoters) external onlyOwner {
    for (uint256 i; i < _newVoters.length; i++) {
      _addVoter(_newVoters[i]);
    }
  }

  /**
    @notice remove address of a voter from the contract.
    @dev Only owner can call this function;
    If passed address equals to zero address - reverts with error ZeroAddress;
    Emits event RemovedVoter.
    @param _badVoter address of voter to remove.
  **/
  function removeVoter(address _badVoter) external onlyOwner {
    _removeVoter(_badVoter);
  }

  /**
    @notice remove addresess of voters from the contract.
    @dev Only owner can call this function;
    If one of the passed addresses equals to zero address - reverts with error ZeroAddress;
    Emits event RemovedVoter.
    @param _badVoters addresses of voters to remove.
  **/
  function removeVoters(address[] calldata _badVoters) external onlyOwner {
    for (uint256 i; i < _badVoters.length; i++) {
      _removeVoter(_badVoters[i]);
    }
  }

  /**
    @notice create new voting.
    @dev Only owner can call this function;
    If _votingStartTimestamp is less than block.timestamp, reverts with error InvalidStartDate;
    _votingDuration must be greater than 0.
    _options may be a simple description as well as an IPFS link to file with description.
    It is more preferable to use IPFS for long description;
    Emits event AddedNewVoting.
    @param _options addresses of voters to remove.
    @param _votingStartTimestamp start of voting timestamp.
    @param _votingDuration duration of voting.
  **/
  function createVoting(
    string[] calldata _options,
    uint64 _votingStartTimestamp,
    uint64 _votingDuration
  ) external onlyOwner {
    if (block.timestamp > _votingStartTimestamp) {
      revert InvalidStartDate();
    }
    if (_votingDuration == 0) {
      revert InvalidVotingDuration();
    }
    uint256 votingId = _votingCounter;
    _votingCounter++;
    uint64 votingEndTimestamp = uint64(block.timestamp) + _votingDuration;
    Voting storage voting = _votings[votingId];
    voting.isCreated = true;
    voting.votingStartTimestamp = _votingStartTimestamp;
    voting.votingEndTimestamp = votingEndTimestamp;
    uint256 optionsCounter;
    for (uint256 i; i < _options.length; i++) {
      optionsCounter++;
      voting.options[optionsCounter] = _options[i];
      voting.optionsIndexes.add(optionsCounter);
    }
    // adding empty option if voter wants to disagree with all other options;
    optionsCounter++;
    voting.options[optionsCounter] = "";
    voting.optionsIndexes.add(optionsCounter);
    emit AddedNewVoting(votingId, _votingStartTimestamp, votingEndTimestamp, _options);
  }

  //--------------Voter functions--------------

  /**
    @notice vote for spesific option in voting.
    @dev Only Voter can call this function;
    If new option doesn't equal to old one, revote.
    If new option equals to old one, returns without error.
    Emits event Voted.
    @param _votingId id of Voting.
    @param _optionIndex index of option to vote.
  **/
  function vote(uint256 _votingId, uint256 _optionIndex) external onlyVoter onlyExistingVoting(_votingId) {
    _vote(_votingId, _optionIndex, _msgSender());
  }

  /**
    @notice revoke vote from passed Voting.
    @dev Only Voter can call this function;
    The function reverts if previous vote doesn't exist;
    Emits event RevokedVote.
    @param _votingId id of Voting.
  **/
  function revokeVote(uint256 _votingId) external onlyVoter onlyExistingVoting(_votingId) {
    _revokeVote(_votingId, _msgSender());
  }

  //--------------View functions--------------

  /**
    @notice return information about passed Voting.
    @param _votingId id of Voting.
    @return startDate date of Voting start;
    @return endDate date of Voting end;
    @return voteAmount amount of votes;
    @return optionsIndexes array of proposals' indexes;
    @return options options array
    @return votes votes amount of options
  **/
  function getVotingData(
    uint256 _votingId
  )
    external
    view
    returns (
      uint64 startDate,
      uint64 endDate,
      uint256 voteAmount,
      uint256[] memory optionsIndexes,
      string[] memory options,
      uint256[] memory votes
    )
  {
    Voting storage voting = _votings[_votingId];
    startDate = voting.votingStartTimestamp;
    endDate = voting.votingEndTimestamp;
    voteAmount = voting.votesTotalAmount;
    optionsIndexes = voting.optionsIndexes.values();
    for (uint256 i; i < optionsIndexes.length; i++) {
      options[i] = voting.options[optionsIndexes[i]];
      votes[i] = voting.optionVotesAmount[optionsIndexes[i]];
    }
  }

  /**
    @notice return option index which has max amount of votes. 
    If Voting has several options with the same max amount of votes, haveMax will be false.
    @param _votingId id of Voting.
    @return wonOptionIndex option index;
    @return haveMax does Voting have max option;
  **/
  function getWonOption(uint256 _votingId) external view returns (uint256 wonOptionIndex, bool haveMax) {
    Voting storage voting = _votings[_votingId];
    uint256[] memory optionIndexes = voting.optionsIndexes.values();
    uint256 maxVotes;
    for (uint256 i; i < optionIndexes.length; i++) {
      uint256 votesAmount = voting.optionVotesAmount[optionIndexes[i]];
      if (maxVotes < votesAmount) {
        wonOptionIndex = optionIndexes[i];
        haveMax = true;
      } else if (maxVotes == votesAmount) {
        haveMax = false;
      }
    }
  }

  /**
    @notice return option description by index. 
    @param _votingId id of Voting.
    @param _optionIndex option index.
    @return option description.
  **/
  function getOptionByIndex(uint256 _votingId, uint256 _optionIndex) external view returns (string memory) {
    return _votings[_votingId].options[_optionIndex];
  }

  /**
    @notice return amount of votes in passed Voting. 
  **/
  function getVotesAmount(uint256 _votingId) external view returns (uint256) {
    return _votings[_votingId].votesTotalAmount;
  }

  /**
    @notice return true if passed Voting exists, false - if doesn't.
    @param _votingId Voting id.
    @return true if passed Voting exists, false - if doesn't.
  **/
  function isVotingExist(uint256 _votingId) public view returns (bool) {
    return _votings[_votingId].isCreated;
  }

  //--------------Internal functions--------------

  function _vote(uint256 _votingId, uint256 _optionIndex, address _voter) internal virtual {
    Voting storage voting = _votings[_votingId];
    uint256 currentTime = block.timestamp;
    if (voting.votingStartTimestamp > currentTime || currentTime > voting.votingEndTimestamp) {
      revert InvalidTimeToVote();
    }
    if (_optionIndex == 0 || !voting.optionsIndexes.contains(_optionIndex)) revert InvalidOption();

    uint256 previousVote = voting.votedOptionsByVoter[_voter];
    if (previousVote == _optionIndex) {
      return;
    }
    if (previousVote != 0) {
      _revokeVote(_votingId, _voter);
    }
    voting.votedOptionsByVoter[_voter] = _optionIndex;
    voting.votesTotalAmount++;
    voting.optionVotesAmount[_optionIndex]++;
    emit Voted(_votingId, _voter, _optionIndex);
  }

  function _revokeVote(uint256 _votingId, address _voter) internal virtual {
    Voting storage voting = _votings[_votingId];
    uint256 optionIndex = voting.votedOptionsByVoter[_voter];
    if (optionIndex == 0) {
      revert VoteNotExist();
    }
    voting.optionVotesAmount[optionIndex]--;
    voting.votesTotalAmount--;
    delete voting.votedOptionsByVoter[_voter];
    emit RevokedVote(_votingId, _voter);
  }

  function _addVoter(address _newVoter) internal virtual {
    if (_newVoter == address(0)) {
      revert ZeroAddress();
    }
    _voters[_newVoter] = true;
    emit AddedVoter(_newVoter);
  }

  function _removeVoter(address _voter) internal virtual {
    if (_voter == address(0)) {
      revert ZeroAddress();
    }
    _voters[_voter] = false;
    emit RemovedVoter(_voter);
  }
}
