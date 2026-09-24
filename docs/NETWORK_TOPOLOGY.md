# Self-service network topology

Open Rack Manager, choose a project, and select **網路拓樸** beside
the existing Rack views. Each project owns an independent saved document and can
contain multiple named topology racks. These are wiring workspaces, not changes
to physical U placement or inventory membership.

This is now the single Rack wiring workspace. The old separate **機櫃拓樸** Rack
card/entry, which could remain empty while the saved network topology contained
data, has been removed from the Rack UI.

## Build a rack

1. Add and name a Rack.
2. Choose **從專案加入設備** and select the existing equipment. For each imported
   server, the default automatic mode reads that machine's `os` array: every valid
   OS Slot becomes one editable topology node, `slot.ip` becomes Host OS IP, and
   `slot.bmc_ip` becomes Host BMC IP. A mixed selection can therefore create a
   different node count for each server. If a server has no valid OS Slot array,
   the editable 1-64 manual node count is used as its fallback. Manual mode can
   also force the same chosen count for all selected servers. Non-server equipment
   never infers nodes from OS Slots. Alternatively, add a custom device.
3. The **Vera preset (editable)** starts at four nodes with BF4 pairing enabled;
   the count and DPU choice remain editable before applying. It gives each server editable
   Node/DPU pairs. RJ45 #1 maps to its Host nodes; RJ45 #2 maps to its
   DPU nodes when DPU creation is enabled. Without DPUs, only RJ45 #1 is created. Other hardware can start empty and use any number of custom nodes
   and ports within the documented limits.
4. Expand a device to add, edit or delete nodes and ports. Node entries contain
   a paired DPU label plus Host OS/BMC and DPU OS/BMC IP annotations. Shared BMC
   addresses may be repeated; separate BMCs are not assumed. Port mappings can
   reference multiple nodes.
5. Choose **配對連線**, select both devices and both physical ports, a network
   role, confirmation state and an optional cable/VLAN note. Besides Host, DPU,
   data and switch-uplink roles, `power` represents Power Shelf management and
   `cooling` represents CDU management.
6. Use **Save topology** (儲存拓樸) to persist the entire project document.
   Applying an editor form changes the draft; it does not save to the server.

## Naboo confirmed wiring

The saved Naboo plan contains 38 devices, 128 server nodes and 69 confirmed
physical cables. The port allocation is:

- Switch-2201-1 ports 1-32: 32 Server Host-management RJ45 cables.
- Switch-2201-2 ports 1-32: 32 Server DPU-management RJ45 cables.
- Switch-2201-1 ports 33-35: `power-shelf-1` through `power-shelf-3` management.
- Switch-2201-1 port 36: `CDU-1-main` management.
- Port 48 on both switches: the switch interconnect.

Each server still has four logical Host/BF4 nodes but only two shared physical
RJ45 cables, so four nodes do not create eight separate cables. Switch-2201-1
ports 37-47 and Switch-2201-2 ports 33-47 remain available in this plan.

For a new Rack, specify the actual switch port count; names initially run from 1
to that count and can be edited individually. At least one additional physical
port is needed for a switch interconnect beyond the server-facing ports.

- Batch wire the selected servers' Host management ports to Switch A, starting
  at the desired switch port list position.
- Repeat with DPU management and Switch B.
- Add Switch A to Switch B manually using their actual free ports. Leave it
  **planned / unverified** until the cabling is confirmed.

Batch order matches the server checkbox list. No existing cable is overwritten:
the whole batch is rejected if a selected server has zero/multiple ports for
that role, a port is occupied, or the switch has insufficient ports. Review the
resulting connection list before saving. The default batch state is planned.

## Reading and maintaining the diagram

Use the network filter to isolate Host, DPU, Power Shelf, CDU, data or
inter-switch wiring.
Click a device in the diagram or expand its card to highlight its paths and
inspect logical node mappings. The connection list identifies exact ports.
Solid lines mean manually confirmed cabling; dashed lines mean planned cabling.
Neither reports carrier status, LLDP discovery, VLAN reachability or redundancy. The project
topology can run an on-demand ICMP Ping sweep against the applicable IPs in a Rack.

Devices imported from inventory are explicitly snapshots for topology planning.
Renaming/moving/deleting inventory does not silently rewrite these diagrams;
edit the topology device label or remove it as needed. Existing legacy `/api/links`
records are not automatically converted. There is no new device action,
credential storage or OS/BMC operational target. Ping results are transient and
do not modify inventory, topology data or device network settings.

## IP reachability check

Save the topology, choose a Rack and click `檢查 IP`. Servers check Host OS only,
using this ordered source policy: saved topology Host OS nodes first, inventory
OS Slots second, then the legacy primary OS IP as fallback. When only some saved
nodes have Host OS values, the matching saved values win and inventory OS Slots
fill the missing nodes. Host BMC, DPU OS and DPU BMC fields remain editable
topology annotations, but they are not probed by this check. A partial server
result means at least one Host OS node answered and at least one did not.

