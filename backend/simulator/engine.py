import math

DEFAULTS = {
    "baseline_traffic_rps": 100,
    "ec2_capacity_rps": 150,
    "ec2_cost_monthly": 100,
    "rds_cost_monthly": 200,
    "alb_cost_monthly": 50,
    "cloudfront_cost_monthly": 30,
}


def number(value, name, minimum=0, maximum=1_000_000):
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or not minimum <= value <= maximum
    ):
        raise ValueError(
            f"{name} must be a finite number between {minimum} and {maximum}"
        )
    return value


def validate(arch, scenario, overrides):
    if (
        not isinstance(arch, dict)
        or not isinstance(scenario, dict)
        or not isinstance(overrides, dict)
    ):
        raise ValueError("Architecture, scenario and assumptions must be objects")
    nodes, edges = arch.get("nodes"), arch.get("edges")
    if (
        not isinstance(nodes, list)
        or not 1 <= len(nodes) <= 100
        or not isinstance(edges, list)
        or len(edges) > 500
    ):
        raise ValueError("Provide 1–100 nodes and at most 500 edges")
    ids = set()
    for node in nodes:
        if (
            not isinstance(node, dict)
            or not isinstance(node.get("id"), str)
            or not node["id"]
            or node["id"] in ids
        ):
            raise ValueError("Node IDs must be nonempty and unique")
        if node.get("type") not in {"ec2", "rds", "alb", "cloudfront"}:
            raise ValueError("Unsupported service type")
        if "capacity" in node:
            number(node["capacity"], "Node capacity", 1)
        ids.add(node["id"])
    children = {key: [] for key in ids}
    for edge in edges:
        if (
            not isinstance(edge, dict)
            or edge.get("source") not in ids
            or edge.get("target") not in ids
        ):
            raise ValueError("Every edge must reference existing nodes")
        children[edge["source"]].append(edge["target"])
    visiting, visited = set(), set()

    def visit(key):
        if key in visiting:
            raise ValueError("Architecture must be acyclic")
        if key in visited:
            return
        visiting.add(key)
        for child in children[key]:
            visit(child)
        visiting.remove(key)
        visited.add(key)

    for key in ids:
        visit(key)
    for key, value in overrides.items():
        if key not in DEFAULTS:
            raise ValueError(f"Unknown assumption: {key}")
        number(
            value, key, 1 if key in {"ec2_capacity_rps", "baseline_traffic_rps"} else 0
        )


