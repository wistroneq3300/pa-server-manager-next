# Self-service network topology

Open Rack Manager, choose a project, and select **Networking Topology** beside
the existing Rack views. Each project owns an independent saved document and can
contain multiple named topology racks. These are wiring workspaces, not changes
to physical U placement or inventory membership.

## Build a rack

1. Add and name a Rack.
2. Choose **Add inventory** (從專案加入設備), select the existing equipment, and
   choose the server template and node count. Alternatively add a custom device.
   Custom is the default: 1-64 nodes per server, with optional one-DPU-per-node
   creation and a configurable DPU model label. Import different groups separately
   when their node counts differ; individual devices can then be edited independently.
3. The **Vera preset (editable)** starts at four nodes with BF4 pairing enabled;
   the count and DPU choice remain editable before applying. It gives each server editable
   Node/DPU pairs. RJ45 #1 maps to its Host nodes; RJ45 #2 maps to its
   DPU nodes when DPU creation is enabled. Without DPUs, only RJ45 #1 is created. Other hardware can start empty and use any number of custom nodes
   and ports within the documented limits.
4. Expand a device to add, edit or delete nodes and ports. Node entries contain
   a paired DPU label plus Host OS/BMC and DPU OS/BMC IP annotations. Shared BMC
   addresses may be repeated; separate BMCs are not assumed. Port mappings can
   reference multiple nodes.
5. Choose **Connect ports** (配對連線), select both devices and both physical
   ports, a network role, confirmation state and an optional cable/VLAN note.
6. Use **Save topology** (儲存拓樸) to persist the entire project document.
   Applying an editor form changes the draft; it does not save to the server.

## Naboo-style batch wiring

Import the 32 servers with the four-node template and the two switches. Specify
the actual switch port count; names initially run from 1 to that count and can
be edited individually. At least one additional physical port is needed for a
switch interconnect beyond the 32 server-facing ports.

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

Use the network filter to isolate Host, DPU, data or inter-switch wiring.
Click a device in the diagram or expand its card to highlight its paths and
inspect logical node mappings. The connection list identifies exact ports.
Solid lines mean manually confirmed cabling; dashed lines mean planned cabling.
Neither reports carrier status, LLDP discovery, VLAN reachability or redundancy. The project
topology can run an on-demand ICMP Ping sweep against the fixed node IPs recorded in a Rack.

Devices imported from inventory are explicitly snapshots for topology planning.
Renaming/moving/deleting inventory does not silently rewrite these diagrams;
edit the topology device label or remove it as needed. Existing legacy `/api/links`
diagrams remain separate and are not automatically converted. There is no new
device action, credential storage or OS/BMC operational target. Ping results are transient and
do not modify inventory, topology data or device network settings.

## Fixed-IP Ping check

Save the topology, choose a Rack and click `檢查固定 IP`. The backend de-duplicates addresses,
checks up to 2048 unique IPs (4096 mapped fields) with bounded parallelism, and retries a failed
ICMP probe once. The UI rolls node results up to each RJ45 mapping and cable, then supports
failure, partial and unconfigured filters. A green result confirms only that the recorded IP
answered ICMP at that moment; it does not prove the documented switch port or cable path.

Deleting a topology device/port removes its dependent cables after confirmation.
Deleting a node removes its port mappings. Deleting a Rack affects that topology
Rack only. Unapplied forms and unsaved drafts prompt before discard/close.

Each save uses a revision check. On a conflicting save, the draft stays visible;
export it as JSON before reloading the newest saved document. Export is a draft
backup for reference; this version does not import arbitrary JSON files. Save
failure leaves the draft intact, while the backend rolls back memory and disk.
Project rename preserves the topology document and project metadata.

## Saved wiring in Rack 3D

After saving the network topology, close the editor and view the Rack in 3D. The saved
connections update immediately. Host management runs along the left cable duct; DPU
management and the switch interconnect run along the right. Branches meet the equipment
and switch sides as groups, without attempting exact physical port socket placement.
Use the wiring visibility button beside the camera controls to hide or show these cables.

Only saved cables whose endpoints match installed inventory equipment are drawn. Custom
topology devices, missing inventory references and unplaced/passive endpoints are skipped;
the status note reports skipped records. No automatic cables are generated for a CDU or
Power Shelf until their connections are configured and saved. Four logical nodes sharing
one management RJ45 still produce one physical cable: Naboo has 64 tray management cables
and one switch interconnect, not one cable for each node.

## Rack Ping and the 3D status lights

Click **Ping Rack** in Rack Manager after recording the fixed IPs. Each powered device has
one status light on its front right. Blanking panels have no light.

- Green blinking: every configured target for that device answered Ping.
- Red blinking: at least one configured target did not answer, including partial failure.
- Gray: not checked yet, or no usable target IP is configured.

For servers, this check uses every configured Host OS IP on matching saved topology nodes.
If none is configured, it uses the inventory OS IP. A four-node tray therefore checks four
OS addresses once those addresses are entered; node count is not hard-coded. Unconfigured
nodes cannot be tested: inspect the selected device's configured/reachable count to see
how many addresses were actually checked. Server BMC/DPU reachability does not override
the Host OS result. Use the topology editor's fixed-IP check for its broader node fields.

Switches, CDUs, Power Shelves and other powered non-server devices use the inventory
management OS IP, or the BMC IP when OS IP is absent. Rack Ping omits blank panels, L10
and unplaced equipment. It uses at most 64 concurrent probes and supports 2048 unique
addresses / 4096 mapped node fields with one retry for failures.

The inspector displays the result and check time. Results are temporary and refresh only
when Ping Rack is run; saving topology or switching projects clears them. The lamps show
ICMP reachability, not actual power readings or proof of the documented cable path.
Reduced-motion mode keeps their colors steady instead of blinking.

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
- `node qa/rack-network-led.cjs`
- `node qa/core-scene.cjs` and `node qa/cdu-visuals.cjs`
- Existing operations/equipment regression and fixture-browser checks.

All tests use temporary storage or synthetic browser fixtures. The preview
fixture resets on page reload; production persistence is tested independently
through the real extracted storage handlers without launching device workers.
