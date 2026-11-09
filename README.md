# VoteChain

VoteChain is a local blockchain voting prototype built with Solidity, Hardhat, React, Vite, ethers.js, and MetaMask. It demonstrates a complete local workflow: deploy a voting contract, connect a browser wallet, cast a vote, and read the on-chain results.

> **Prototype only — not suitable for real elections.** Voting is limited to one vote per wallet address, not one vote per person. Voter addresses, choices, and totals are public on-chain, so this application does not provide ballot secrecy. The admin dashboard is a results view, not an authenticated or privileged admin system. The project does not implement identity checks, encryption, IPFS storage, or election lifecycle controls.

## Features

- Deploy a Solidity voting contract with at least two candidates.
- Connect MetaMask to the local Hardhat network.
- Read candidates and vote totals from the contract.
- Submit a vote transaction; the contract prevents repeat votes from the same address and rejects invalid candidate indexes.
- Refresh displayed results when a `VoteCast` event is observed.
- View total votes, candidate totals, and percentages in the dashboard.
- Run contract tests with Hardhat, Mocha, and Chai.

## Project structure

```text
votechain/
├── contracts/
│   └── Voting.sol                 # On-chain candidates, voter tracking, tally, and event
├── scripts/
│   └── deploy.js                  # Deploys Voting and exports address + ABI to the frontend
├── test/
│   └── Voting.test.js             # Contract behavior tests
├── frontend/
│   ├── index.html                 # Browser document and React mount point
│   ├── vite.config.js              # Vite development server and React plugin
│   └── src/
│       ├── main.jsx                # React application entry point
│       ├── App.jsx                 # Voting screen and results dashboard
│       ├── blockchain.js           # MetaMask, network, ethers contract, and error helpers
│       ├── candidates.js           # Display-only party labels
│       ├── contract.json           # Generated deployment address, chain ID, and ABI
│       └── styles.css              # Application styles
├── hardhat.config.js               # Solidity compiler and local network settings
├── package.json                    # Contract/deployment scripts and Hardhat dependencies
├── package-lock.json
├── frontend/package.json           # Frontend scripts and React/Vite/ethers dependencies
└── frontend/package-lock.json
```

The project has three main runtime surfaces: the React browser application, the externally callable `Voting` smart-contract interface, and the Hardhat deployment command. The admin dashboard is a view within the same React application; there is no separate backend server or frontend router.

## Technology stack

| Area | Technology |
|---|---|
| Smart contract | Solidity `0.8.20` |
| Contract tooling | Hardhat `^2.22.0`, `@nomicfoundation/hardhat-toolbox` `^5.0.0` |
| Frontend | React and React DOM `^18.3.1` |
| Frontend build/dev server | Vite `^5.4.0`, `@vitejs/plugin-react` `^4.3.0` |
| Ethereum client | ethers.js `^6.13.0` |
| Wallet | MetaMask browser extension |
| Runtime | Node.js and npm; Node.js 18 or newer is recommended |

These are the dependency ranges declared by the project manifests. The root and frontend have separate npm lockfiles and dependency installs.

## Prerequisites

- Node.js 18+ and npm
- MetaMask installed in the browser used to open the app

## Install, test, and run locally

Run the following from the project root. Keep the local blockchain running while deploying and using the app.

