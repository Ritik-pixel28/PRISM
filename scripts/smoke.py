import argparse
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def request(url, body=None):
    headers = {"Content-Type": "application/json"} if body is not None else {}
    try:
        with urlopen(Request(url, data=body, headers=headers), timeout=25) as response:
            return response.status, response.read()
    except HTTPError as error:
        return error.code, error.read()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:3000")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    architecture = json.loads(
        (Path(__file__).resolve().parents[1] / "sample-data/architecture.json").read_text()
    )
    status, page = request(base + "/")
    assert status == 200 and b"PRISM" in page, (status, "Frontend unavailable")
    cases = [
        ({"type": "traffic", "multiplier": 1}, {"status": "HEALTHY", "add_nodes": 0}),
        ({"type": "traffic", "multiplier": 10}, {"add_nodes": 5, "cost_delta": 500}),
        ({"type": "traffic", "multiplier": 20}, {"add_nodes": 12}),
        ({"type": "failure", "node_id": "rds"}, {"impact_pct": 100}),
        ({"type": "cost", "budget": 380}, {"cost_proposed": 380, "affordable_nodes": 1}),
    ]
    for scenario, expected in cases:
        payload = json.dumps({"architecture": architecture, "scenario": scenario}).encode()
        status, raw = request(base + "/api/simulate", payload)
        assert status == 200, (scenario, status, raw)
        result = json.loads(raw)
        for key, value in expected.items():
            assert result[key] == value, (scenario, key, result[key], value)
        assert result["math"] and result["explanation"]
        print(f"PASS {scenario}: explanation={result['explanation_source']}")
    status, _ = request(base + "/api/simulate", b"invalid json")
    assert status == 400, status
    print("PASS frontend, five scenarios and malformed request")


if __name__ == "__main__":
    main()
