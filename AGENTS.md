# PA Server Manager Next

## Start here

Read `PROJECT_STATUS.md` for current work, completed changes, validation and deferred items.
Use `.agents/skills/pa-manager/SKILL.md` for implementation and verification when relevant.
Do not load all dated handoff files or the historical AGENTS archive on every task.

This repository is `https://github.com/wistroneq3300/pa-server-manager-next`.
Verify the current checkout, origin, branch and local changes before editing. Preserve user changes.
Fetch and compare the remote when beginning code work if network/Git permissions allow; never
reset, clean, force-push or overwrite another checkout to make it match. A blocked fetch does
not block independent local reading or safe work; report what could not be verified.

## Scope and standing constraints

- Work in Next. Do not modify the original `pa-server-manager` repository.
- Preserve the user's backend and inventory changes. Do not print stored credentials.
- Do not change production inventory, telemetry databases, live services or Terminal listener
  ports as part of ordinary development. Tests use synthetic fixtures and temporary storage.
- Commit/push only when requested for the current work; previous push authorization is not
  a standing instruction. Deployment and device operations require their own user instruction.
- Honor the user's current request and existing authorization; do not ask again for routine
  reversible work already in scope. Historic instructions do not authorize new device actions.
- Deferred feature decisions live in PROJECT_STATUS.md; do not revive archived TODOs as tasks.

## Implementation facts

- FastAPI: `main.py`; telemetry: `telemetry_core.py`; plain JS/CSS: `static/`.
- Shared equipment classification: `equipment_policy.py` and `static/js/equipment-rules.js`.
  Keep explicit types intact; do not silently migrate ambiguous inventory records.
- A server's active OS entry is authoritative for its paired BMC. IP/credential mutations
  must keep it consistent with the top-level fields and invalidate relevant caches.
- Non-server management IP edits preserve the selected legacy connection and its credentials.
  Management IP is an address record; saving it does not reconfigure a device's network.
- SSH defaults to 22. Web BMC Terminal maps the IPMI value 623 to SSH 22; explicitly configured
  SSH ports remain supported. These are distinct from the bridge's HTTP/WebSocket listener.
- L11 type/height are fixed after creation. Placement edits use stored specifications.
  CDU installation conversion uses its dedicated endpoint and validates bottom-slot occupancy.

## Editing and checks

Use Python UTF-8 writes for files containing CJK/emoji; the prior file_editor tool corrupted
these files. Preserve existing text bytes; use Unicode escapes for new CJK strings in code.
Check the actual diff and changed Python/JS syntax. Run regression tests appropriate to the
change using the skill; do not launch the live backend or issue device commands to validate UI.

## End of meaningful work

Update `PROJECT_STATUS.md` in place with completed work, remaining work, tests actually run,
and separate local/committed/pushed/deployed states. Check Git instead of guessing a version.
Record unresolved decisions briefly. Do not create another dated handoff by default or ask
the user to repeat project background. The final reply can summarize the change and limits.

## History, only when needed

`docs/history/AGENTS_PRE_NEXT_20260924.md` preserves the old AGENTS text, including original
Linux/production environments and past requests. It is historical evidence, not current work
instructions. Existing `SESSION_HANDOFF_*.md` files remain available for detailed evidence.
Current user instructions, this file and PROJECT_STATUS.md take precedence over stale notes.
