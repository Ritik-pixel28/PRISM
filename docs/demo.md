# PRISM demo rehearsal

## 0:00–0:20 — The problem

“I'm a second-year student at Polaris. When I draw a cloud architecture, the boxes look convincing. What I really want to know is where it breaks. PRISM turns that diagram into an experiment, with assumptions you can inspect.”

## 0:20–1:00 — Traffic surge

Run 1× and show the healthy result. Switch to 10× and run again. Point to 1,000 req/s demand, 300 req/s modeled capacity, and five additional compute units. Open Show the Math. Emphasize that Python calculates the answer; a language model does not invent it.

## 1:00–1:30 — Follow the failure

Choose Dependency failure, target RDS and run. Show the failed database and four potentially degraded upstream services. Explain that this is conservative dependency reachability, not a prediction of a real outage. Hover EC2 to contrast its dependency radius.

## 1:30–2:00 — Make the tradeoff

Choose Budget pressure with $380. Show one retained compute unit, 150 req/s capacity and an illustrative $100 monthly reduction. Change the budget to $100 to demonstrate that fixed services alone exceed it.

## 2:00–2:30 — Make it defensible

Open assumptions and change compute capacity. Run traffic again, compare the proposed topology and export an architectural decision record. Show that it contains the architecture, scenario, calculations and limitations.

## 2:30–3:00 — Engineering and learning

Describe the shared engine behind the local HTTP server and Lambda handler. Show the tested request contract and optional Bedrock explanation adapter. If AWS has not been connected, say so plainly. Once authorized and verified later, replace this portion with real AWS execution evidence.

Close: “PRISM makes assumptions visible, failures explorable, and architecture decisions explainable.”

## Before recording

- Start both local servers and confirm the first experiment succeeds.
- Use 1920×1080 for the full three-column workspace; keep the browser zoom readable.
- Reset the workspace and close unrelated panels.
- Record within three minutes, with a backup recording saved locally.
- Confirm the current event rules directly before submission.
- Do not claim live monitoring, verified pricing, real fault injection or deployed AWS resources from this local demo.
