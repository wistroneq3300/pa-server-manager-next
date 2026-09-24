---
name: pa-manager
description: Continue, modify and verify PA Server Manager Next with its persisted project status. Use for PA Manager Next implementation, review and maintenance in the Next repository; not for operating the original production repository.
---

# PA Server Manager Next

Read repository-root `AGENTS.md` and `PROJECT_STATUS.md`. They contain standing boundaries
and the latest continuation state. Do not ask the user to paste historical handoffs.
Confirm the repo is `wistroneq3300/pa-server-manager-next` and preserve local changes before
work. Use the current checkout rather than hard-coding a prior agent's machine path.

## Route the requested change

- API/storage/active OS: `main.py`; keep active OS and top-level target data consistent.
- Telemetry: `telemetry_core.py`; collector placeholders are not live device integrations.
- Type/capability/IP/SSH: `equipment_policy.py`, `static/js/equipment-rules.js`,
  `static/js/equipment-connections.js`, `static/js/app.js`, `static/js/operations-ux.js`.
- L11/CDU placement: dedicated placement and cdu-installation endpoints in `main.py`.
- Terminal transport: `terminal_bridge/server.js`; do not confuse SSH ports with listener ports.
- KVM: `kvm_bridge.py`, `spx_kvm_broker/`, `static/js/kvm_broadcast.js`; read relevant docs
  only when that workflow is requested. Old live-device successes are not current evidence.
- Test-library changes: inspect `.agents/skills/pa-library-review/SKILL.md` when present;
  preserve source workbooks and follow the current task's data/output scope.

## Verify proportionally

For backend behavior changes, run isolated tests, not an import that starts production
workers or reads/writes live storage:

```text
python -m unittest discover -s qa -p '*regression.py'
```

For operation or equipment frontend changes, use the relevant offline checks:

```text
node qa/operations_regression.cjs
node qa/equipment_regression.cjs
node qa/equipment-browser.cjs
```

The browser test starts and stops an ephemeral loopback fixture server; it does not prove
live device connectivity. Check changed JS with `node --check`, Python with AST parsing,
and the diff with `git diff --check`. Documentation-only changes need document/skill
validation, not the full device workflow suite.

If Python/Node are not on PATH, inspect available runtimes. On the current Windows host,
the last working root was `C:/Users/kobei/.cache/codex-runtimes/codex-primary-runtime/dependencies/`
with `python/python.exe` and `node/bin/node.exe`. Browser QA currently also references this
runtime and Chrome; adjust test tooling for another host rather than treating it as a product bug.

## Finish and continue

Update root `PROJECT_STATUS.md` in place after meaningful work. Record what actually changed,
tests actually run, pending decisions, and whether changes are local, committed, pushed or
deployed. Respect AGENTS.md's publication boundaries. Do not append another startup checklist
or create a new dated handoff by default. Historical evidence stays in existing dated files.
