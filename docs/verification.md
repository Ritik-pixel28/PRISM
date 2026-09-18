# Local verification

Verified on September 18, 2026.

## September 19 readiness audit

- Rechecked official First Commit tracks, schedule and rules; deployment and mentor guidance are in the new runbooks.
- Installed SAM CLI 1.166.2 in `/tmp/prism-readiness-venv` for this audit. `sam validate --lint` passes on the expanded S3/CloudFront/API Gateway/Lambda template.
- `sam build --use-container` could not proceed: no running Docker or Finch runtime is available. Lambda container execution remains unverified.
- `npm --prefix frontend run build:static` passes, including TypeScript. The exported bundle is approximately 2.1 MB on disk.
- ESLint and all 12 existing engine/history tests pass.
- New reusable HTTP smoke check passes for the static preview: page load, five scenarios and malformed JSON handling.
- Browser verification of the actual static export confirms launching 10× traffic opens Analysis with five added units, a $500 modeled delta and line-by-line calculations.
- No AWS account access, cloud deployment or Bedrock invocation was performed. The static preview executes the same Python handler locally and is not evidence of Lambda hosting.

Earlier checks below are retained as historical records; the current SAM availability and deployment plan supersede their setup notes.

## Reference-driven studio redesign

- Added procedural Three.js sphere and fracture scenes, with metallic materials, bloom lighting, disassembly, rotation and zoom.
- Inspected both visual treatments at 1440×960.
- Split the product into Experience, Simulator, Architecture, Analysis, Archive and Settings.
- Browser verification: 10× traffic produces five added units and a $500 delta; proposed topology displays 750 req/s of added capacity; targeting RDS produces four upstream dependencies and 100% potential impact.
- Verified saved $380 budget output and side-by-side comparison against the traffic run, including retained capacity of 150 req/s.
- Verified the full decision record displays architecture, assumptions and calculations.
- Checked mobile navigation availability and archive search at 390 pixels, with no horizontal document overflow in the archive.
- Final ESLint, TypeScript production build, eight backend tests and four history tests pass.
- The visuals recreate the references' style using original procedural geometry; they are not the source videos' original assets. Existing export-download and AWS verification limitations below remain.

The sections below record earlier implementation checks; the studio replaces the prior floating-panel universe interface.

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

## Universe redesign

- Replaced the single dashboard with five navigable views: Universe, Experiment Lab, Analysis, Archive and Model Settings.
- Verified real pointer dragging changes floating-panel positions and service-node coordinates.
- Verified pause removes animated dependency particles; paused navigation continues to render normally.
- Verified the proposed topology adds the five-unit compute expansion.
- Verified RDS failure evidence, $380 budget results, and a 200 req/s assumption producing three added units at 10×.
- Verified in-app decision-record rendering contains architecture, scenario, assumptions and calculations.
- Verified archive search, two-run comparison and saved-history restoration after browser refresh.
- Added four passing history tests covering round trips, malformed records, deduplication, retention limits and missing scenario evidence.
- Inspected the desktop universe at 1440×1000. Checked all five views at 390 pixels wide; no horizontal overflow.
- No browser runtime errors in the final responsive checks.
- Production build and ESLint pass after the redesign.

Universe motion is illustrative, not live AWS telemetry. On mobile, panels stack below the interactive scene instead of supporting free-position dragging. Export-file completion remains subject to the embedded-browser limitation noted above; the new in-app record viewer provides access to the entire document without downloading it.
