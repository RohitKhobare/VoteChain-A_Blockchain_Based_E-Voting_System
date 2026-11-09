const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// Candidate names stored on-chain. Party labels are display-only (see frontend/src/candidates.js).
const CANDIDATES = ["Alice Johnson", "Bob Smith", "Charlie Brown"];

async function main() {
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(CANDIDATES);
  await voting.waitForDeployment();
  const address = await voting.getAddress();
  console.log(`Voting deployed to: ${address}`);

  // Export address + ABI so the React app can talk to the contract.
  const artifact = await hre.artifacts.readArtifact("Voting");
  const out = {
    address,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    abi: artifact.abi,
  };
  const target = path.join(__dirname, "..", "frontend", "src", "contract.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(out, null, 2));
  console.log(`Wrote ${target}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
