# Local verification

Verified on September 18, 2026.

- Python unittest suite: 8 tests pass, including 1×/10×/20× traffic, one-node sample compatibility, zero compute, heterogeneous capacities, failures, budget feasibility, malformed requests and cyclic graphs.
- ESLint: pass.
- Next.js production build with webpack: pass, including TypeScript checks.
- Browser-to-Next.js-to-Python: verified 10× produces 1,000 req/s demand, 300 req/s capacity, five additional units and a $500 modeled monthly delta.
- Proposed topology: verified the additional five-unit group appears.
- RDS failure: verified four degraded upstream nodes and one failed node.
- Budget $380: verified one retained unit and $380 modeled monthly spend.
- Capacity override to 200 req/s: verified 10× recommends three additional units.
- Show the Math: verified displayed calculations agree with result metrics.
- 1920×1080 desktop and 390×844 mobile: inspected; mobile page has no horizontal overflow.
- Browser console: no errors during the final mobile check.

The ADR export uses a browser download. Its click path was exercised, but the embedded browser did not report a completed download, so saving the file still needs confirmation in a regular browser.

AWS credentials/model access, live Bedrock output, SAM validation and deployment were not tested. SAM CLI is unavailable in the current shell. No resources were deployed.
