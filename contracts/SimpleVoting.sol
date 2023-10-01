// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISimpleVoting.sol";

contract SimpleVoting is Ownable, ISimpleVoting {
  mapping(address => bool) private _voters;

  modifier onlyVoter() {
    if (!_voters[msg.sender]) {
      revert NotVoter();
    }
    _;
  }

  //--------------Owner function to add and delete voters--------------
  
  function addVoter(address _newVoter) external onlyOwner {
    _addVoter(_newVoter);
  }

  function addVoters(address[] calldata _newVoters) external onlyOwner {
    for (uint256 i; i < _newVoters.length; i++) {
      _addVoter(_newVoters[i]);
    }
  }

  function removeVoter(address _voter) external onlyOwner {
    _removeVoter(_voter);
  }

  function removeVoters(address[] calldata _badVoters) external onlyOwner {
    for (uint256 i; i < _badVoters.length; i++) {
      _removeVoter(_badVoters[i]);
    }
  }

  function _addVoter(address _newVoter) internal {
    _voters[_newVoter] = true;
    emit AddedVoter(_newVoter);
  }

  function _removeVoter(address _voter) internal {
    _voters[_voter] = false;
    emit RemovedVoter(_voter);
  }
}
