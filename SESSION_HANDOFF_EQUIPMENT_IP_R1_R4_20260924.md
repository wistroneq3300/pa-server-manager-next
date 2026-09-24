PUBLICATION FOLLOW-UP 2026-09-24: User authorized commit/push after SSH port review. Current inventory OS SSH ports are 22; web BMC Terminal maps IPMI 623 to SSH 22. Explicit custom SSH ports remain supported; Terminal bridge service ports unchanged. This revision is prepared for publication; confirm origin/main for the final commit. No deployment performed.

# Equipment IP / R1-R4 implementation - 2026-09-24

Local changes on top of 7a23ae6; not committed, pushed or deployed.
The user's existing three handoff-file modifications remain preserved below the new status notes.

## Implemented
- Non-server IP settings use PATCH /api/machines/{name}/management-ip. IPv4/IPv6 syntax validation only; no Ping, hostname, SSH or BMC discovery. Changes only the selected legacy os/bmc address, retaining credentials, other address, rack identity and placement. Compare expected_ip, transactional save/rollback, invalidate caches. No inventory migration.
- Non-server SSH dialog selects an existing management connection, uses its own saved credentials, asks for missing credentials, and opens only that target. IP settings and SSH are available in list/detail. Blanking has neither.
- R1: generic BMC PATCH synchronizes supplied BMC fields to active OS and clears caches. Switching OS back retains edited values.
- R2: non-server/passive equipment cannot demote to L10; server roundtrip remains supported.
- R3: shared frontend capability checks on list/detail/on-off batches; backend refuses generic non-server power commands. Explicitly configured custom on/off commands remain available per action. Rack Reboot/AUX/topology (U7) remain deferred.
- R4: Python and browser read the same equipment-rules.js JSON payload. Explicit valid type wins, token matching handles rack-cdu-01/pdu/sw, conflicting/unrecognized names show type-needs-confirmation and do not receive server power capability. No stored type is rewritten. Legacy unknown kind retains server fallback internally for schema compatibility; the UI explicitly flags it and restricts power.

## Validation
- 49 isolated Python regression tests passed (including new mutation, rollback, classification and capability cases).
- qa/equipment_regression.cjs: shared Python/JS classification parity, selected IP payload and SSH target passed.
- qa/operations_regression.cjs: existing async, batch, placement and KVM regressions passed.
- qa/equipment-browser.cjs: Chrome with loopback ephemeral preview and synthetic data; IP save/reload, SSH target, CDU detail/list controls, zero page errors. Screenshots qa/artifacts/equipment-ssh.png and equipment-detail.png visually checked.
- No live SSH/BMC/device power tests, no deployed-service verification.

## Boundaries
Only pa-server-manager-next-https-github was changed. Original repo, Terminal bridge/listener ports, inventory data.json/prod-data, live services, U7, 32x4 architecture, and DPU Ping were not changed.
Full access is available again; adding a Codex project is not required to edit this repo. The task itself still points at a separate empty workspace; no project registration tool is available.

## Next
Review local changes and deploy only on user instruction. Commit/push were not requested in this implementation turn.
