# PRISM AWS deployment runbook

Updated September 19, 2026. **The live deployment now uses API Gateway and Lambda: see [live deployment](live-deployment.md).** This document preserves the original S3/CloudFront design. Its attempted deployment rolled back because AWS requires additional account verification to create CloudFront resources.

## Target architecture

Browser → CloudFront → private S3 bucket for the exported interface.

Browser → CloudFront `/api/simulate` → regional API Gateway `/Prod/api/simulate` → Python Lambda for calculations → optional Bedrock for explanation only.

CloudWatch retains Lambda logs for seven days. API stage throttles are five requests per second with a burst of ten; these are best-effort controls, not a billing cap. Bedrock stays disabled initially. No EC2, database, NAT gateway or always-running container is needed. Experiment history remains in the visitor's browser, not in a cloud database.

The five services drawn inside PRISM are a modeled architecture. They are different from the services hosting PRISM itself.

## Why this deployment

The current app uses Next.js 16. AWS's [Amplify SSR support page](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html) lists versions through 15. Static export avoids relying on an unverified SSR runtime. It builds a separate staging copy without the local Next.js API route; the source and local development route remain intact. CloudFront sends that same URL to Lambda instead.

The bucket blocks public access; CloudFront reads through origin access control. API responses are not cached. The default CloudFront HTTPS domain avoids buying a domain or configuring a certificate. See [S3 origin access](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html) and [API origin header policy](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html).

## Prepare without deploying

From the repository root:

```sh
npm --prefix frontend ci
npm --prefix frontend run build:static
python3 -m unittest discover -s backend -p 'test_*.py'
node --experimental-strip-types --test frontend/tests/history.test.mjs
sam validate --lint --template-file infrastructure/template.yaml
sam build --template-file infrastructure/template.yaml --region ap-south-1
```

Use Node 22.6+ for the history tests. The Lambda runtime is Python 3.13. The Makefile builder copies the Python application and installs wheels targeted to Linux x86_64 and Python 3.13. This build does not require Docker or a matching local Python interpreter. AWS CLI and SAM CLI are required for deployment. Docker or Finch is still required for `sam local` container emulation; local artifact tests do not prove execution in the Lambda runtime.

To inspect the exact static output with the same local engine:

```sh
python3 backend/preview.py
```

In another terminal:

```sh
python3 scripts/smoke.py --base-url http://127.0.0.1:3001
```

For actual Lambda container emulation, after the SAM build:

```sh
sam local start-api --port 8000
```

Then run the regular Next.js frontend at port 3000. Its proxy calls the SAM `/simulate` endpoint. Stop the ordinary Python server first if it occupies port 8000. Record successful SAM invocation output as evidence; template validation alone is not evidence of Lambda execution.

## Account access

Deployment has been authorized for the demo, with Bedrock disabled. Mumbai (`ap-south-1`) is the selected region. Throttles and AWS Budgets alerts do not guarantee a hard spending limit. This is a public demo API, with no sign-in and no sensitive customer data.

The account owner has selected the AWS Free plan. Do not upgrade the plan or activate paid-only services as part of deployment. Verify the account's actual plan, credits and service availability after registration. AWS advertises $100 in initial credits for eligible new customers and up to $100 more through qualifying activities; $200 is not an automatic starting balance. Payment verification is still part of registration.

AWS CLI v2.32+ supports browser login with temporary credentials:

```sh
aws login --profile prism --region ap-south-1
aws sts get-caller-identity --profile prism --region ap-south-1
```

On September 19, browser login and STS succeeded. CloudFormation `ListStacks` returned `OptInRequired`: the access key needs a subscription for the service. Opening S3 redirected to account setup; continuing registration showed Billing Information, step 3 of 5. The account owner must finish payment verification and any remaining AWS activation steps. Builder Center student verification is separate. No deployment resources were created during this attempt.

The downloaded, signature-checked CLI is temporarily available at `/tmp/prism-awscli-expanded/aws-cli.pkg/Payload/aws-cli/aws`; SAM is at `/tmp/prism-readiness-venv/bin/sam`. These temporary paths may disappear after a restart. Credentials stay in the standard AWS profile outside the repository.

## Deploy after account activation

```sh
aws cloudformation list-stacks --profile prism --region ap-south-1
sam deploy --guided --template-file .aws-sam/build/template.yaml --profile prism --region ap-south-1
```

Use stack name `prism-demo`. Keep change-set confirmation enabled, review the listed resources and allow the required IAM role creation. Keep `EnableBedrock=false`; leave the unused model parameters at their defaults. Deployment must use the generated `.aws-sam/build/template.yaml`, not an unbuilt backend directory.

After the stack completes:

```sh
aws cloudformation describe-stacks --stack-name prism-demo --profile prism --region ap-south-1 --query 'Stacks[0].Outputs' --output table
```

Copy `WebsiteBucketName`, `DistributionId` and `WebsiteUrl` from those outputs. Replace the placeholder values below with those exact outputs:

```sh
aws s3 sync frontend/out/ s3://BUCKET_FROM_OUTPUT/ --profile prism --region ap-south-1 --cache-control 'public,max-age=300'
aws s3 cp frontend/out/_next/static/ s3://BUCKET_FROM_OUTPUT/_next/static/ --recursive --profile prism --region ap-south-1 --cache-control 'public,max-age=31536000,immutable'
aws cloudfront create-invalidation --profile prism --distribution-id DISTRIBUTION_FROM_OUTPUT --paths '/*'
python3 scripts/smoke.py --base-url https://DOMAIN_FROM_OUTPUT
```

Wait for CloudFront to finish deploying. Open the URL signed out, run each scenario, inspect the proposed graph, compare two saved runs and save a decision record. Record the actual successful URL and CloudWatch invocation evidence before calling this Ship It complete. Uploading files alone does not verify cloud functionality.

## Optional Bedrock phase

First verify model access in the intended region. Deploy with an accessible `BedrockModelId`, matching `BedrockModelArn`, and `EnableBedrock=true`. The template rejects missing configuration. Cross-region inference profiles need review of all required IAM resources. Verify `explanation_source` is `bedrock`; fallback remains `deterministic` and must be described honestly. Bedrock is not required for the core serverless demonstration.

## Cleanup and limitations

When the demo is no longer needed, inspect costs and remove its resources deliberately. The website bucket is retained on stack deletion to avoid accidental data loss, so deleting the stack alone will not remove that bucket or its objects. Check for retained logs and other resources. Keep the public URL available for the judging period before cleanup.

The alternative Lambda/HTTP API deployment has been verified; this CloudFront design remains blocked by account verification. Actual account costs, promotional credits and optional Bedrock invocation remain unverified. A local preview is not a deployed submission.
