# PRISM AWS deployment runbook

Prepared September 19, 2026. No AWS resources have been created by this runbook.

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
sam build --use-container --template-file infrastructure/template.yaml
```

Use Node 22.6+ for the history tests. SAM's container build requires Docker running; the Lambda runtime is Python 3.13. The local development machine currently has Python 3.14, so use the container build instead of assuming its interpreter matches Lambda. AWS CLI, SAM CLI and Docker must be installed before the cloud steps.

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

## Deploy only after approval

Confirm the account, region, available credits, and acceptable spending first. Throttles and AWS Budgets alerts do not guarantee a hard spending limit. This is a public demo API, with no sign-in and no sensitive customer data. Do not enable paid AI explanations casually.

```sh
aws sts get-caller-identity
sam deploy --guided --region us-east-1
```

Use stack name `prism-demo`. Keep change-set confirmation enabled, review the listed resources and allow the required IAM role creation. Keep `EnableBedrock=false`; leave the unused model parameters at their defaults. Deployment must use the generated `.aws-sam/build/template.yaml`, not an unbuilt backend directory.

After the stack completes:

```sh
aws cloudformation describe-stacks --stack-name prism-demo --region us-east-1 --query 'Stacks[0].Outputs' --output table
```

Copy `WebsiteBucketName`, `DistributionId` and `WebsiteUrl` from those outputs. Replace the placeholder values below with those exact outputs:

```sh
aws s3 sync frontend/out/ s3://BUCKET_FROM_OUTPUT/ --region us-east-1 --cache-control 'public,max-age=300'
aws s3 cp frontend/out/_next/static/ s3://BUCKET_FROM_OUTPUT/_next/static/ --recursive --region us-east-1 --cache-control 'public,max-age=31536000,immutable'
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_FROM_OUTPUT --paths '/*'
python3 scripts/smoke.py --base-url https://DOMAIN_FROM_OUTPUT
```

Wait for CloudFront to finish deploying. Open the URL signed out, run each scenario, inspect the proposed graph, compare two saved runs and save a decision record. Record the actual successful URL and CloudWatch invocation evidence before calling this Ship It complete. Uploading files alone does not verify cloud functionality.

## Optional Bedrock phase

First verify model access in the intended region. Deploy with an accessible `BedrockModelId`, matching `BedrockModelArn`, and `EnableBedrock=true`. The template rejects missing configuration. Cross-region inference profiles need review of all required IAM resources. Verify `explanation_source` is `bedrock`; fallback remains `deterministic` and must be described honestly. Bedrock is not required for the core serverless demonstration.

## Cleanup and limitations

When the demo is no longer needed, inspect costs and remove its resources deliberately. The website bucket is retained on stack deletion to avoid accidental data loss, so deleting the stack alone will not remove that bucket or its objects. Check for retained logs and other resources. Keep the public URL available for the judging period before cleanup.

AWS deployment, real account costs, permissions, regional availability and optional Bedrock invocation remain unverified until the authorized cloud run. A local preview is not a deployed submission.
