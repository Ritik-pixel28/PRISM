# PRISM — Simulation Studio

See how your infrastructure behaves before production does.

PRISM is a local-first architectural decision lab with a Python simulation engine, an interactive Next.js topology, and optional Amazon Bedrock explanations. It models assumptions; it does not scan or modify production infrastructure.

## Run locally

Requires Python 3.11+ and Node 20.9+.

From the repository root, start the engine:

```sh
python3 backend/server.py
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. No AWS credentials, paid services or Python dependencies are required for the default local demo.

## What works

- Traffic surge experiments from 1× to 20× with capacity deficits and compute expansion estimates.
- Dependency failure injection, hover previews, draggable topology and service inspection.
- Monthly budget constraints with retained capacity and infeasible-budget detection.
- Editable capacity, baseline traffic and cost assumptions.
- Current/proposed compute topology, deterministic calculations and cost comparison.
- Separate Experience, Simulator, Architecture, Analysis, Archive and Model Settings views.
- Three.js sphere and fracture sculptures with rotation, zoom, disassembly, reset and fullscreen.
- Persistent browser archive for the most recent 30 experiments, scenario search, filters and two-run comparison.
- Readable, copyable and downloadable Markdown decision records.
- Validated Lambda handler, same-origin frontend proxy, local Python HTTP server.
- Optional Bedrock explanation with bounded timeouts and deterministic fallback.
- Responsive cinematic interface, pause/resume motion, keyboard focus styles and reduced-motion support.

## Verify

```sh
python3 -m unittest discover -s backend -p 'test_*.py'
cd frontend
npm run lint
npm run build
```

The build uses webpack because the installed Turbopack version failed in this local environment. This changes the build tool, not the app behavior.

The sample has **two** compute instances. At 10× traffic: demand = 1,000 req/s; existing capacity = 300 req/s; deficit = 700 req/s; add = ceil(700 / 150) = **5**. The six-instance recommendation in the early guide applies to its different, one-instance sample.

## Model boundaries

Capacity is the sum of compute capacity assumptions; no database, network, cache, latency, scaling-delay or queueing model is implied. Existing heterogeneous capacities are honored unless the user overrides compute capacity. New instances use the configured unit capacity. Traffic recommendations never remove existing nodes.

Failure impact uses reverse dependency reachability. Degraded means potentially impacted, not proven unavailable. Redundant paths and automatic failover are not modeled. Failing a CDN does not degrade downstream nodes in this dependency model, even though actual request delivery could stop.

Budget simulation preserves non-compute services and retains the highest-capacity existing compute instances it can afford. Costs are illustrative monthly assumptions, not AWS prices. The UI marks reports from earlier inputs as previous runs. The latest 30 runs are stored in this browser using localStorage. Failed or unavailable storage falls back to session memory. Saved runs retain their scenario, assumptions and evidence.

## AWS integration, intentionally not deployed

For the September 19 mentor review, see [mentor readiness](docs/mentor-readiness.md) and the [AWS deployment runbook](docs/aws-deployment.md). The prepared target is S3 + CloudFront for the static interface and API Gateway + Lambda for simulation. `npm --prefix frontend run build:static` generates the deployable frontend without changing the local development API route. No cloud resources have been deployed.

`infrastructure/template.yaml` packages the same Python engine into Lambda behind API Gateway. Bedrock is disabled by default. DynamoDB and S3 are deliberately not required: the current MVP stores session history locally and exports decisions in the browser.

For a later AWS integration, configure `PRISM_API_URL` on the Next.js server to the deployed `/simulate` endpoint. To enable explanations, install `backend/requirements.txt`, configure AWS credentials outside the repository, set `PRISM_ENABLE_BEDROCK=true` and `BEDROCK_MODEL_ID` to an accessible model. The SAM template takes the matching allowed model ARN. Cross-region inference profiles may require additional IAM resources and must be reviewed before use.

SAM template validation and the static frontend build have been verified. No model access, live AWS invocation, SAM deployment or cloud endpoint has been verified. SAM container build is blocked until Docker or Finch is installed and running. Do not present the local demo as proof of deployed AWS usage. The API is an unauthenticated demo with prepared throttling, not a private production service.

## Project structure

- `backend/simulator/engine.py`: validation and deterministic model.
- `backend/functions/simulate/app.py`: Lambda HTTP contract.
- `backend/bedrock/client.py`: optional explanation layer.
- `backend/server.py`: local adapter for the same handler.
- `frontend/app/page.tsx`: experiment workspace.
- `frontend/components/studio/Sculpture.tsx`: procedural WebGL sculptures and lighting.
- `frontend/components/ArchitectureCanvas/`: draggable dependency graph.
- `frontend/components/universe/`: shared simulator controls, analysis and archive.
- `frontend/lib/history.ts`: validation for restored experiment records.
- `frontend/app/api/simulate/route.ts`: server-side API proxy.
- `docs/demo.md`: three-minute presentation plan.

## Credits

Built with Next.js, React, Three.js, React Flow, Lucide, Tailwind CSS and Python. Anton and Manrope fonts are bundled locally. AI-assisted implementation: OpenAI Codex. Review and understand the model and code before presenting it; include AI tool usage in the submission where required.

## Studio controls

Use the top navigation to switch between six views. Experience has two original procedural sculptures inspired by the supplied references: FORM uses metallic and textured spheres; FRACTURE uses a dark core and luminous fragments. Drag to rotate, scroll to zoom, adjust Disassemble or reset the camera. On mobile, the menu opens the other views.

Architecture contains the actual service graph: drag nodes, inspect services, trace dependencies and preview proposed compute capacity. Simulator runs traffic, failure and budget scenarios. Analysis contains the complete math and decision record; Archive compares saved runs. Settings exposes all model assumptions. Pause motion from Experience or Settings. System reduced-motion preferences take priority. Animation is illustrative, not AWS telemetry. See [the feature map](docs/feature-map.md).

History validation tests require Node 22.6+ (Node 25 was used here):

```sh
node --experimental-strip-types --test frontend/tests/history.test.mjs
```