Switches, Power Shelves, CDUs and other non-server devices check one primary
inventory management IP. The OS IP is preferred and the BMC IP is used when no
OS IP is available. The result panel always states the truth: not checked yet,
no usable IP, all configured targets reachable, or failures. A failure summary
names the server/device, the failed server node when applicable, and the failed
IP. Detailed failures stay in this compact summary instead of being written over
individual cable paths.

The backend de-duplicates addresses, checks up to 2048 unique IPs (4096 mapped
fields) with bounded parallelism, and retries a failed ICMP probe once. Failure,
partial and unconfigured filters remain available. A green result confirms only
that the IP answered ICMP at that moment; it does not prove the documented switch
port or cable path.

Deleting a topology device/port removes its dependent cables after confirmation.
Deleting a node removes its port mappings. Deleting a Rack affects that topology
Rack only. Unapplied forms and unsaved drafts prompt before discard/close.

Each save uses a revision check. On a conflicting save, the draft stays visible;
export it as JSON before reloading the newest saved document. Export is a draft
backup for reference; this version does not import arbitrary JSON files. Save
failure leaves the draft intact, while the backend rolls back memory and disk.
Project rename preserves the topology document and project metadata.

## Saved wiring in Rack 3D

After saving the network topology, close the editor and view the Rack in 3D. The
saved connections update immediately. Cable colors and routes are consistent:

- Host management is cyan in the left duct.
- DPU management is purple in the right duct.
- Power Shelf management is orange in the left duct.
- CDU management is teal/blue-green in the left duct.
- The switch interconnect is gold in the right duct. Data and uncategorized roles
  retain green and gray fallbacks.

Branches meet the equipment and switch sides as groups, without inventing exact
physical switch-port socket geometry. Use the wiring visibility button beside the
camera controls to hide or show these cables.

Only saved cables whose endpoints match installed inventory equipment are drawn. Custom
topology devices, missing inventory references and unplaced/passive endpoints are skipped;
the status note reports skipped records. Cables and cable ducts are created only when
the selected Rack has at least one drawable saved connection, so a Rack with no wiring
does not show empty ducts. Four logical nodes sharing one management RJ45 still produce
one physical cable. Naboo therefore shows 64 server-management cables, one switch
interconnect, three Power Shelf cables and one CDU cable: 69 total.

## Rack Ping and the 3D status lights

Click **Ping Rack** in Rack Manager after recording the IPs. Each applicable device
has one status light attached to the right side of its own front face. Its height follows
the equipment face, so the lights are not forced into a line on the Rack rail. Internal
and external CDUs both have a light; blanking panels do not.

- Green blinking: every configured target for that device answered Ping.
- Red blinking: at least one configured target did not answer, including partial failure.
- Gray: not checked yet, or no usable target IP is configured.

For servers, Rack Ping uses the same ordered Host OS policy as `檢查 IP`: matching
saved topology nodes, inventory OS Slots for missing nodes, then the legacy primary
OS IP. A four-node tray therefore checks four Host OS addresses when those slots are
available; node count is not hard-coded. Server BMC/DPU reachability cannot mask a
failed Host OS.

Switches, CDUs, Power Shelves and other powered non-server devices use the inventory
management OS IP, or the BMC IP when OS IP is absent. Rack Ping omits blank panels, L10
and unplaced equipment. It uses at most 64 concurrent probes and supports 2048 unique
addresses / 4096 mapped node fields with one retry for failures.

The Rack header shows aggregate counts, followed by a compact success/failure panel
above the Rack content rather than over the 3D canvas. Failures list the device, failed
node when present and IP. The inspector also displays the result and check time. Results
are temporary and refresh only when Ping Rack is run; saving topology or switching
projects clears them. The lamps show ICMP reachability, not actual power readings or
proof of the documented cable path. Reduced-motion mode keeps their colors steady
instead of blinking.

## Storage and validation

`GET/PUT /api/projects/{name}/topology` stores the validated document in that
project's `topology` field using the existing atomic inventory persistence.
PUT requires the current integer `revision`. Limits per project: 32 topology
racks; per rack: 256 devices and 2048 cables; per device: 64 nodes and 256 ports.
Names/labels are limited to 160 characters. Node addresses must be IPv4/IPv6.
IDs are unique within their owning list. Physical ports allow one cable only;
multiple logical nodes can share a management port. Unknown fields, including
credentials, are not stored. Transactions assume the existing single-process
JSON backend; multi-worker deployment still requires shared transactional storage.

## Verification

- `python -m unittest discover -s qa -p '*regression.py'`
- `node qa/topology-browser.cjs`
- `node qa/topology-ip-summary.cjs`
- `node qa/rack-network-led.cjs`
- `node qa/core-scene.cjs` and `node qa/cdu-visuals.cjs`
- Existing operations/equipment regression and fixture-browser checks.

All tests use temporary storage or synthetic browser fixtures. The preview
fixture resets on page reload; production persistence is tested independently
through the real extracted storage handlers without launching device workers.
