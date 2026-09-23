"""Offline evidence for open findings; extracts functions without importing the app.
No live API, credentials, files, hardware or network connections are used.
These assertions document current defects, NOT desired production behavior.
"""
import ast
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def extract(file, name, scope):
    tree = ast.parse((ROOT / file).read_text(encoding="utf-8-sig"))
    node = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == name)
    node.decorator_list = []
    exec(compile(ast.Module(body=[node], type_ignores=[]), file, "exec"), scope)
    return scope[name]


class FakeConnection:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def execute(self, *args):
        return self

    def fetchall(self):
        minute = int(time.time() // 60) * 60 - 60
        return [dict(ts=minute + i * 15, machine="sample-pdu", kind="pdu", metric="power_w", value=100)
                for i in range(4)]


scope = dict(time=time, os=os, _conn=FakeConnection,
             _load_machines=lambda: {"sample-pdu": dict(project="fixture", level="rack", rack_u=1)},
             kind_of=lambda m, n: "pdu", RACK_METRIC_DEF={})
result = extract("telemetry_core.py", "get_rack_series", scope)("fixture", 60)
assert result["pdu"]["history"]["power_w"]["values"] == [400]
print("CONFIRMED R1: four 100 W samples become 400 W, instead of a 100 W device-minute value")


class ApiError(Exception):
    pass


scope = dict(machines={"sample": dict(project="fixture", level="rack", rack_u=10, rack_size=1)},
             projects={"fixture": {}}, HTTPException=ApiError, _save_data=lambda: None,
             _bmc_safe=lambda m: dict(m))
result = extract("main.py", "edit_machine", scope)("sample", dict(rack_u=2, rack_size=4))
assert result["ok"] and result["machine"]["rack_u"] - result["machine"]["rack_size"] + 1 == -1
print("CONFIRMED R2: PATCH accepts a 4U component at U2, extending below U1")


def denied(*args, **kwargs):
    raise PermissionError("simulated write failure")


messages = []
scope = dict(DATA_FILE="unused", open=denied, print=lambda *args: messages.append(args))
assert extract("main.py", "_save_data", scope)() is None
assert messages
print("CONFIRMED R3: persistence failure is swallowed instead of reported to the caller")