```bash
# Install the Hardhat dependencies and frontend dependencies
npm install
npm run frontend:install

# Run the contract test suite
npm test

# Terminal 1: start a local Hardhat blockchain
npm run node

# Terminal 2: deploy to the running local node and generate the frontend ABI/address file
npm run deploy

# Terminal 3: start the Vite development server
npm run frontend:dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. If that port is already in use, Vite may select another port; use the URL it prints.

The deploy command writes the deployed contract address, chain ID, and ABI to `frontend/src/contract.json`. Run it again whenever the local node is restarted or the contract is redeployed.

## GitHub repository and Pages deployment

The frontend is configured for the repository's GitHub Pages path. Pushing to the `main` branch runs `.github/workflows/deploy-pages.yml`, builds the Vite app, and publishes `frontend/dist` to GitHub Pages. The workflow enables/configures Pages and can also be started manually from the repository's **Actions** tab.

The Pages site is a static frontend only. This project's contract address and network are for a local Hardhat development chain; a Pages visitor's browser cannot reach the developer's local node. Therefore, the deployed page is not a shared/live election and wallet transactions will not work for visitors unless they separately run the local blockchain and deploy the contract. A public working deployment would require a separately deployed contract and an accessible public RPC network.

### MetaMask setup

1. Open the Vite URL in a browser profile where MetaMask is enabled. VS Code's integrated preview may not expose browser extensions.
2. Connect the wallet in the app. It requests MetaMask to switch to or add the **Hardhat Local** network:
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: local test ETH
3. When `npm run node` starts, Hardhat prints funded test accounts and their private keys. Import one of these accounts into MetaMask to vote. **These keys are public test keys; never use them on a real network or fund them with real assets.**
4. Connect the wallet and choose a candidate. MetaMask prompts you to approve the transaction; the UI waits for its confirmation.
5. To verify the one-vote-per-wallet rule, connect a different Hardhat test account and cast another vote.

If you restart the local node, its chain state is reset. Start it again, redeploy with `npm run deploy`, and reconnect MetaMask. If a previously imported account has a stale transaction nonce, clear that local network's activity data in MetaMask and retry.

## Contract behavior and data

`Voting.sol` accepts candidate names at deployment and requires at least two. The candidate list is fixed for that contract deployment. Its public interface includes:

| Interface | Behavior |
|---|---|
| `vote(uint256 candidateIndex)` | Records one vote for the selected candidate, keyed by `msg.sender`; reverts for a repeat voter or an out-of-range index. |
| `getResults()` | Returns all candidate names and their vote counts. |
| `getCandidateCount()` | Returns the number of candidates. |
| `candidates(index)`, `hasVoted(address)`, `votes(index)` | Solidity-generated public getters for contract state. |
| `VoteCast(address voter, uint256 candidateIndex)` | Event emitted after a successful vote. |

The contract stores candidate names, a wallet-address-to-voted mapping, and candidate-index-to-vote-count mappings. All of this state and emitted vote events are publicly observable on-chain.

## Available npm scripts

| Command | Purpose |
|---|---|
| `npm run compile` | Compile the Solidity contracts. |
| `npm test` | Run the Hardhat/Mocha/Chai contract tests. |
| `npm run node` | Start the local Hardhat JSON-RPC node on port `8545`. |
| `npm run deploy` | Deploy to the configured `localhost` network and update `frontend/src/contract.json`. Requires the node to be running. |
| `npm run frontend:install` | Install frontend dependencies. |
| `npm run frontend:dev` | Start Vite for local frontend development. |
| `npm run frontend:build` | Build static frontend files into `frontend/dist`. |

To print gas usage for the contract tests, run:

```bash
REPORT_GAS=true npx hardhat test
```

## Changing the candidates

Edit the `CANDIDATES` array in `scripts/deploy.js` to change the on-chain candidate names. The deployment requires at least two names. Update `PARTIES` in `frontend/src/candidates.js` if you want matching display-only party labels; unknown names are shown as `Independent`. Then deploy the contract again and use the updated `contract.json`.

## Test coverage

`test/Voting.test.js` checks candidate initialization, rejection of fewer than two candidates, successful voting and event emission, invalid candidate indexes, duplicate votes, and tallies from multiple wallets. These are smart-contract tests; they do not constitute a security audit or end-to-end testing of a real election.

## Known limitations

- A wallet address is not a verified voter identity and can be created or controlled by one person; the contract cannot enforce one-person-one-vote.
- Candidate selections, wallet addresses, and vote totals are public on the blockchain. This design does not provide ballot secrecy.
- The candidate list is fixed at deployment; there is no owner/admin role, election start/end time, pause, or reset function.
- The dashboard is accessible to every user and has no administrator authentication or authorization.
- The app targets a local Hardhat network and is configured for a local development workflow; production deployment, monitoring, privacy, and operational safeguards are not provided.
- `frontend/src/contract.json` is deployment output. Its contents must match the network and contract address currently in use.

## Architecture notes

The UI is a single React application with local component state rather than a router or server API. `blockchain.js` connects to MetaMask through ethers.js and instantiates the contract using the generated ABI/address. The Solidity contract is the authoritative source for candidate names, voter eligibility-by-address, and vote totals. The deployment script bridges the contract build/deployment and frontend by exporting the ABI and network-specific address.

Additional source-anchored architecture notes are in [`project-structure.md`](./project-structure.md), [`tech-stack.md`](./tech-stack.md), [`data-model.md`](./data-model.md), and [`.github/modernize/rearchitecture/artifacts/architecture_index.md`](./.github/modernize/rearchitecture/artifacts/architecture_index.md).
