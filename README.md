# Simple voting smart contract on SwissTron network
## Short description
The contract allows owner to create Votings and add/remove voters which can vote in created Votings.

Owner can specify start timestamp of a Voting, duration and options to vote.

Voters can vote for one option in each active Voting. If voter changes a decision, they can re-vote or revoke a vote.  
## Contract address
Address: [0x1667F680B940754c2eB98D48cB82D40C7296F6a5](https://explorer-evm.testnet.swisstronik.com/address/0x1667F680B940754c2eB98D48cB82D40C7296F6a5)
## Use cases
### Creating Votings
- By using function `createVoting`, Voter can create Votings with parameters:
    - array of options (may be simple strings as well as IPFS link);
    - timestamp of voting start;
    - voting duration
- After **Voting** start users with voter rights can cast their votes
### Adding/Removing voters
- Owner can add one or many voters in one transaction (`addVoter`, `addVoters`)
- Owner can remove one or many voters in one transaction (`removeVoter`, `removeVoters`)
### Voting
- Voter can vote for one option in one **Voting** (`vote`);
- Voter can re-vote a vote.
- Voter can revoke a vote (`revokeVote`).
### Choosing vote winner
By using function `getWonOption` we can get info whether win option exists and if yes, what option index it has;
### Tracking changes
By using function `getVotingData` you can get all necessary data about any Voting as:
- start timestamp;
- end timestamp;
- votes amount;
- array of options indexes(ids);
- array of options;
- array of votes;

The contract also has next functions:
- `getOptionByIndex` - returns option description by passed option index;
- `getVotesAmount` - returns votes amount;
### Owner management
The contract inherits Ownable contract from Openzeppelin library. The Ownable contract allows to:
- leave the contract without owner;
- transfer owner ownership to another address(user/smart contract);

## License
The smart contract has license: MIT (SPDX-License-Identifier: MIT)