def run(arch, scenario, overrides=None):
    overrides = {} if overrides is None else overrides
    validate(arch, scenario, overrides)
    baseline = arch.get("traffic", {}).get("baseline", 100)
    number(baseline, "Baseline traffic", 1)
    a = {**DEFAULTS, "baseline_traffic_rps": baseline, **overrides}
    nodes = arch["nodes"]
    computes = [n for n in nodes if n["type"] == "ec2"]
    capacities = [
        (
            a["ec2_capacity_rps"]
            if "ec2_capacity_rps" in overrides
            else n.get("capacity", a["ec2_capacity_rps"])
        )
        for n in computes
    ]
    capacity = sum(capacities)
    cost_lines = [
        {
            "service": t,
            "count": sum(n["type"] == t for n in nodes),
            "unit": a[f"{t}_cost_monthly"],
        }
        for t in ("cloudfront", "alb", "ec2", "rds")
    ]
    current_cost = sum(line["count"] * line["unit"] for line in cost_lines)
    result = {
        "assumptions": a,
        "cost_current": current_cost,
        "cost_proposed": current_cost,
        "cost_breakdown": cost_lines,
        "current_capacity": capacity,
        "required_capacity": a["baseline_traffic_rps"],
        "current_nodes": len(computes),
        "add_nodes": 0,
        "down": [],
        "degraded": [],
        "math": [],
        "model_version": "1.0",
        "limitations": [
            "Capacity and monthly costs are editable simulation assumptions, not AWS specifications or prices.",
            "Failure impact is conservative dependency reachability; alternate routes and automatic failover are not modeled.",
            "Compute capacity excludes database, network, cache and scaling-delay bottlenecks.",
        ],
    }
    kind = scenario.get("type")
    if kind == "traffic":
        multiplier = number(scenario.get("multiplier"), "Multiplier", 1, 100)
        demand = a["baseline_traffic_rps"] * multiplier
        deficit = max(0, demand - capacity)
        add = math.ceil(deficit / a["ec2_capacity_rps"])
        result.update(
            scenario=kind,
            multiplier=multiplier,
            required_capacity=demand,
            add_nodes=add,
            needed_nodes=len(computes) + add,
            cost_proposed=current_cost + add * a["ec2_cost_monthly"],
        )
        result["math"] = [
            f"Demand = {a['baseline_traffic_rps']:g} × {multiplier:g} = {demand:g} req/s",
            f"Current capacity = sum({', '.join(f'{c:g}' for c in capacities) or '0'}) = {capacity:g} req/s",
            f"Deficit = max(0, {demand:g} − {capacity:g}) = {deficit:g} req/s",
            f"Add = ceil({deficit:g} / {a['ec2_capacity_rps']:g}) = {add} compute units",
            f"Monthly delta = {add} × ${a['ec2_cost_monthly']:g} = ${add * a['ec2_cost_monthly']:g}",
        ]
        result["recommendation"] = (
            f"Add {add} compute units to meet modeled demand."
            if add
            else "Current compute capacity meets modeled demand."
        )
    elif kind == "failure":
        failed = scenario.get("node_id")
        if failed not in {n["id"] for n in nodes}:
            raise ValueError("Select an existing node to fail")
        parents = {}
        for edge in arch["edges"]:
            parents.setdefault(edge["target"], []).append(edge["source"])
        affected, queue = set(), [failed]
        while queue:
            for parent in parents.get(queue.pop(), []):
                if parent not in affected:
                    affected.add(parent)
                    queue.append(parent)
        impact = round((len(affected) + 1) / len(nodes) * 100, 1)
        result.update(
            scenario=kind,
            failed_node=failed,
            down=[failed],
            degraded=sorted(affected),
            impact_pct=impact,
        )
        result["math"] = [
            f"Injected failure = {failed}",
            f"Reverse dependency traversal = {len(affected)} potentially degraded services",
            f"Potential impact = ({len(affected)} + 1) / {len(nodes)} × 100 = {impact:g}%",
        ]
        result["recommendation"] = (
            "Introduce redundancy and test failover for the failed dependency. Reachability is potential impact, not a measured outage."
        )
    elif kind == "cost":
        budget = number(scenario.get("budget"), "Monthly budget", 0)
        fixed = current_cost - len(computes) * a["ec2_cost_monthly"]
        affordable = (
            min(
                len(computes),
                max(0, math.floor((budget - fixed) / a["ec2_cost_monthly"])),
            )
            if a["ec2_cost_monthly"]
            else len(computes)
        )
        remaining = sum(sorted(capacities, reverse=True)[:affordable])
        proposed = fixed + affordable * a["ec2_cost_monthly"]
        result.update(
            scenario=kind,
            budget=budget,
            affordable_nodes=affordable,
            current_capacity=remaining,
            cost_proposed=proposed,
            budget_feasible=proposed <= budget,
        )
        result["math"] = [
            f"Fixed services = ${fixed:g}/month",
            f"Budget = ${budget:g}/month",
            f"Retained compute units = {affordable}",
            f"Retained capacity = {remaining:g} req/s",
            f"Proposed cost = ${proposed:g}/month",
        ]
        result["recommendation"] = (
            "Budget cannot cover fixed services. Reconsider the architecture or budget."
            if proposed > budget
            else f"Retain {affordable} compute units; compare remaining capacity against demand before reducing resources."
        )
    else:
        raise ValueError("Scenario must be traffic, failure or cost")
    cap, demand = result["current_capacity"], result["required_capacity"]
    utilization = round(demand / cap * 100, 1) if cap else None
    result.update(
        utilization_pct=utilization,
        deficit=max(0, demand - cap),
        cost_delta=result["cost_proposed"] - current_cost,
    )
    result["status"] = (
        ("CRITICAL" if result["degraded"] else "WARNING")
        if kind == "failure"
        else (
            "CRITICAL"
            if cap < demand or not result.get("budget_feasible", True)
            else "WARNING" if utilization > 70 else "HEALTHY"
        )
    )
    result["healthy"] = [
        n["id"] for n in nodes if n["id"] not in result["down"] + result["degraded"]
    ]
    return result
