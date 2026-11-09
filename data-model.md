# Existing Data Model

The application has no off-chain database or ORM. The authoritative election state is held in the deployed `Voting` Solidity contract.

## Contract state

| State member | Solidity type | Meaning |
|---|---|---|
| `candidates` | `string[]` | Candidate names initialized in the constructor; the deployed list has no update function. |
| `hasVoted` | `mapping(address => bool)` | Whether an Ethereum address has successfully voted. |
| `votes` | `mapping(uint256 => uint256)` | Vote total keyed by candidate array index. |

## Relationships and invariants

- A candidate is identified by its zero-based index in `candidates`.
- Each `votes` key refers to a candidate index; `vote` rejects indexes outside the candidate array.
- A voter address maps to one boolean and can successfully vote at most once per contract deployment.
- Construction requires at least two candidate names.
- `VoteCast(address indexed voter, uint256 indexed candidateIndex)` records successful vote activity as a public event.
- `getResults()` returns candidate names and corresponding counts in array order. The UI derives total votes and percentages from those values.

## Persistence and visibility

Contract state persists on the selected blockchain network and is publicly readable. Candidate names, wallet addresses that vote, and tallies are not private. There are no relational tables, off-chain entities, database transactions, or ORM mappings.

Each successful `vote` call updates the voter mapping and candidate tally in one EVM transaction, then emits `VoteCast`. A reverted call does not leave the vote updates applied.
