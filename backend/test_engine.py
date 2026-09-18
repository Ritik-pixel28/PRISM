import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from simulator.engine import run
from functions.simulate.app import lambda_handler

ARCH = json.loads(
    (Path(__file__).resolve().parents[1] / "sample-data/architecture.json").read_text()
)


class EngineTests(unittest.TestCase):
    def test_traffic(self):
        for multiplier, add, status in [
            (1, 0, "HEALTHY"),
            (10, 5, "CRITICAL"),
            (20, 12, "CRITICAL"),
        ]:
            with self.subTest(multiplier=multiplier):
                result = run(ARCH, {"type": "traffic", "multiplier": multiplier})
                self.assertEqual((result["add_nodes"], result["status"]), (add, status))
                self.assertEqual(result["cost_delta"], add * 100)
                self.assertGreaterEqual(
                    result["current_capacity"] + add * 150, result["required_capacity"]
                )

    def test_single_compute_matches_guide(self):
        arch = copy.deepcopy(ARCH)
        arch["nodes"] = [n for n in arch["nodes"] if n["id"] != "ec2-b"]
        arch["edges"] = [
            e for e in arch["edges"] if "ec2-b" not in [e["source"], e["target"]]
        ]
        self.assertEqual(
            run(arch, {"type": "traffic", "multiplier": 10})["add_nodes"], 6
        )

    def test_no_compute(self):
        arch = {"nodes": [{"id": "rds", "type": "rds"}], "edges": []}
        result = run(arch, {"type": "traffic", "multiplier": 1})
        self.assertIsNone(result["utilization_pct"])
        self.assertEqual(result["add_nodes"], 1)

    def test_heterogeneous_capacity(self):
        arch = copy.deepcopy(ARCH)
        arch["nodes"][2]["capacity"] = 500
        result = run(arch, {"type": "traffic", "multiplier": 10})
        self.assertEqual(result["current_capacity"], 650)
        self.assertEqual(result["add_nodes"], 3)
        result = run(
            arch, {"type": "traffic", "multiplier": 10}, {"ec2_capacity_rps": 200}
        )
        self.assertEqual(result["current_capacity"], 400)

    def test_failure(self):
        result = run(ARCH, {"type": "failure", "node_id": "rds"})
        self.assertEqual(
            set(result["degraded"]), {"ec2-a", "ec2-b", "alb", "cloudfront"}
        )
        self.assertEqual(result["impact_pct"], 100)
        result = run(ARCH, {"type": "failure", "node_id": "cloudfront"})
        self.assertEqual(result["degraded"], [])

    def test_cost(self):
        result = run(ARCH, {"type": "cost", "budget": 380})
        self.assertEqual(result["affordable_nodes"], 1)
        self.assertEqual(result["cost_proposed"], 380)
        self.assertEqual(result["current_capacity"], 150)
        result = run(ARCH, {"type": "cost", "budget": 100})
        self.assertFalse(result["budget_feasible"])
        self.assertEqual(result["status"], "CRITICAL")
        result = run(ARCH, {"type": "cost", "budget": 1000}, {"ec2_cost_monthly": 0})
        self.assertEqual(result["affordable_nodes"], 2)

    def test_validation(self):
        for value in [0, -1, True, "10", float("nan"), float("inf")]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                run(ARCH, {"type": "traffic", "multiplier": value})
        with self.assertRaises(ValueError):
            run(ARCH, {"type": "failure", "node_id": "missing"})
        with self.assertRaises(ValueError):
            run(ARCH, {"type": "traffic", "multiplier": 1}, {"ec2_capacity_rps": 0})
        arch = copy.deepcopy(ARCH)
        arch["edges"].append({"source": "rds", "target": "cloudfront"})
        with self.assertRaises(ValueError):
            run(arch, {"type": "traffic", "multiplier": 1})

    def test_handler(self):
        for body in ["no", "null", "{}", "[]"]:
            self.assertEqual(lambda_handler({"body": body})["statusCode"], 400)
        self.assertEqual(lambda_handler({"httpMethod": "OPTIONS"})["statusCode"], 204)
        self.assertEqual(lambda_handler({"httpMethod": "GET"})["statusCode"], 405)
        with patch("functions.simulate.app.explain", return_value=None):
            response = lambda_handler(
                {
                    "body": json.dumps(
                        {
                            "architecture": ARCH,
                            "scenario": {"type": "traffic", "multiplier": 10},
                        }
                    )
                }
            )
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(
            json.loads(response["body"])["explanation_source"], "deterministic"
        )


if __name__ == "__main__":
    unittest.main()
