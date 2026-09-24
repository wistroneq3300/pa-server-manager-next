PUBLICATION FOLLOW-UP 2026-09-24: User authorized commit/push after SSH port review. Current inventory OS SSH ports are 22; web BMC Terminal maps IPMI 623 to SSH 22. Explicit custom SSH ports remain supported; Terminal bridge service ports unchanged. This revision is prepared for publication; confirm origin/main for the final commit. No deployment performed.

LATEST 2026-09-24: Non-server management IP/SSH and R1-R4 are now implemented locally on 7a23ae6; not committed/pushed/deployed. Read SESSION_HANDOFF_EQUIPMENT_IP_R1_R4_20260924.md. Older pending-status statements below are historical; U7 remains deferred.

# Next project review fixes - 2026-09-24

LATEST STATUS: Functional changes in this document were committed and pushed as 7a23ae62fd9c076a453d519aa40e5423bc1a98aa after preserving dcd3f4f. Earlier LOCAL/UNCOMMITTED and permission-blocker notes below are historical. Read SESSION_HANDOFF_NEXT_ACTIONS_20260924.md for the consolidated state, R1-R4 pending findings and final CDU installation rules. No live deployment performed.

User authorized B1-B14 and U1-U6/U8; explicitly deferred U7.
All changes in this handoff are LOCAL and UNCOMMITTED. No deployment or device operation.

## Repository and boundaries

- Local HEAD: 48f3636ec0aada6b3c97700fb161f84c6e8d8628 (CDU feature).
- Prior browser inspection saw private GitHub main dcd3f4fcbf6ba70be7ecfcdef16e7572dc2c2e36; its latest change was inventory under prod-data, while code rows still referenced the prior code commits. This commit has NOT been fetched locally.
- Git CLI network is blocked; the GitHub connector lacks this private repo. Chrome can see it. Do not claim the local branch is synchronized or overwrite the user's uploaded inventory.
- Only Next. Original pa-server-manager, production inventory, service configuration, Terminal ports, Vera 32-tray architecture and DPU Ping remain untouched.
- Current request authorized fixing the review. No new commit/push performed.

## Implemented review findings

| ID | Change |
| --- | --- |
| B1 | Active OS synchronization clears unpaired BMC fields instead of inheriting another slot. |
| B2 | Deleting an active slot synchronizes the surviving primary before collapsing the OS list; deleting an earlier slot preserves the active identity. |
| B3 | IP mutations update both active slot and top-level fields; invalidate status/hardware caches. Active-slot edits also invalidate caches. |
| B4 | Existing-machine BMC discovery resolves SSH credentials on the server by machine_name; frontend no longer submits masked passwords. |
| B5 | IP mutation responses use masked machine serialization, including nested OS slots. |
| B6 | Inventory loads into candidates before replacement; malformed data raises an actionable error and blocks saves. No empty-data overwrite. Recovery is operator backup restoration/restart, plus a read-only UI retry. |
| B7 | Rack component listing and history use one membership rule: mounted devices plus external CDU, excluding blanking/unplaced systems. |
| B8 | Detail/sensor responses check view, request generation and target identity. Sensor refresh flag is consumed once. |
| B9 | SSH refused/closed/broken no longer reports reboot success; disconnect is explicitly unconfirmed. |
| B10 | Loading inventory never auto-assigns or persists missing U positions. |
| B11 | KVM reopening disposes existing clients; generation checks cancel late detection, event callbacks and polling. |
| B12 | Forced firmware refresh actually starts collection; background results use target snapshots. Frontend polls loading results without repeatedly forcing refresh. |
| B13 | Unobserved OS connectivity is null; source/configuration/time metadata distinguishes unknown from failed ping. |
| B14 | Secret-store TTL uses monotonic elapsed time with a lock; unused plaintext staging tempfile removed. |

## UX

- U1: ICMP source/time, stale observations and separate observed SSH success/authentication/connection failure. Missing source timestamps are not fabricated.
- U2: persistent selected OS/IP/paired BMC card, Terminal dialog target, power confirmation target. Power requests carry expected_target and server returns 409 if changed; command execution uses a snapshot. Serial OS selection prevents overlapping UI requests. This retains the existing shared active_os architecture.
- U3: sequential power batch progress, per-device result, cancel unsent requests, retry only failed rows after confirmation. Closing a running batch requests cancellation, preserving the in-flight result. Accepted command is not labelled completed power transition.
- U4: U-range preview and collision links for move/add/internal CDU; invalid placement disables save.
- U5: CDU overview and telemetry placeholder show management IP, internal/external installation, unsupported collector. Remove server-only controls/tabs/diagnostics from CDU detail; omit CDU from on/off batches. Backend CDU detail does not run server inventory SSH commands. External placement label fixed in list view.
- U6: hardware category search, counts, collapse/expand, visible-table copy and automatic expansion on category navigation.
- U8: dialog actions await returned promises, prevent duplicate submit, show processing state and inline errors while preserving input. Placement forms use native required validation. Inventory failure gets an explicit retry/recovery explanation.
- U7: Rack Reboot/AUX placeholders and topology feature entry behavior stay unchanged.

## Validation

