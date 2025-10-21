# Step-by-Step Guide: Build and Deploy API Gateway and Web App

This guide uses the exact environment values that worked:
- Project ID: `gen-lang-client-0355191808`
- Region: `us-east1`
- Artifact Registry repo: `cloud-run-source-deploy`
- Cloud Run services: `api-gateway`, `web-app`

## 1) Authenticate and Set Project/Region

```bash
gcloud auth login
```

```bash
gcloud config set project gen-lang-client-0355191808
```

```bash
gcloud config set run/region us-east1
```

## 2) Enable Required Services

```bash
gcloud services enable cloudbuild.googleapis.com
```

```bash
gcloud services enable run.googleapis.com
```

```bash
gcloud services enable artifactregistry.googleapis.com
```

## 3) Ensure Artifact Registry Repository Exists (us-east1)

```bash
gcloud artifacts repositories create cloud-run-source-deploy --repository-format=docker --location=us-east1
```

If it already exists, this command will fail safely; you can proceed.

## 4) Verify Local Builds First (Monorepo)

```bash
pnpm install
```

```bash
pnpm -C apps\web-app build
```

```bash
pnpm -C apps\api-gateway build
```

- Keep Next.js ESLint ignored during builds (`eslint.ignoreDuringBuilds: true`) to prevent warnings from blocking CI.
- Fix any empty `catch {}` blocks and minor syntax issues if present.

## 5) Robust CI (Worked Reliably): Build Full Monorepo in Docker

Use the approach that forgoes image size in exchange for reliability:
- Copy the entire monorepo into the Docker image build context.
- Run `pnpm install` with workspace awareness.
- Build inside the workspace (no `turbo prune`).
- Submit Cloud Build from the repo root using the existing `cloudbuild.yaml`.

```bash
gcloud builds submit
```

This produced working images tagged in:
- `us-east1-docker.pkg.dev/gen-lang-client-0355191808/cloud-run-source-deploy/api-gateway:latest`
- `us-east1-docker.pkg.dev/gen-lang-client-0355191808/cloud-run-source-deploy/web-app:latest`

## 6) Optional Leaner CI: Turbo Prune With Correct Scope

If you later optimize, ensure prune scope uses the package name:

```bash
npx turbo prune --scope=@2dots1line/web-app --docker
```

Only use prune when confident that all workspace dependencies and generated artifacts are included; otherwise revert to the full monorepo build.

## 7) Verify Pushed Images in Artifact Registry

```bash
gcloud artifacts docker images list us-east1-docker.pkg.dev/gen-lang-client-0355191808/cloud-run-source-deploy
```

Confirm both `api-gateway:latest` and `web-app:latest` appear with digests.

## 8) Deploy API Gateway to Cloud Run

Deploy with the known image tag:

```bash
gcloud run deploy api-gateway --image=us-east1-docker.pkg.dev/gen-lang-client-0355191808/cloud-run-source-deploy/api-gateway:latest --allow-unauthenticated --region us-east1
```

Set `ALLOWED_ORIGINS` to match your web app origin. First, get the web app URL (after you deploy it below), then update:

```bash
gcloud run services update api-gateway --set-env-vars=ALLOWED_ORIGINS=https://your-web-app-url
```

## 9) Fix Image Pull Permission Issues (If Any)

Identify the runtime service account used by the service:

```bash
gcloud run services describe api-gateway --region us-east1 --format="value(spec.template.spec.serviceAccountName)"
```

Grant Artifact Registry Reader to that service account:

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0355191808 --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" --role="roles/artifactregistry.reader"
```

Replace `SERVICE_ACCOUNT_EMAIL` with the email returned in the previous command.

## 10) Confirm Gateway Is Serving Traffic

Get the service URL:

```bash
gcloud run services describe api-gateway --region us-east1 --format="value(status.url)"
```

Call the health endpoint:

```bash
curl https://YOUR_API_GATEWAY_URL/health
```

Replace `YOUR_API_GATEWAY_URL` with the URL returned earlier. Expect a healthy response.

## 11) Deploy the Web App to Cloud Run

Deploy the web app using the pushed image:

```bash
gcloud run deploy web-app --image=us-east1-docker.pkg.dev/gen-lang-client-0355191808/cloud-run-source-deploy/web-app:latest --allow-unauthenticated --region us-east1
```

Retrieve the API Gateway URL:

```bash
gcloud run services describe api-gateway --region us-east1 --format="value(status.url)"
```

Update the web app to point to the gateway:

```bash
gcloud run services update web-app --set-env-vars=NEXT_PUBLIC_API_BASE_URL=https://YOUR_API_GATEWAY_URL --region us-east1
```

Replace `YOUR_API_GATEWAY_URL` with the gateway URL from the previous command.

If the web app cannot pull images, repeat IAM fix for its runtime service account:

```bash
gcloud run services describe web-app --region us-east1 --format="value(spec.template.spec.serviceAccountName)"
```

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0355191808 --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" --role="roles/artifactregistry.reader"
```

## 12) Sanity Checks and Monitoring

Tail logs for the gateway:

```bash
gcloud logs tail --resource=run.googleapis.com/service/api-gateway --region=us-east1
```

Tail logs for the web app:

```bash
gcloud logs tail --resource=run.googleapis.com/service/web-app --region=us-east1
```

Verify traffic allocation:

```bash
gcloud run services describe api-gateway --region us-east1 --format="value(status.traffic)"
```

## 13) Notes on the Working Configuration

- Region consistency: both Artifact Registry and Cloud Run use `us-east1`.
- Repository: `cloud-run-source-deploy` contains both `api-gateway` and `web-app` images.
- Monorepo build strategy that worked reliably in CI:
  - Full monorepo copy into Docker build context.
  - Workspace-aware `pnpm install`.
  - Build inside the workspace without pruning.
- Optimization can be revisited later:
  - Introduce prune carefully and declare `outputs` in `turbo.json`.
  - Keep lint warnings from blocking builds (Next.js ESLint ignored during builds).