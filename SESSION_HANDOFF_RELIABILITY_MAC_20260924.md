# Next reliability and MAC increment - 2026-09-24

## Baseline and scope

- Only `https://github.com/wistroneq3300/pa-server-manager-next` was used.
- This task's directory was initially empty. Cloned Next, then fetched origin.
- HEAD and origin/main: `08f8a3eaf155ee16552e8b1a4cc8f3a7f8a60145`.
- Initial checkout was clean. This does not establish the state of other checkouts
  or the user's forthcoming FastAPI upload.
- User subsequently authorized commit/push of this increment to Next main.
  No deployment is authorized or performed; see git log for the resulting commit.
- No Terminal settings changed. Device SSH (normally 22), IPMI (623) and the
  internal Terminal bridge service port are separate concepts.

## R1-R3 changes

- `_save_data` now uses a unique temporary file in the data directory, preserves
  existing file permissions, flushes/fsyncs, and replaces the destination atomically.
  Failures raise HTTP 503 instead of returning success; temporary files are cleaned.
- All 17 inventory mutation handlers share an RLock and a rollback snapshot of
  machines/projects/links/sequence. Validation and write failures restore memory.
  This remains a **single application process** JSON store. It does not solve
  cross-process writes. Slow SSH validation currently holds the writer lock.
- Rack create/edit validate integer U values, complete downward U ranges,
  project existence and overlap before persistence. U0 remains unplaced.
  `rack_side` allows front/rear; both faces share occupancy because the model has
  no equipment depth metadata and the current plane view shares U slots.
  PATCH validates a candidate copy, so rejected placement cannot retain a project change.
- Telemetry computes each device's arithmetic mean per minute, then aggregates
  those representatives by metric. Missing minutes are omitted, never zero-filled
  or carried forward. Contributor counts are returned. PDU/Power Shelf remain
  separate kinds, not a new combined total. This is power, not energy integration.
- `qa/review_reproductions.py` now runs desired-behavior regressions; the original
  defect demonstrations remain available in baseline git history.

## MAC evidence

- `network_identity.py` parses `ip a` by interface block and exact IP address.
- BMC MAC requires a matching IP and MAC within one explicitly identified
  `ipmitool lan print <channel>` block. Ambiguous matches return unknown.
- Read-only channel queries use OS SSH first, then BMC SSH when needed. A legacy
  stored IPMI port 623 is not used as SSH; this follows the existing Terminal
  distinction and does not modify saved port settings or the bridge.
- Collection is background work; each channel has a 2-second timeout and each
  SSH collection is bounded. Missing tools/credentials/output leave unknown values.
- Cache is keyed by machine, selected OS, OS IP/port and BMC IP, with a 60-second
  lifetime. The UI also checks evidence IP against the displayed IP, preventing
  old-slot/old-IP MAC evidence from appearing next to a new address.
- Both original and product detail renderers show MAC or the localized unknown
  label. Frontend resource versions were bumped.

## Cabling layout preview only

The requested new cabling/OS-Ping workspace is **not implemented** in production.
Existing legacy links/topology remain unchanged. A responsive in-conversation
preview is provided separately: desktop rack / diagram / selected route / table;
mobile diagram / selected route / table. It uses documentation-only IPs and
explicitly simulated Ping. It performs no API calls, discovery or persistence.

Next: confirm layout; implement manual endpoints and cable IDs, OS-only checks,
selected-route re-Ping/details using existing OS Ping semantics. Green/red/gray
means endpoint OS reachability/unreachability/not checked. Never label this
Link Up/Down or cable failure. Do not add switch-port discovery or BMC Ping.

## Verification and boundaries

- `python qa/reliability_regression.py`: 13/13 isolated tests passed, including
  save/create/fsync failures, rollback, concurrent placement, U boundaries,
  overlap, aggregation with unequal sampling, and MAC/IP/channel matching.
  These extract actual functions via AST and use temporary storage/mocked SSH;
  they are not full FastAPI HTTP contract tests.
- `node qa/acceptance.cjs`: 23/23 fixture groups passed on the dedicated checkout
  preview `http://127.0.0.1:8879`. The older 8769 preview was not used as final evidence.
  One prior run hit a screenshot write error; the subsequent complete run passed.
- `node qa/engineering-ux.cjs`: passed.
- `node qa/mac_preview.cjs`: checks unknown/known MAC, IP evidence mismatch,
  cabling selection and simulated status at 1024/390/320px, no page overflow.
- Python AST and JavaScript syntax checks pass. No formal FastAPI dependencies
  are installed here, and no production equipment was contacted.
- Generated QA images and JSON are fixture evidence only, never production data.

## Next FastAPI upload

Preserve this small increment separately. Diff the uploaded backend against the
baseline and merge intentionally; do not overwrite the user's backend with this
checkout. Review worker count, storage permissions, deployment settings and real
read-only MAC collection first. Keep production PA_DATA_DIR untouched by samples.
Terminal integration remains deferred until that upload.

## OS Slots review and Vera design follow-up

- Existing Rack-only OS Slots stores one Host OS/BMC pair per slot. Preserve this
  foundation; evolve each physical C2 slot into a node with Host and BF4 endpoints.
- User-provided planned configuration: 32 trays x 4 C2 nodes x 4 endpoint roles
  (Host OS, Host BMC, DPU OS, DPU BMC) = 512 IPs. This is design input, not discovered inventory.
- Current select-os persists active_os globally and mirrors its credentials into
  machine-level fields. Future multi-node operations should specify stable node
  and endpoint IDs; browser selection must not change another operator's target.
- Current _sync_active_os retains the previous BMC when the next slot lacks bmc_ip.
  Fix this explicitly during node migration; missing BMC must remain unknown,
  never inherit another node's controller. No slot behavior changed in this increment.
- Keep stable node IDs separate from display slot numbers (deletion currently
  renumbers slots). Telemetry/cache keys should include node and endpoint identity.
- Design-only fragments are archived under qa/previews; not loaded by production.
  The cabling regression now reads the repository copy, not a user-specific path.
- Formal Vera endpoint management and cabling remain unimplemented pending design
  agreement and the user's latest backend.