- qa/operations_regression.py: 12 tests passed.
- qa/reliability_regression.py: 13 tests passed.
- qa/cdu_placement_regression.py: 10 tests passed.
- qa/operations_regression.cjs: stale navigation/slot response, no auto-placement writes, placement bounds/overlap, batch cancellation/error/target snapshot, KVM cleanup/cancelled detection passed.
- Python AST and changed JS syntax checks passed; git diff --check passed.
- Chrome with the connected browser: hardware search/collapse (1/2 storage rows), 4U->5U collision disables save and identifies SERVER-03U, fixture-only batch result, final CDU overview verified visually. No live power command was sent.
- Standalone Playwright launch was blocked (spawn EPERM); prior broad acceptance suite was not rerun. Connected Chrome was used instead; do not claim all browser suites passed.
- Windows restricted runner rejects tempfile's private-directory ACL; qa/test_support.py uses inherited workspace ACL for synthetic temporary test data, preserving real atomic-save/concurrency tests. qa/tmp is ignored; a few empty diagnostic directories may remain because automatic policy rejected cleanup. No inventory/credentials were written there.

## Preview / files

- serve.py --port 8891 serves current files with synthetic fixtures only. Existing 8769 preview may be stale.
- New UI files: static/js/operations-ux.js and static/css/operations-ux.css, linked after engineering-ux in index.
- New offline tests: qa/operations_regression.py, qa/operations_regression.cjs; shared QA scratch helper qa/test_support.py.
- Real SSH/BMC/KVM behavior still requires an authorized reachable integration environment; no services were restarted.


## Second workflow review and placement fix (latest turn)

User explicitly requested fixing immutable L11 specifications, commit/push, then another serious review.
The earlier workspace permission blocker was resolved by enabling Full access. Remote main dcd3f4f was fetched before commit/rebase so the user's inventory uploads remain intact.

Implemented locally:
- Rack add/move/unmount now use PATCH /api/machines/{name}/placement with rack_u and expected_project only. Backend reads stored specifications, rejects extra fields and stale project selection, validates actual span/collisions.
- L11 type, size and installation form fixed after creation; generic PATCH cannot override them. Existing CDU installation selector/size are read-only. New external CDU still asks no U size; internal CDU remains bottom-only.
- Add dialog displays actual type (including blanking/PDU) and exact stored height, disabled; move dialog shows read-only specifications and U selector.
- L10/L11 roundtrip preserves existing type/height and clears placement; promotion no longer guesses an occupied 1U slot.
- CDU management display uses stored bmc_ip with os_ip fallback for legacy fixtures.
- Preview fixture enforces placement contract; placement labels updated.

Validation: 39 Python regression tests pass, including 4 new placement lifecycle cases spanning blanking/PDU/server/switch, 2-8U and existing 48U boundary cases. Offline JS regression checks placement request contains only rack_u/expected_project, plus prior async/batch/KVM regressions. Node syntax checks pass. Chrome confirmed a 5U blanking panel move form displays fixed Blank Panel / 5U with only U editable. Browser end-to-end unmount/readd was interrupted by browser control timeout; do not claim complete Chrome lifecycle verification. Backend lifecycle is tested with isolated storage, no live hardware.

### Newly confirmed remaining findings (review results, not yet fixed)

| Priority | Workflow | Evidence / effect | Proposed correction |
| --- | --- | --- | --- |
| High | Generic BMC edit -> OS selection/sync | main.py edit_machine updates top-level bmc_ip but leaves active os entry unchanged. Isolated real-handler repro: new top-level .3, active slot still .2; _sync_active_os can restore old target. Dedicated change-IP endpoints were fixed previously, generic PATCH remains. | Route BMC changes through one active-slot-aware mutation and invalidate target caches. |
| Medium | Passive L11 -> demote L10 | Real-handler repro leaves level=system, passive=True. app.js isRackItem returns true for passive, while rack membership requires level=rack. UI/backend disagree; component can disappear from Rack while still listed L11. | Disallow L10 conversion for non-server passive equipment, enforce backend too. |
| Medium | CDU detail -> Rack list | app.js rackDevicesHtml uses presence of os_ip to show generic Terminal/power. Chrome fixture CDU row displayed both despite CDU detail intentionally omitting server controls. Imported CDU with os_ip triggers same path. | Shared capability policy across detail/list/batch, not IP presence alone. |
| Medium | Imported legacy equipment without mgx_type | app.js mgxTypeOf uses substring sw/cdu; telemetry_core.kind_of uses startswith for these. Example rack-cdu-01 can be CDU in UI but server backend. | Shared normalization at import/load, preserve explicit type and report ambiguous metadata. |

U7 remains deferred. Original repository, production files, Terminal ports, 32x4 architecture, DPU Ping untouched. Remaining findings are not proven live-production incidents; reproductions used fixtures/isolated handlers only.


## Urgent follow-up: external CDU -> internal CDU
User explicitly requested switching installed external CDU into rack. Earlier locking the installation form was too broad; superseded here.
- Explicit CDU installation settings entry in rack inspector and list.
- Dedicated /api/machines/{name}/cdu-installation permits external/internal conversion while generic placement/spec editing stays locked.
- External -> internal asks height and occupies U1 through chosen height; rejects occupied bottom, preserves identity/management data. Internal same-form resizing remains locked.
- Strict project/payload checks, transactional validation/save; preview fixture mirrors contract.
- 41 backend tests passed (conversion/conflict/identity/stale project/disk rollback included); changed JS syntax passed. No live deployment or production mutation.
