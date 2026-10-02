#!/usr/bin/env bash
# Build the React app and publish it to S3 + CloudFront (https://example.com).
#
# Usage (reads bucket + distribution from the CloudFormation stack outputs):
#   STACK_NAME=example-frontend ./deploy/deploy.sh
# or explicitly:
#   S3_BUCKET=... CLOUDFRONT_DISTRIBUTION_ID=... ./deploy/deploy.sh
#
# Requires: AWS CLI v2 with credentials that can write to the bucket.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${STACK_NAME:-}" ]]; then
  output() {
    aws cloudformation describe-stacks --region us-east-1 --stack-name "$STACK_NAME" \
      --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
  }
  S3_BUCKET="${S3_BUCKET:-$(output BucketName)}"
  CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-$(output DistributionId)}"
fi
: "${S3_BUCKET:?Set STACK_NAME, or S3_BUCKET (and CLOUDFRONT_DISTRIBUTION_ID)}"

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Building (mode: production)"
npm run build

# No --delete: users still running the previous index.html keep loading its
# (hashed) assets during and after the deploy. Old versions expire via bucket lifecycle.
echo "==> Uploading fingerprinted assets (cached for 1 year)"
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
  --exclude "index.html" \
  --cache-control "public, max-age=31536000, immutable"

# Uploaded last, so it never points at assets that don't exist yet.
echo "==> Uploading index.html (never cached)"
aws s3 cp dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html; charset=utf-8"

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]]; then
  echo "==> Invalidating CloudFront cache for index.html"
  aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/index.html" "/" > /dev/null
fi

echo "==> Done"
