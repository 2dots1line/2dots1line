# Lessons Learned: Shipping a Traffic-Serving API Gateway Revision

## Build Failures Are Often Tooling Issues, Not Code Bugs
- Disabling Next.js ESLint during builds (`eslint.ignoreDuringBuilds: true`) removed a non-critical CI blocker caused by warnings and harmless patterns.
- Minor TypeScript or ESLint rules (e.g., “Empty block statement” from `catch {}`) can break CI; always add a minimal statement inside `catch` blocks.

## Artifact Registry Must Be Verified Before Deploy
- Cloud Run deploys fail if the image wasn’t pushed due to earlier build failures.
- Confirm images exist in the same region and repository used by your deployment (e.g., `us-east1-docker.pkg.dev/gen-lang-client-0355191808/cloud-run-source-deploy/...`).

## Turbo Monorepo Scope Must Be the Package Name
- `npx turbo prune --scope=apps/web-app --docker` fails; Turbo expects the package name, e.g., `@2dots1line/web-app`.
- Even with correct scope, prune can miss transitive workspaces or generated artifacts.

## Favor Robustness Over Image Size When CI Is Flaky
- The approach that consistently worked: copy the entire monorepo into the Docker build context, install, and build inside the workspace (no pruning).
- This removes “module not found” errors in Cloud Build caused by missing workspace dependencies in pruned images.

## IAM for Image Pulls Must Be Correct
- If Cloud Run cannot pull images, grant `roles/artifactregistry.reader` to the runtime service account for the repository/project.
- Identify the actual runtime service account used by the Cloud Run service before adding bindings.

## Health Checks Catch Issues Early
- Validate `/health` responds before routing traffic. This verifies environment variables, DB connectivity, and route registration.
- Only proceed to client integration after consistent health responses.

## Environment Vars and CORS Matter
- Keep `ALLOWED_ORIGINS` aligned with the real web app origins to avoid CORS issues.
- Set `NEXT_PUBLIC_API_BASE_URL` in the web app to the deployed gateway base URL.

## Fix Early Pipeline Steps Before Retrying Later Ones
- Resolve build/image push issues before re-running `gcloud run deploy` to avoid repeated failure loops.

## When to Use Full Monorepo Builds
- Prefer full monorepo copy when:
  - You see intermittent “module not found” errors in CI.
  - Prune lacks necessary indirect workspaces or generated artifacts.
  - You need a guaranteed successful revision to serve traffic quickly.
- Optimize later by:
  - Introducing prune incrementally, declaring outputs in `turbo.json`, and slimming Docker contexts.

## Common Pitfalls to Avoid
- Mismatched regions between Artifact Registry and Cloud Run.
- Using Turbo scope paths instead of package names.
- Allowing non-critical lint issues to block CI.
- Forgetting to set or update `ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL`.
- Not granting Artifact Registry Reader to Cloud Run’s runtime service account for private repos.