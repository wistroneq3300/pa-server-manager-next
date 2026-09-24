"""Naboo topology generator regression; synthetic inventory only."""
import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("configure_naboo_topology", ROOT / "scripts" / "configure_naboo_topology.py")
module = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(module)


class NabooTopologyRegression(unittest.TestCase):
    def inventory(self):
        machines = {}
        for index in range(1, 33):
            machines[f"naboo-{index:02d}"] = {"project": "Naboo", "level": "rack", "mgx_type": "server"}
        for index in range(1, 3):
            machines[f"Switch-{index}"] = {"project": "Naboo", "level": "rack", "mgx_type": "switch"}
        machines["not-in-rack"] = {"project": "Naboo", "level": "system", "mgx_type": "server"}
        return {"projects": {"Naboo": {"name": "Naboo"}}, "machines": machines}

    def test_builds_confirmed_32_by_4_topology(self):
        topology = module.build_topology(self.inventory())
        rack = topology["racks"][0]
        servers = [device for device in rack["devices"] if device["kind"] == "server"]
        switches = [device for device in rack["devices"] if device["kind"] == "switch"]
        self.assertEqual((len(servers), len(switches)), (32, 2))
        self.assertEqual(sum(len(server["nodes"]) for server in servers), 128)
        self.assertTrue(all(len(server["ports"]) == 2 for server in servers))
        self.assertTrue(all(len(port["nodes"]) == 4 for server in servers for port in server["ports"]))
        self.assertEqual(len(rack["links"]), 65)
        self.assertTrue(all(link["state"] == "confirmed" for link in rack["links"]))
        self.assertEqual({kind: sum(link["network"] == kind for link in rack["links"])
                          for kind in ("host", "dpu", "uplink")},
                         {"host": 32, "dpu": 32, "uplink": 1})

    def test_preserves_existing_node_ips_and_rejects_wrong_inventory(self):
        data = self.inventory(); first = module.build_topology(data)
        node = first["racks"][0]["devices"][2]["nodes"][0]
        node.update(host_os="192.0.2.10", dpu_bmc="2001:db8::10")
        data["projects"]["Naboo"]["topology"] = first
        rebuilt = module.build_topology(copy.deepcopy(data))
        restored = rebuilt["racks"][0]["devices"][2]["nodes"][0]
        self.assertEqual((restored["host_os"], restored["dpu_bmc"]), ("192.0.2.10", "2001:db8::10"))
        del data["machines"]["naboo-32"]
        with self.assertRaisesRegex(ValueError, "32 台伺服器"):
            module.build_topology(data)


if __name__ == "__main__":
    unittest.main()
