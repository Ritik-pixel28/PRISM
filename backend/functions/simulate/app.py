import base64
import json
import logging
import os
from simulator.engine import run
from bedrock.client import explain


def lambda_handler(event, context=None):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": os.getenv(
            "ALLOWED_ORIGIN", "http://localhost:3000"
        ),
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
    method = event.get(
        "httpMethod",
        event.get("requestContext", {}).get("http", {}).get("method", "POST"),
    )
    if method == "OPTIONS":
        return {"statusCode": 204, "headers": headers, "body": ""}
    if method != "POST":
        return {
            "statusCode": 405,
            "headers": headers,
            "body": json.dumps({"error": "Use POST"}),
        }
    try:
        raw = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw, validate=True).decode("utf-8")
        if len(raw) > 100_000:
            raise ValueError("Request is too large")
        body = json.loads(raw)
        if not isinstance(body, dict):
            raise ValueError("Request must be an object")
        result = run(
            body.get("architecture"), body.get("scenario"), body.get("assumptions")
        )
        explanation = explain(result)
        result["explanation"] = (
            explanation
            or result["recommendation"]
            + " These results use editable simulation assumptions, not AWS guarantees."
        )
        result["explanation_source"] = "bedrock" if explanation else "deterministic"
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(result, allow_nan=False),
        }
    except (ValueError, TypeError, KeyError, AttributeError) as error:
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({"error": str(error)}),
        }
    except Exception:
        logging.exception("Simulation failed")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": "Simulation could not be completed"}),
        }
