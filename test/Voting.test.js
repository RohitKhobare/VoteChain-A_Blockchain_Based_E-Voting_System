const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  const names = ["Alice Johnson", "Bob Smith", "Charlie Brown"];
  let voting, alice, bob, carol;

  beforeEach(async function () {
    [, alice, bob, carol] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(names);
    await voting.waitForDeployment();
  });

  it("initialises candidates in the constructor", async function () {
    expect(await voting.getCandidateCount()).to.equal(3n);
    expect(await voting.candidates(0)).to.equal("Alice Johnson");
    expect(await voting.candidates(2)).to.equal("Charlie Brown");
  });

  it("rejects deployment with fewer than two candidates", async function () {
    const Voting = await ethers.getContractFactory("Voting");
    await expect(Voting.deploy(["Only One"])).to.be.revertedWith(
      "At least two candidates required"
    );
  });

  it("records a valid vote and increments the count", async function () {
    await expect(voting.connect(alice).vote(1))
      .to.emit(voting, "VoteCast")
      .withArgs(alice.address, 1);
    expect(await voting.votes(1)).to.equal(1n);
    expect(await voting.hasVoted(alice.address)).to.equal(true);
  });

  it("rejects an invalid candidate index", async function () {
    await expect(voting.connect(alice).vote(3)).to.be.revertedWith("Invalid candidate");
    expect(await voting.hasVoted(alice.address)).to.equal(false);
  });

  it("rejects a duplicate vote from the same wallet", async function () {
    await voting.connect(alice).vote(0);
    await expect(voting.connect(alice).vote(2)).to.be.revertedWith("Already voted");
    expect(await voting.votes(0)).to.equal(1n);
    expect(await voting.votes(2)).to.equal(0n);
  });

  it("tallies votes from several wallets", async function () {
    await voting.connect(alice).vote(0);
    await voting.connect(bob).vote(0);
    await voting.connect(carol).vote(2);
    const [resNames, counts] = await voting.getResults();
    expect([...resNames]).to.deep.equal(names);
    expect([...counts].map(Number)).to.deep.equal([2, 0, 1]);
  });
});
