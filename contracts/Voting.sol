// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VoteChain Voting contract
/// @notice Prototype e-voting contract: one vote per wallet address, automatic tallying.
/// @dev Does NOT verify real-world identity or provide ballot secrecy (see project report).
contract Voting {
    string[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public votes;

    event VoteCast(address indexed voter, uint256 indexed candidateIndex);

    constructor(string[] memory candidateNames) {
        require(candidateNames.length >= 2, "At least two candidates required");
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(candidateNames[i]);
        }
    }

    function vote(uint256 candidateIndex) external {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateIndex < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        votes[candidateIndex]++;

        emit VoteCast(msg.sender, candidateIndex);
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /// @notice Convenience getter returning all names and counts in one call.
    function getResults() external view returns (string[] memory names, uint256[] memory counts) {
        uint256 n = candidates.length;
        names = new string[](n);
        counts = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            names[i] = candidates[i];
            counts[i] = votes[i];
        }
    }
}
