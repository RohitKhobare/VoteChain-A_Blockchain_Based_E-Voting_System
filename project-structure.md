# Project Structure

## Classification

**Project type:** Full-stack decentralized application (dApp). It comprises a browser frontend, a Solidity smart contract, Hardhat tooling, and a local test suite. It is not a conventional backend/frontend service pair: no application server or off-chain database is present.

## Top-level modules

| Module | Responsibility | Source/config files |
|---|---|---|
| `contracts/` | Solidity application and on-chain voting state | 1 contract source file |
| `scripts/` | Deploy contract and export frontend deployment metadata | 1 deployment script |
| `test/` | Contract test suite | 1 test file |
| `frontend/` | React UI, browser wallet integration, presentation | 6 files under `src/`, plus `index.html`, `vite.config.js`, and its manifest |
| Root configuration | Hardhat network/compiler settings and npm scripts | `hardhat.config.js`, `package.json`, lockfile |

The source file counts above refer to files returned in the project source directories; generated output, dependencies, and build/cache directories are not source modules.

## Layers and entry points

1. **Browser document and build layer:** `frontend/index.html` mounts the document; `frontend/vite.config.js` configures the React plugin and Vite development server.
2. **UI layer:** `frontend/src/main.jsx` mounts `App`; `frontend/src/App.jsx` contains the voting experience and in-app results dashboard.
3. **Wallet/contract integration layer:** `frontend/src/blockchain.js` handles MetaMask connection, network switching, ethers provider/signer/contract construction, and readable error messages.
4. **Contract/domain layer:** `contracts/Voting.sol` validates and records votes and exposes contract state/results.
5. **Deployment/test tooling:** `scripts/deploy.js` deploys the contract and writes the frontend ABI/address; `test/Voting.test.js` verifies contract behavior.

## Functional areas

- **Voting UI:** connect wallet, load candidate names and results, submit vote transactions, show transaction status, and respond to `VoteCast` events.
- **Results dashboard:** display total votes, candidate counts, percentages, and connected-wallet status. This is a view within `App.jsx`, not an independently routed page or secured admin feature.
- **Wallet/network integration:** detect MetaMask, request account access, add/switch to chain ID `31337`, and instantiate the voting contract.
- **Election contract:** store candidate names, one-vote-per-address state, totals, and vote events.
- **Development workflow:** compile/test, run a local node, deploy, and export deployment metadata for the frontend.

## Cross-module flow

`npm run node` starts the local Hardhat chain. `npm run deploy` deploys the contract and writes its address, chain ID, and ABI to `frontend/src/contract.json`. The frontend imports that file, connects to MetaMask, reads contract state, and sends signed vote transactions. Successful on-chain votes emit `VoteCast`, which the UI uses to refresh the displayed results.

## Config and generated files

- `package.json`: root Hardhat scripts and dependencies.
- `frontend/package.json`: frontend scripts and dependencies.
- `hardhat.config.js`: compiler version `0.8.20`; in-memory Hardhat and localhost networks use chain ID `31337`; local RPC is `http://127.0.0.1:8545`.
- `frontend/vite.config.js`: React plugin and Vite dev port `5173`.
- `frontend/src/contract.json`: deployment-generated ABI, address, and chain ID; must correspond to the node/network currently running.
- `.github/workflows/deploy-pages.yml`: GitHub Actions workflow that builds and publishes the static frontend to GitHub Pages.
- `.gitignore`: excludes installed dependencies, Hardhat artifacts/cache/typechain output, coverage, frontend build output, and `.env`.

The app's voting and admin views are switched by React component state. There is no standalone backend, REST API, database, or URL router.
