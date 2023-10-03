// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface ISimpleVoting {
  /// @notice Describe Voting.
  /// @param isCreated true if Voting exists, false - if doesn't;
  /// @param optionsIndexes list of options indexes.
  /// It is used to get options description from options mapping below
  /// @param options mapping which contains options description;
  /// @param optionVotesAmount mapping which stores the amount of votes for each option;
  /// @param votedOptionsByVoter mapping which stores what option have voter voted for;
  /// @param votingStartTimestamp timestamp of voting start;
  /// @param votingEndTimestamp timestamp of voting end;
  /// @param votesTotalAmount sum of all votes in the Voting.
  struct Voting {
    bool isCreated;
    EnumerableSet.UintSet optionsIndexes;
    mapping(uint256 => string) options;
    mapping(uint256 => uint256) optionVotesAmount;
    mapping(address => uint256) votedOptionsByVoter;
    uint64 votingStartTimestamp;
    uint64 votingEndTimestamp;
    uint256 votesTotalAmount;
  }

  /// @notice Emits when owner adds new owner;
  /// @param newVoter new voter;
  event AddedVoter(address newVoter);

  /// @notice Emits when owner removes owner;
  /// @param voter removed voter;
  event RemovedVoter(address voter);

  /// @notice Emits when owner creates new Voting;
  /// @param votingId Voting id;
  /// @param startDate Voting start date;
  /// @param endDate Voting end date;
  /// @param options array of options;
  event AddedNewVoting(uint256 indexed votingId, uint64 startDate, uint64 endDate, string[] options);

  /// @notice Emits when voter votes for an option;
  /// @param votingId Voting id;
  /// @param voter address of voter;
  /// @param optionIndex voted option;
  event Voted(uint256 indexed votingId, address indexed voter, uint256 optionIndex);

  /// @notice Emits when voter revokes their vote from a Voting;
  /// @param votingId Voting id;
  /// @param voter address of a voter;
  event RevokedVote(uint256 indexed votingId, address indexed voter);

  /// @notice Throws when owner tries to add or remove zero address as voter;
  error ZeroAddress();
  /// @notice Throws if sender isn't voter;
  error NotVoter();
  /// @notice Throws if passed Voting start date is less than current date.
  error InvalidStartDate();
  /// @notice Throws if passed voting duration equals to 0.
  error InvalidVotingDuration();
  /// @notice Throws if owner tries to create voting with zero options.
  error ZeroOptions();
  /// @notice Throws if voter tries to revoke vote without vote.
  error VoteNotExist();
  /// @notice Throws if Voting with passed votingId doesn't exist.
  error InvalidVoting();
  /// @notice Throws if option with passed optionIndex doesn't exist.
  error InvalidOption();
  /// @notice Throws if voter tries to vote before start of voting ot after voting end.
  error InvalidTimeToVote();

  function addVoter(address _newVoter) external;

  function addVoters(address[] calldata _newVoters) external;

  function removeVoter(address _badVoter) external;

  function removeVoters(address[] calldata _badVoters) external;

  function createVoting(string[] calldata _options, uint64 _votingStartTimestamp, uint64 _votingDuration) external;

  function vote(uint256 _votingId, uint256 _optionIndex) external;

  function revokeVote(uint256 _votingId) external;

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
    );

  function getWonOption(uint256 _votingId) external view returns (uint256 wonOptionIndex, bool haveMax);

  function getOptionByIndex(uint256 _votingId, uint256 _optionIndex) external view returns (string memory);

  function getVotesAmount(uint256 _votingId) external view returns (uint256);
}
