# Mentor briefing — September 19

Live demo: https://k965o7ronh.execute-api.ap-south-1.amazonaws.com. The `prism-live` stack is deployed and tested in Mumbai. See [deployment evidence](live-deployment.md).

## Positioning

PRISM helps student teams reason about a small web application's capacity, dependencies and budget before changing infrastructure. Start with a campus event registration service: what happens when registrations jump tenfold, the shared database fails, or the team cuts its budget?

The useful output is a decision with inspectable assumptions and reproducible calculations. The 3D landing experience introduces the product; the simulator, graph and evidence do the work.

## Event alignment

Target Ship It through serverless hosting, with Best UI as a second opportunity. The track table lists Lambda and API Gateway under serverless and S3/CloudFront as supporting services. Build It is a fallback requiring a working AWS open-source workflow, not just AWS labels on the diagram. No winner or eligibility determination is guaranteed by this document.

The [event overview](https://www.wemakedevs.org/aws/first-commit) explains the tracks and judging. The [schedule](https://www.wemakedevs.org/aws/first-commit/schedule) places the campus day on September 19 and submission day on September 20, with exact hours still pending when checked. Ask the mentor for the final cutoff.

## Three-minute recording plan

Aim for 2:45, leaving margin below the limit.

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:20 | Brief 3D introduction, then Simulator | Who needs this: a student team preparing event registration for a traffic spike. |
| 0:20–0:55 | Run 10× traffic, open Analysis | Two modeled instances provide 300 req/s; demand is 1,000; five extra units cover the deficit. Show the math. |
| 0:55–1:20 | Architecture, proposed state, target RDS | Trace four potentially impacted upstream services. This is dependency reachability, not a measured outage. |
| 1:20–1:45 | Budget $380; change one assumption | Demonstrate a real tradeoff and how inputs change the calculation. Costs are assumptions, not an AWS quote. |
| 1:45–2:10 | Archive comparison and decision record | Preserve the evidence behind a decision. |
| 2:10–2:30 | Actual AWS execution evidence | Show the working cloud URL, `prism-live` Lambda/API Gateway stack and CloudWatch request logs. |
| 2:30–2:45 | Your learning and limitation | Explain what you learned about dependency direction, assumptions, static delivery and serverless execution. |

Do not claim AWS deployment, live monitoring, real fault injection or Bedrock usage unless the recording demonstrates them.

## Questions to be ready for

**Is the data real?** The included architecture is a sample. Capacity and costs are editable assumptions. The engine computes every outcome from those inputs; it does not load real AWS telemetry or pricing.

**Why use deterministic Python instead of an LLM?** Arithmetic and dependency traversal should be repeatable and inspectable. Optional Bedrock explains the result without determining it.

**Does this prove resilience?** No. It highlights modeled risk. It omits failover, database bottlenecks, network limits, queues and scaling delays. Use load testing and recovery exercises to validate real systems.

**Why AWS?** The live demo runs the calculations and serves the exported interface in Lambda through API Gateway HTTP API. CloudWatch provides execution evidence. The same engine runs locally for reproducibility. CloudFront required additional account verification, so the demo uses this smaller hosting design; the S3/CloudFront template remains available for later.

**What did you build and understand yourself?** Describe the model and tradeoffs in your own words. Disclose Codex and any other AI tools used. Do not describe AI-assisted code as unaided work.

## Remaining gates

- [x] Student verification confirmed in AWS Builder Center.
- [ ] Confirm event check-in and submission requirements with the organizer.
- [ ] Confirm the final deadline time; the schedule did not specify it when checked.
- [ ] Review the project with at least two peers; record their actual feedback, not invented impact metrics.
- [x] Complete and verify AWS deployment for Ship It.
- [ ] Record and upload the video, verify its link signed out, and submit the writeup and repository.
- [ ] Confirm downloaded decision records open in a regular browser.

The [rules](https://www.wemakedevs.org/aws/first-commit/rules) require new event-period work, AWS usage shown in the video, a public repository and AI-tool disclosure. Current commit timestamps fall on September 18; retain the truthful history. Interview eligibility is a separate issue: the rules name graduating classes 2027 and 2028, so confirm your graduation year rather than assuming second-year status qualifies.

## Submission writeup draft

PRISM is an infrastructure decision lab for students and small teams. It asks three practical questions: how much compute a traffic surge requires, which services potentially depend on a failed component, and what capacity remains under a budget. A Python engine returns deterministic calculations and a visible proof; a Next.js/Three.js interface lets users explore the architecture, compare experiments and export a decision record.

AWS status: PRISM is deployed in Mumbai at https://k965o7ronh.execute-api.ap-south-1.amazonaws.com using API Gateway HTTP API, Python Lambda and CloudWatch. The Lambda serves the interface and executes deterministic simulations. Five public-endpoint scenarios and malformed-request handling were verified, alongside a browser-driven simulation and CloudWatch invocation records. Bedrock is disabled in this deployment. Included inputs are sample assumptions, and the model does not claim to predict real production reliability.

AI assistance: OpenAI Codex was used for implementation, debugging and documentation. Third-party libraries and procedural visual design credits are in the repository. Add any other tools actually used. Learning and user feedback: add your own specific observations after the mentor session.
