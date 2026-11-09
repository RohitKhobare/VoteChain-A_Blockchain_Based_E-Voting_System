# Architecture Index

## Implementation Guide

This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.

All paths are relative to `.github/modernize/rearchitecture/artifacts/`.

### Global artifacts

- `unit_graph.yaml`
  - Who reads: all workers.
  - Use for: entry points, source anchors, external signatures, dependencies, and shared references.
  - How to consume: locate the assigned unit and follow its source anchors and dependency edges. Source anchors are evidence of behavior, not an implementation scope mandate.
- `wire_contracts.yaml`
  - Who reads: workers changing the contract ABI or deployment-to-frontend handoff.
  - Use for: callable contract methods, revert semantics, events, and generated deployment metadata.
  - How to consume: filter `contracts[]` by the assigned unit.
- `shared_modules.yaml`
  - Who reads: all workers when shared code is identified.
  - Use for: modules referenced across multiple units, including the generated frontend contract metadata.
  - How to consume: filter `modules[]` where `used_by_units` includes the assigned unit; honor each unit's `shared_refs[].used_fields` subset.
- `cross_unit_state.yaml`
  - Who reads: workers changing implicit state transfer.
  - Use for: session/thread/static state flows crossing unit boundaries.
  - How to consume: filter flows where `writer.unit` or `reader.unit` matches the assigned unit. The explicit on-chain contract calls are recorded as wire contracts, not implicit state flows.

No `migration_boundary.yaml` or `seams.yaml` is included: the request was project analysis/documentation, not a rewrite or partial migration, and no user-declared cut point exists.

### Unit: `frontend-app`

- External trigger: browser loads the single-page app; the voting and results views are toggled in component state.
- Must read:
  - `units/frontend-app/behavior.yaml` — wallet states, transaction behavior, refresh behavior, user-visible errors.
  - `units/frontend-app/bindings.yaml` — React mount, contract event listener, deployment metadata, and chain ID.
  - `units/frontend-app/unit_decomposition.yaml` — advisory split candidates only; `commit: false`.
- Relevant global rows:
  - `wire_contracts.yaml`: contract ABI consumed through ethers.
  - `shared_modules.yaml`: rows where `used_by_units` includes `frontend-app`.
  - `cross_unit_state.yaml`: flows touching `frontend-app`.
- Before DONE report: artifacts read, preserved user-visible branches and side effects, unresolved contracts, and test/build/runtime evidence.

### Unit: `voting-contract`

- External trigger: Ethereum transactions and read calls against the deployed Solidity contract.
- Must read:
  - `units/voting-contract/behavior.yaml` — constructor guard, vote validation, state updates, event, and transaction boundary.
  - `units/voting-contract/bindings.yaml` — public ABI and compiler version.
  - `units/voting-contract/unit_decomposition.yaml` — advisory split candidates only; `commit: false`.
- Relevant global rows:
  - `wire_contracts.yaml`: filter `unit == voting-contract` for ABI and revert/event behavior.
  - `shared_modules.yaml`: rows where `used_by_units` includes `voting-contract`.
  - `cross_unit_state.yaml`: flows touching `voting-contract`.
- Before DONE report: artifacts read, preserved ABI/revert/event semantics, unresolved contracts, and test/build evidence.

### Unit: `deployment-command`

- External trigger: `npm run deploy`, which executes the Hardhat deployment script.
- Must read:
  - `units/deployment-command/behavior.yaml` — deployment and generated-file side effects, including failure exit behavior.
  - `units/deployment-command/bindings.yaml` — npm command and localhost network settings.
  - `units/deployment-command/unit_decomposition.yaml` — advisory split candidates only; `commit: false`.
- Relevant global rows:
  - `wire_contracts.yaml`: filter `unit == deployment-command` for `frontend/src/contract.json`.
  - `shared_modules.yaml`: rows where `used_by_units` includes `deployment-command`.
  - `cross_unit_state.yaml`: flows touching `deployment-command`.
- Before DONE report: artifacts read, preserved deployment/export behavior, unresolved contracts, and test/build/runtime evidence.
