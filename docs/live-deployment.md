# Live AWS demo

Verified September 19, 2026.

**URL:** https://k965o7ronh.execute-api.ap-south-1.amazonaws.com

**Stack:** `prism-live`, Mumbai (`ap-south-1`). CloudFormation reached `CREATE_COMPLETE`.

## What runs on AWS

The browser reaches an API Gateway HTTP API over HTTPS. Its default route invokes a Python 3.13 Lambda that serves the exported Next.js interface, JavaScript and fonts. `POST /api/simulate` invokes the same deterministic simulation engine used locally. CloudWatch retains execution logs for seven days. The deployment artifact is stored in SAM's private managed S3 bucket.

This small demo uses browser asset caching rather than a CDN. Each uncached asset request invokes Lambda; it is intended for a hackathon demonstration, not a high-traffic production site. Default API throttles are 30 requests per second with a burst of 60 to accommodate asset loading; simulation requests have a rate of five and burst of ten. Throttles are best effort, not a billing cap.

Bedrock is disabled. Explanations are deterministic. The five services shown inside the architecture canvas are simulated services, not resources provisioned by running an experiment. Their region and costs are model inputs; the actual hosting region is Mumbai. History is saved in each visitor's browser.

## Deployment verification

- Twelve backend/router tests and the existing four history tests pass.
- Production static frontend build and SAM template lint pass.
- Public HTTPS smoke tests pass for traffic at 1x, 10x and 20x, RDS failure, a $380 modeled budget and malformed JSON.
- The live Chrome interface loaded its 3D experience and submitted a 10x experiment. Analysis showed demand 1,000 req/s, capacity 300 req/s, five added compute units and a modeled $500 monthly increase.
- The live architecture view displayed the two saturated compute nodes and the proposed-state option for five additional units.
- Browser error log was empty during this check. The export button was exercised; downloaded file contents were not independently verified.
- CloudWatch START, END and REPORT entries confirmed real Lambda execution. A browser-triggered invocation at 04:39:13 UTC had request ID `761928fd-5710-46c3-aafc-71255a307d5e`.

## Rebuild and update

Run from the repository root with AWS CLI, SAM CLI, Python with pip, make and Node installed:

```sh
npm --prefix frontend run build:static
python3 -m unittest discover -s backend -p 'test_*.py'
sam validate --lint --template-file infrastructure/demo.yaml --region ap-south-1
PRISM_STATIC_DIR="$PWD/frontend/out" sam build --template-file infrastructure/demo.yaml --build-dir .aws-sam/demo --region ap-south-1
sam deploy --template-file .aws-sam/demo/template.yaml --stack-name prism-live --resolve-s3 --s3-prefix prism-live --capabilities CAPABILITY_IAM --profile prism --region ap-south-1 --confirm-changeset
python3 scripts/smoke.py --base-url https://k965o7ronh.execute-api.ap-south-1.amazonaws.com
```

If local Python lacks a trusted CA bundle, configure its certificate store before HTTPS testing. The deployment verification used the installed certifi CA bundle with certificate verification enabled.

## Account and original hosting attempt

The owner confirmed selecting the Free account plan. No paid-plan upgrade was performed. At deployment time, the Credits page showed $0 and no active credits; the Free Tier plan API returned missing data. The $100/$200 promotional credit balance has not been verified. Check Billing before extending use; do not describe credits or actual deployment charges as confirmed.

The original `prism-demo` stack could create Lambda and API Gateway resources, but CloudFront returned an account-verification error requiring AWS Support. CloudFormation rolled it back. The retained website bucket containing only this build's assets was emptied and removed, and deletion of the rolled-back stack was verified. `infrastructure/template.yaml` remains the optional S3/CloudFront hosting design for after account verification. The active deployment uses `infrastructure/demo.yaml`.

## Demo and submission

Show the public URL, run a 10x surge, explain the calculation, show an RDS dependency failure, then open the `prism-live` stack and Lambda logs to demonstrate AWS usage. Record a YouTube video under three minutes and submit it with the public repository and writeup. The video and submission are still pending.
