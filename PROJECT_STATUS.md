# PA Server Manager Next - Current Status

Updated: 2026-09-24. PROJECT_STATUS.md is the single maintained continuation record.

## Repository and delivery

- Repository: https://github.com/wistroneq3300/pa-server-manager-next
- Known checkout: C:/Users/kobei/Documents/Codex/2026-09-24/pa-server-manager-next-https-github
  Prefer the current verified checkout if this project moves or runs on another host.
- Latest verified functional commit: `9fc67df792a2180a74a92a1fb5068e281b74af4c` on `main`.
- That functional commit was pushed and verified using `git ls-remote` on 2026-09-24.
- No deployment or production service restart was performed. Pushed does not mean live.
- Documentation/skill consolidation is included in the commit introducing this status file.
  User authorized publication on 2026-09-24. Check HEAD and origin/main for the current
  documentation revision and remote delivery; the functional baseline above is separate.

## Completed

- `7a23ae6`: L11 immutable specifications and placement endpoint, explicit external/internal
  CDU conversion, first review B1-B14 and U1-U6/U8.
- `9fc67df`: non-server management IP changes and SSH Terminal, plus R1-R4:
  - R1: generic BMC PATCH synchronizes the selected OS pairing and invalidates caches.
  - R2: non-server/passive equipment cannot demote to L10; server roundtrip remains supported.
  - R3: list/detail/on-off batch capability checks agree; preserve explicit custom on/off
    commands while preventing generic server power fallback on non-server equipment.
  - R4: frontend/backend share classification rules. Explicit type wins; uncertain legacy
    records are flagged for confirmation without rewriting inventory. Internal unknown-kind
    fallback remains server-compatible, but the UI flags uncertainty and restricts power.
- Non-server management IP accepts IPv4/IPv6 syntax without Ping/hostname/BMC probing.
  It changes only the chosen legacy os/bmc connection, preserves credentials and the other
  address, checks expected_ip, rolls back failed saves and clears caches.
- SSH selects that connection's own address/credentials; missing credentials can be entered.
  Blanking panels expose neither IP settings nor Terminal. Current recorded OS and OS-slot
  SSH ports are 22; BMC web Terminal maps IPMI 623 to 22 and retains custom SSH support.

## Pending and deliberately deferred

- No remaining implementation task was assigned after R1-R4; take the user's next request.
- U7: Rack Reboot, AUX and some topology entry workflows remain deferred.
- 32 machines x 4 nodes architecture remains undecided; do not implement it yet.
- Do not add DPU OS/BMC Ping to single-machine detail.
- Non-server real telemetry collectors still need device-specific integration; do not claim
  CDU water flow/temperature/pressure visuals are live measurements.
- Deployment/live device validation has not been requested. Do not execute historical Linux
  service commands or hardware actions from old notes.

## Last verified tests (functional revision above)

- 49 isolated Python regression tests passed:
  `python -m unittest discover -s qa -p '*regression.py'`.
- `node qa/operations_regression.cjs` and `node qa/equipment_regression.cjs` passed.
- `node qa/equipment-browser.cjs` passed with Chrome and loopback synthetic preview:
  IP save/reload, selected SSH target, CDU detail/list capability, zero page errors.
- Changed Python AST, JS syntax and `git diff --check` passed.
- Screenshots: `qa/artifacts/equipment-ssh.png`, `qa/artifacts/equipment-detail.png`.
- No real SSH/BMC/power command tests; no deployed-service verification.

## References on demand

- Equipment implementation evidence: `SESSION_HANDOFF_EQUIPMENT_IP_R1_R4_20260924.md`.
- L11/CDU and first review evidence: `SESSION_HANDOFF_NEXT_ACTIONS_20260924.md` and
  `SESSION_HANDOFF_PROJECT_REVIEW_20260924.md`. Their pending/unpushed notes are historical.
- Original project context: `docs/history/AGENTS_PRE_NEXT_20260924.md`; read only for a
  relevant historical question, not as a startup checklist.

## Continuation convention

When asked to continue PA Manager Next, read AGENTS.md and this file, verify Git, then work
on the new request. Update this file at the end of meaningful work; do not require a pasted
handoff. A project skill can be invoked explicitly as `$pa-manager` when it is available.
