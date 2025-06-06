# Monorepo Build Debugging Report - 2dots1line V7

Date: 2024-07-30

## 1. Overview

This report details the troubleshooting steps taken to resolve a series of cascading build failures in the 2dots1line V7 monorepo. The issues spanned `npm` installation problems, `pnpm` workspace misconfigurations, TypeScript project reference complexities, incorrect package dependencies, and ESLint setup errors. The goal of this report is to document the debugging journey, highlight the solutions that worked, and provide lessons learned and best practices to prevent recurrence.

## 2. Initial Problem: `npm install` Failures & Corrupted Environment

*   **Symptom:** `npm install` failed with `E404 Not Found` for local workspace packages (e.g., `@2dots1line/ui-components`). `npm workspaces list` and `require('npm')` failed, indicating a corrupted `npm` installation. An Arborist error (`Cannot read properties of null (reading 'matches')`) further confirmed this. Debug logs showed `npm` using an incorrect Node version (v22 instead of the project-intended v20).
*   **Failed Attempts:**
    *   Changing Node/npm versions.
    *   Cleaning `npm` cache.
    *   Verifying paths.
*   **Solution (Partial - Shift to `pnpm`):** Recognizing the `npm` environment was unreliable, the decision was made to switch to `pnpm`.
*   **Lesson:** A corrupted global or local `npm` installation can be very hard to debug. If basic troubleshooting fails, consider a cleaner package manager or a fresh environment setup. Ensure the correct Node.js version is active for the project.

## 3. `pnpm` Workspace Configuration Issues

*   **Symptom (Initial `pnpm`):** After installing `pnpm` (v10.11.1), an initial `pnpm install` succeeded. The project was configured for `pnpm` by adding `packageManager` to the root `package.json` and creating `pnpm-workspace.yaml`. However, a subsequent `pnpm install` failed with `ERR_PNPM_FETCH_404` for local workspace packages.
*   **Cause:** Dependencies in `package.json` files were using loose `"*"` or `^version` specifiers instead of the `workspace:` protocol required by `pnpm` for local workspace packages.
*   **Solution:**
    1.  Systematically updated all internal monorepo package dependencies in `package.json` files to use `workspace:^<version>` (e.g., `workspace:^0.1.0`). This involved editing `package.json` files for `apps/api-gateway`, `apps/storybook`, `services/cognitive-hub`, `packages/orb-core`, `workers/scheduler`, etc.
    2.  Ensured `pnpm-workspace.yaml` correctly listed all workspace package locations (e.g., adding `packages/ui-components`).
*   **Lesson:** When using `pnpm` workspaces, **always** use the `workspace:` protocol for dependencies between packages within the monorepo. Ensure `pnpm-workspace.yaml` is comprehensive.

## 4. Prisma Client Type Issues (`@2dots1line/database`)

*   **Symptom:** Building `@2dots1line/database` (`pnpm --filter @2dots1line/database build`) failed with TypeScript errors like `TS2694: Namespace '...'.Prisma has no exported member 'InputJsonValue'`.
*   **Cause:**
    1.  Prisma's generated types had changed between versions (e.g., `GetPayload` to `$ModelPayload`).
    2.  Initial attempts to fix by directly changing type names in repository files were insufficient.
    3.  Switching to import top-level model types (e.g., `import { User as PrismaUser } from '@prisma/client'`) led to `TS2305: Module '"@prisma/client"' has no exported member 'User'`, indicating TypeScript couldn't find *any* exports from `@prisma/client`.
    4.  Investigation of `@prisma/client/package.json` showed `types: "default.d.ts"`. This `default.d.ts` file was found to have an incorrect relative path to the actual generated types in `.prisma/client`.
*   **Failed Attempts:**
    *   Directly correcting the path in `node_modules/@prisma/client/default.d.ts` (temporary fix, not viable).
*   **Solution (Workaround & Refinement):**
    1.  **Workaround:** Created `packages/database/src/prisma-client.ts` to re-export everything from `../node_modules/.prisma/client`. All imports of `'@prisma/client'` in `packages/database/src/` were changed to import from this new local file. This allowed `@2dots1line/database` to build.
    2.  **Later Build System Refinement:** As part of broader `tsconfig.json` changes, `baseUrl` and `paths` for `@prisma/client` were removed from `packages/database/tsconfig.json`, relying on the local re-export.
*   **Lesson:**
    *   Be aware that `prisma generate` can produce types that might not be directly compatible with older import patterns if Prisma client/CLI versions change significantly.
    *   When facing persistent "module not found" or "no exported member" errors for generated clients like Prisma, check the generated `package.json` and type definition files within `node_modules` for the client. Path issues or incorrect type export declarations in the generated client itself can be the culprit.
    *   A local re-export file can be a stable workaround if the generated client's structure is problematic for direct consumption.

## 5. TypeScript Project References & Build Failures (`tsc -b`)

This was the most complex part of the debugging, involving multiple packages.

*   **Symptoms (across various packages like `text-tool`, `tool-registry`, `agent-framework`, `cognitive-hub`, `api-gateway`):**
    *   `TS2305: Module '"@2dots1line/shared-types"' has no exported member 'TExtractedEntity'`.
    *   `TS6306: Referenced project '...' must have setting "composite": true.`
    *   `TS6305: Output file '.../dist/index.d.ts' has not been built from source file '.../src/index.ts'.`
    *   `TS2307: Cannot find module '@2dots1line/database' or its corresponding type declarations.`
    *   `TS6059: File '.../shared-types/src/ai/job.types.ts' is not under 'rootDir' '.../tool-registry/src'.` (due to inherited `paths` from `tsconfig.base.json` causing referenced projects to try and compile source files of their dependencies).
    *   `TS5083: Cannot read file '/Users/danniwang/Documents/GitHub/tsconfig.base.json'.` (due to incorrect relative `extends` path).
*   **Key Discoveries & Solutions:**
    1.  **`tsc -b` is Essential:** For composite projects using TypeScript project references, the build script **must** use `tsc -b tsconfig.json` (or `tsc -b path/to/tsconfig.json`). Simply using `tsc -p tsconfig.json` or `tsc` will not correctly build the references and produce the necessary build artifacts (like `.tsbuildinfo` and properly resolved `dist` outputs for dependent projects).
        *   **Action:** Updated `build` scripts in `package.json` for all composite library packages (`shared-types`, `tool-registry`, `database`, `agent-framework`, `cognitive-hub`) to use `rm -rf dist && tsc -b tsconfig.json --verbose --force`.
    2.  **`tsconfig.json` for Composite Packages:**
        *   **`composite: true`:** Mandatory for any package that is referenced by another or references others.
        *   **`declaration: true` (and `declarationMap: true`):** Essential for generating `.d.ts` files. Usually inherited from `tsconfig.base.json` if `composite` is true there.
        *   **`noEmit: false`:** Ensure output is actually generated.
        *   **`rootDir` and `outDir`:** Standard for source and output.
        *   **`"references": [{ "path": "../dependent-package" }]`:** Correctly list all internal workspace dependencies.
        *   **`"paths": {}` (in individual package `tsconfig.json` files):** This was CRITICAL. `tsconfig.base.json` had `paths` aliases pointing to `src` directories (e.g., `"@2dots1line/shared-types": ["packages/shared-types/src"]`). When a composite project (e.g., `tool-registry`) referenced another (e.g., `shared-types`), inheriting these `src`-pointing paths caused `tsc -b` to attempt to recompile the *source files* of `shared-types` from within `tool-registry`'s context, leading to `rootDir` errors (TS6059). Clearing `paths` with `{}` in the individual package's `tsconfig.json` forces `tsc -b` to rely solely on the `references` and consume the already built `dist` output from `shared-types`, as intended.
        *   **`"isolatedModules": false` (override):** `tsconfig.base.json` had `isolatedModules: true`. This needed to be overridden to `false` in the `tsconfig.json` of library packages being built with `tsc -b`, as `isolatedModules` can interfere with declaration emit and composite project builds.
        *   **`extends` path:** Ensure the `extends` path to `tsconfig.base.json` is relative to the current `tsconfig.json`'s location (e.g., `../../tsconfig.base.json`).
    3.  **Missing Package Dependencies:** The final blocker for `api-gateway` was that `@2dots1line/shared-types` and `@2dots1line/tool-registry` were not listed in its `package.json` dependencies.
        *   **Action:** Added them with `workspace:^0.1.0` and ran `pnpm install`. This allowed `pnpm` to symlink them into `api-gateway/node_modules`, making them discoverable by TypeScript's `nodenext` module resolution.
    4.  **Incorrect/Missing Named Exports:** Even after modules were found, specific types (like `TExtractedEntity`, `TApiResponse`) were not available due to missing explicit re-exports from the main `index.ts` of the shared packages.
        *   **Action:** Added `export type { TExtractedEntity } from './ai/tool.types';` and `export type { TApiResponse } from './api';` to `packages/shared-types/src/index.ts`.
    5.  **`moduleResolution: "nodenext"` and `module: "NodeNext"`:** For backend packages like `api-gateway` that consume other compiled packages, using these modern Node.js module settings in their `tsconfig.json` is appropriate.
*   **Lessons:**
    *   `tsc -b` is non-negotiable for building a graph of TypeScript project references.
    *   Carefully configure `tsconfig.json` for each composite package: `composite`, `declaration`, `noEmit`, `rootDir`, `outDir`, `references`.
    *   **Crucially, clear inherited `paths` ( `"paths": {}` ) in composite library packages if the base `tsconfig.json` has `paths` pointing to `src` directories.** Rely on `references` for inter-package dependencies during build.
    *   `isolatedModules: true` in a base config can be problematic for library packages; override to `false`.
    *   Ensure all consumed workspace packages are actual dependencies in `package.json` so the package manager creates the necessary `node_modules` links.
    *   Verify that all necessary types are explicitly exported from the entry point of your shared library packages.

## 6. ESLint Configuration and Conflicts

*   **Symptom 1 (`web-app`):** Build failed due to missing `eslint-plugin-import`.
    *   **Solution:** Added `eslint-plugin-import` to `devDependencies` in the root `package.json` and ran `pnpm install`.
*   **Symptom 2 (`web-app`):** Build failed due to issues with `eslint-plugin-glsl` (version `0.0.0-wip`).
    *   **Solution:** Removed `eslint-plugin-glsl` from root `package.json` and from the `plugins` array in the root `.eslintrc.js`.
*   **Symptom 3 (`web-app`):** Next.js build showed a warning `⚠ The Next.js plugin was not detected in your ESLint configuration` and had many `import/order` and React-specific linting errors.
    *   **Cause:** `web-app` was inheriting the generic root `.eslintrc.js` and lacked its own Next.js-specific ESLint config.
    *   **Solution:** Created `apps/web-app/.eslintrc.json` with `{
  "extends": "next/core-web-vitals"
}`.
*   **Symptom 4 (`web-app`):** After the above, a warning appeared: `ESLint: Plugin "react-hooks" was conflicted between ".eslintrc.json » eslint-config-next/core-web-vitals ..."` and the root `.eslintrc.js`.
    *   **Cause:** Both the `web-app` local config (via `next/core-web-vitals`) and the root config were trying to manage `eslint-plugin-react-hooks`.
    *   **Solution:** Removed React-specific plugins (`react`, `react-hooks`) and their configurations from the root `.eslintrc.js`, making it more generic. App-specific ESLint (like Next.js) should handle framework linting.
*   **Lessons:**
    *   Keep the root `.eslintrc.js` for universal linting rules applicable to all packages (e.g., import order, basic TypeScript rules).
    *   Applications (like Next.js web apps) or specific UI package groups should have their own tailored ESLint configurations that extend the root config but add framework-specific plugins and rules.
    *   Ensure all ESLint plugins used in configurations are listed as `devDependencies` in the appropriate `package.json` (root or local) and installed.

## 7. Miscellaneous TypeScript Errors

*   **Symptom (`backend-api`):** `TS2742: The inferred type of 'app' cannot be named...`
    *   **Solution:** Added an explicit `Express` type annotation: `const app: Express = express();`.
*   **Symptom (`insight-worker`):** `TS2742: The inferred type of 'worker' cannot be named without a reference to '...@2dots1line/shared-types/src/ai'.`
    *   **Solution:** Added an explicit type annotation for the BullMQ `Worker` instance.
*   **Symptom (`api-gateway` router instances):** Potential for `TS2742`.
    *   **Solution (Proactive):** Added explicit `Router` type annotations: `const router: Router = Router();`.
*   **Lesson:** When TypeScript struggles to infer complex types, especially across module boundaries or with library instances, providing explicit type annotations can resolve `TS2742` errors and improve code clarity.

## 8. Best Practices for Maintaining a Stable Build Environment

This is critical to avoid spending 80% of your time on build issues.

**A. For You (the Human Developer):**

1.  **Understand Your Tools:**
    *   **`pnpm` Workspaces:** Know that `workspace:*` is for local deps. Understand how `pnpm install` creates symlinks in `node_modules`. Use `pnpm list --depth 0` in a package to see its direct dependencies.
    *   **TypeScript Project References:** Understand `composite: true`, `declaration: true`, `references` in `tsconfig.json`, and that `tsc -b` is required. Visualize the dependency graph.
    *   **Turborepo:** Understand how it caches tasks (`.turbo` folder) and runs builds based on package dependencies defined in `turbo.json` (implicitly via `package.json` workspaces or explicitly). Know `turbo run build --filter=<package-name>...` for targeted builds.
2.  **Incremental Changes & Commits:**
    *   After setting up a new package or making significant changes to a package's build configuration or dependencies, try to build *that package and its direct dependents* in isolation first.
    *   **Commit frequently with clear messages** once a package (or a small group of related packages) builds successfully. Example: `fix(database): resolve prisma client import issue` or `feat(api-gateway): setup initial build config with project refs`.
    *   **Do not batch massive refactoring of tsconfig files across the entire monorepo without testing builds incrementally.**
3.  **Configuration Hygiene:**
    *   **`tsconfig.json`:**
        *   Keep `tsconfig.base.json` for truly shared options.
        *   For library packages built with `tsc -b`:
            *   Ensure `composite: true`, `declaration: true` (often via `extends`), `noEmit: false`.
            *   Define `rootDir` and `outDir`.
            *   Use `references` for all internal workspace dependencies.
            *   **Critically: Add `"paths": {}` to override/clear `paths` inherited from the base if the base `paths` point to `src` directories.** This forces reliance on `references` and `dist` outputs.
            *   Consider overriding `isolatedModules: false` if inherited as `true`.
        *   For applications (like `api-gateway`, `web-app`):
            *   They might also be `composite: true` if other packages depend on *them* (less common for top-level apps).
            *   They will use `references` to consume library packages.
            *   Their `paths` can be used for internal aliasing within the app if needed, but be cautious if they also reference other composite projects.
    *   **`package.json`:**
        *   **Always list all direct workspace dependencies** with `workspace:^<version>`. Do not rely on transitive dependencies for linking.
        *   Ensure `main`, `types` (and `exports` if used) correctly point to the `dist` folder.
        *   Build scripts for composite libraries should use `tsc -b`.
    *   **ESLint:**
        *   Maintain a root `.eslintrc.js` for universal, non-framework rules.
        *   Apps/UI packages should have their own ESLint configs (e.g., `apps/web-app/.eslintrc.json`) extending the root and adding framework specifics (like `next/core-web-vitals`).
4.  **Clean Regularly (When Stuck):**
    *   `rm -rf .turbo`
    *   `rm -rf node_modules` (and then `pnpm install`) - use as a stronger measure.
    *   `rm -rf packages/*/dist apps/*/dist services/*/dist workers/*/dist` (or similar to clean all build outputs).
5.  **Dependency Updates:** When updating dependencies (Node, pnpm, TypeScript, Prisma, major libraries), do it cautiously. Update one thing at a time if possible and test the build immediately. Read changelogs for breaking changes.
6.  **Version Control for Configs:** All `tsconfig.json`, `package.json`, `.eslintrc.js`, `pnpm-workspace.yaml`, `turbo.json` files **must** be in Git.

**B. For the Cursor Agent (and Your Interaction with It):**

1.  **Provide Full Context for Build-Related Changes:**
    *   If asking the agent to modify a `tsconfig.json`, explicitly state if it's for a composite library package or an application. Remind it of the key settings: `composite: true`, `declaration: true`, `noEmit: false`, `references`, and the **critical `"paths": {}` override if applicable**.
    *   If adding dependencies to `package.json`, specify `workspace:^<version>`.
    *   Remind it that build scripts for composite packages use `tsc -b`.
2.  **Specify Target Files Clearly:** Always provide the full path from the monorepo root for any file to be modified.
3.  **Incremental Requests:** Don't ask the agent to "fix the build" in one go if there are many errors. Break it down. "The build failed in `package-A` with error X. Please check its `tsconfig.json` and `package.json` for issues related to project references and ensure it lists `package-B` as a dependency."
4.  **Review Agent's Proposed Changes Carefully:**
    *   Before applying, mentally check if the changes align with the monorepo's established patterns (e.g., `tsc -b`, `paths: {}`, `workspace:` protocol).
    *   The agent may not remember *all* the nuances discovered over a long debugging session. You are the orchestrator.
5.  **Agent "Messing Things Up":**
    *   The agent primarily acts on your prompts. If it makes a mistake, it's often because the prompt was ambiguous or lacked specific contextual constraints we've learned are important.
    *   **The best defense is small, incremental changes and immediate verification (build attempts).** If an agent's change breaks the build, and it's not obvious why, revert it immediately (Git helps here) and re-prompt with more specific instructions or context.
    *   Don't let the agent make many file changes across many packages without an intermediate build check.

**C. Git Best Practices in This Context:**

1.  **Commit Small, Logical Units:**
    *   Once a specific error is fixed and *verified with a build*, commit it.
        *   Example: `fix(api-gateway): add missing shared-types, tool-registry deps`
        *   Example: `refactor(shared-types): ensure TApiResponse is exported from main index`
        *   Example: `chore(tool-registry): configure tsconfig for tsc -b and clear paths`
2.  **Branching:** For significant build system refactoring or troubleshooting, use a dedicated branch (e.g., `fix/monorepo-build-issues`). Merge back to your main development branch only when the build is stable.
3.  **Commit Messages:** Be descriptive. If you fixed a TS error, mention the error code or the package. This helps you (and others) search Git history if similar issues reappear.
4.  **Test Before Pushing (if CI is in place):** If you have a CI pipeline that runs `pnpm build`, ensure your changes pass locally before pushing to avoid breaking the build for others.
5.  **`.gitignore`:** Ensure `node_modules`, `dist` folders, `.turbo`, `.tsbuildinfo` files, etc., are correctly gitignored. (Your current `.gitignore` seems to cover most of these).

By following these practices, you can significantly reduce the time spent on recurrent build issues and maintain a more stable and predictable development environment. The key is methodical work, understanding the interactions between your tools, and making small, verifiable changes.

## Final Build Success and Key Learnings (Session Ending YYYY-MM-DD)

After numerous attempts and layered fixes, a stable and successful monorepo build (`pnpm build`) was achieved. The primary remaining blocker was a persistent `glob` module resolution issue within `packages/shader-lib` when built via Turbo, often accompanied by `pnpm install` warnings about "Failed to create bin".

**Key Breakthroughs and Solutions:**

1.  **Aggressive pnpm Cache/Artifact Cleaning:** The most critical step was a thorough cleaning of pnpm-related artifacts. This involved:
    *   Deleting the root `node_modules` folder.
    *   Deleting `packages/shader-lib/node_modules` (and potentially any problematic package's `node_modules`).
    *   Deleting the root `pnpm-lock.yaml` file.
    *   Running `pnpm store prune` to clean corrupted or inconsistent packages from pnpm's global cache.

2.  **Clean `pnpm install`:** Following the aggressive clean, a fresh `pnpm install` was executed. Crucially, this install completed *without* the previous "Failed to create bin" warnings, especially for `glob`. This indicated that pnpm was now able to correctly set up its shims and links.

3.  **Turbo Environment Configuration (`turbo.json`):**
    *   `PNPM_HOME` was added to `globalEnv`: `"PNPM_HOME=/Users/danniwang/Library/pnpm"`.
    *   `PATH` was added to `globalPassThroughEnv`: `["PATH"]`.
    *   These changes ensure that tasks orchestrated by Turbo inherit the correct environment variables necessary for pnpm to function correctly, especially for resolving binaries and modules invoked by `pnpm exec` or scripts run via `node` that rely on pnpm's `node_modules` structure.

4.  **Dependency Scope for `shader-lib` Build Tools:**
    *   `glob` and `fs-extra` were moved from `devDependencies` to `dependencies` in `packages/shader-lib/package.json`. While the clean pnpm state was likely the primary fix for `glob` resolution, having build-critical tools as direct dependencies can sometimes offer more resilience in complex monorepo setups, especially if scripts are run directly with `node` rather than `pnpm exec` (though `pnpm exec` is preferred).

5.  **ESLint Warning Resolution (`apps/web-app`):**
    *   **`LandingSection2.tsx`**: `targetOrbPosition` was wrapped in `useMemo` to resolve `react-hooks/exhaustive-deps`.
    *   **`VideoBackground.tsx`**: `any` types for `ScrollTrigger` instances were replaced with the specific `ScrollTrigger` type.
    *   **`HUDLayer.tsx`**: Type errors were resolved by explicitly typing the `scenes` array with `SceneName` (derived from an exported `SceneState` from `SceneStore.ts`) and removing an unnecessary `as any` cast.
    *   **`orb/__tests__/Orb.test.tsx`**: `any` in a Jest mock for `@react-three/drei`'s `Sphere` component was replaced with `{ children?: React.ReactNode } & Omit<MeshProps, 'children'>`.
    *   **`CardGalleryStore.ts`**: `any` types for `filters` were changed to `unknown` as a safer placeholder pending full type definition.

**Outcome:**
*   A full `pnpm build` now completes successfully with no errors.
*   Previously problematic ESLint warnings in `apps/web-app` have been resolved.
*   All relevant packages (`packages/*`, `services/*`, `workers/*`) consistently generate their `dist` output directories, including `packages/text-tool` which was previously missing its `dist` folder.

This successful resolution highlights the importance of ensuring a clean package manager state (especially with pnpm's complex store and linking mechanisms) and correctly configuring the execution environment for build tools like Turbo.

**Post-Resolution Build Consistency Check (`packages/text-tool`):**

*   **Symptom:** After a successful full monorepo build, it was observed that `packages/text-tool` had not generated its `dist` directory.
*   **Cause:**
    1.  The `build` script in `packages/text-tool/package.json` was `tsc` instead of `tsc -b tsconfig.json --verbose --force`, which is required for composite projects.
    2.  When attempting to build `text-tool` with `tsc -b`, it failed because its `tsconfig.json` was implicitly referencing `packages/tool-registry/tsconfig.json` (which includes test files) instead of `packages/tool-registry/tsconfig.build.json` (which excludes them). This caused `tsc -b` for `text-tool` to try and compile `tool-registry`'s test files, leading to errors.
*   **Solution:**
    1.  Updated `packages/text-tool/package.json` build script to: `"build": "tsc -b tsconfig.json --verbose --force"`.
    2.  Updated `packages/text-tool/tsconfig.json` to explicitly reference: `{ "path": "../tool-registry/tsconfig.build.json" }`.
*   **Outcome:** `packages/text-tool` now builds correctly in isolation and generates its `dist` directory. This reinforces the established pattern for configuring composite TypeScript projects within the monorepo.
*   **Lesson:** Even with a successful overall monorepo build, it's prudent to spot-check individual packages, especially those that might be leaf nodes in the build graph or not critical blocking dependencies, to ensure they are correctly producing their outputs as defined by their `package.json` (`main`, `types` fields) and `tsconfig.json` (`outDir`).

## 9. Modular Development Plan & Workflow Recommendations (Moving Forward)

To continue development while maintaining the hard-won stability of the build environment, the following plan and workflow are recommended:

**A. Development Goals (Iterative Steps):**

1.  **Finish Welcome Landing Page Scroll Motions (`apps/web-app`):**
    *   Focus on enhancing `LandingSection` components with GSAP for scroll-triggered animations.
    *   Work section by section, testing animations in the browser.
    *   Primary packages involved: `apps/web-app`.

2.  **Activate Sign Up & Log In Functionality:**
    *   **Frontend (`apps/web-app`):**
        *   Develop/refine `SignUpModal` and `LoginModal` UI components.
        *   Integrate with `ModalStore` for visibility control.
        *   Implement API client functions (e.g., using TanStack Query or simple fetch wrappers) to call backend authentication endpoints.
        *   Handle form validation, user feedback (loading states, errors, success messages).
    *   **Backend (`apps/api-gateway`, `services/cognitive-hub`, `packages/database`):**
        *   Define RESTful API endpoints in `apps/api-gateway` (e.g., `/api/v1/auth/signup`, `/api/v1/auth/login`).
        *   Implement controllers in `api-gateway` for request handling, input validation (e.g., using Zod).
        *   Develop services within `services/cognitive-hub` for core authentication logic:
            *   User creation (hashing passwords securely, e.g., with bcrypt).
            *   User lookup and password verification.
            *   (Future) Session management (e.g., JWTs).
        *   Utilize repository patterns in `packages/database` (Prisma) for interacting with the User table.
    *   Primary packages involved: `apps/web-app`, `apps/api-gateway`, `services/cognitive-hub`, `packages/database`, `packages/shared-types` (for API request/response types).

3.  **Test End-to-End User Authentication Flow & Basic Data Pipeline:**
    *   Manually test the sign-up process via the UI.
    *   Verify user creation in the PostgreSQL database.
    *   Manually test the log-in process via the UI with valid and invalid credentials.
    *   (If applicable) Verify session establishment/token generation.
    *   API-level testing for auth endpoints (e.g., using Postman or scripts) to ensure robustness.
    *   Write unit and integration tests for new backend authentication logic (services, controllers, repositories).

**B. Recommended Workflow for Stability & Efficiency:**

1.  **Branching Strategy:**
    *   Always work on new features or significant bug fixes in separate **feature branches** (e.g., `feat/welcome-scroll-motions`, `fix/auth-login-validation`).
    *   Create feature branches from the latest `main` (or a designated `develop` branch if adopted).
    *   Keep `main` branch clean and always buildable.

2.  **Development Environment:**
    *   A **single Cursor window** for the project is generally recommended to avoid desynchronization.
    *   Within that window, you can use **multiple chat tabs** to manage different contexts if working on frontend and backend simultaneously for a feature (e.g., one chat for `web-app` changes, another for `api-gateway` changes relating to the same feature branch).
    *   Avoid opening multiple Cursor windows on the *same codebase and branch* unless you have a very clear mental model of which window is for what, to prevent accidental conflicting edits.

3.  **Build & Test Discipline (The "Inner Loop"):**
    *   **Before Starting Work:** Ensure your current branch is up-to-date with `main` (`git pull --rebase origin main`). Run a full `pnpm build` to confirm a clean baseline.
    *   **Incremental Changes:** Make small, focused changes within a package.
    *   **Local Package Build:** After changes in a package, run its local build: `pnpm --filter <package-name> build`. Address any errors immediately.
    *   **Lint & Format:** Regularly run `pnpm lint` and `pnpm format` (or integrate with save actions in Cursor) for the files you're editing.
    *   **Local Full Build:** Periodically, and always before committing non-trivial changes, run a full `pnpm build` from the monorepo root to catch cross-package integration issues.
    *   **Testing:**
        *   Write unit tests for new functions/logic (especially backend).
        *   Write integration tests for interactions between services/modules.
        *   Manually test UI changes in the browser.
    *   **Commit Small, Atomic Units:** Once a logical piece of work is complete, builds successfully, and passes tests, commit it with a clear, descriptive message referencing the task or issue if applicable (e.g., `feat(auth): implement user signup endpoint and service logic (WIP)`).
        *   A good commit is one that you can easily revert if it causes problems.

4.  **Integrating Changes (The "Outer Loop"):**
    *   **Update Feature Branch:** Before considering a feature complete or creating a Pull Request, pull the latest changes from `main` into your feature branch using rebase: `git pull --rebase origin main`. Resolve any merge conflicts locally. Run `pnpm build` and any relevant tests again.
    *   **Pull Requests (PRs):** Use PRs to merge feature branches into `main`.
        *   Ensure the PR description is clear about what was done and why.
        *   If CI is set up, it should run builds and tests on the PR.
    *   **Code Review:** Even for solo developers, reviewing your own PR after a short break can help catch mistakes. If working in a team, this is where peer review happens.

5.  **Using Cursor Agent Effectively:**
    *   Continue to provide clear, specific prompts, especially regarding file paths and the context of changes (e.g., "This is for a composite library package, ensure `tsc -b` and `paths: {}`").
    *   Request changes incrementally and verify with builds.
    *   If an agent-suggested change seems complex or risky, ask for an explanation or break it down further.

By adhering to this structured approach, focusing on small, verifiable steps, and leveraging Git for isolation and history, you can significantly enhance development velocity and minimize time lost to complex build and integration problems. The "Best Practices for Maintaining a Stable Build Environment" detailed in Section 8 of this report remain paramount.

## 10. Summary of Build Output Verification (Post-Refactoring)

After the extensive build system refactoring, a systematic check was performed to ensure all relevant packages produce their expected output directories for consumption within the monorepo. The following summarizes the status:

**Packages Verified to Produce `dist/` output:**

*   `packages/agent-framework`
*   `packages/ai-clients`
*   `packages/canvas-core`
*   `packages/core-utils`
*   `packages/database`
*   `packages/document-tool`
*   `packages/orb-core`
*   `packages/shader-lib` (also creates `src/generated` for its shaders)
*   `packages/shared-types`
*   `packages/text-tool`
*   `packages/tool-registry`
*   `packages/ui-components`
*   `packages/utils`
*   `packages/vision-tool`
*   `apps/api-gateway`
*   `apps/backend-api`
*   `services/cognitive-hub`
*   `workers/embedding-worker`
*   `workers/insight-worker`
*   `workers/scheduler`

**Application-Specific Output Directories:**

*   `apps/web-app`: Produces a `.next/` directory (standard for Next.js applications).

**Exceptions (Not Expected to Produce `dist/` for General Monorepo Consumption):**

*   `apps/storybook`: Its build command (`storybook build`) produces a `storybook-static/` directory for deploying the Storybook instance, not a `dist/` folder for typical library consumption.
*   Root-level utility, asset, documentation, and data directories (e.g., `.github/`, `3d-assets/`, `config/`, `docs/`, `infrastructure/`, `neo4j_data/`, etc.) are not buildable code packages and do not produce `dist/` outputs.

This verification confirms that the build system is now consistently producing the necessary artifacts for all interdependent packages within the monorepo, aligning with their `package.json` `main`/`types` fields and `tsconfig.json` configurations.

## 11. Step-by-Step Guide for a Thorough Clean Monorepo Build

This section provides a definitive guide to performing a completely clean build of the monorepo. This is useful when suspecting issues related to cached artifacts, stale dependencies, or ensuring the build process is sound from the ground up.

**Objective:** To achieve a successful full monorepo build from a pristine state, including handling the Prisma client generation.

**Steps:**

1.  **Clean the Workspace (Root Directory):**
    *   Remove the root `node_modules` directory:
        ```bash
        rm -rf node_modules
        ```
    *   Remove the `pnpm-lock.yaml` file:
        ```bash
        rm -f pnpm-lock.yaml
        ```
    *   Remove all `dist` directories from packages, apps, services, and workers:
        ```bash
        find packages apps services workers -name dist -type d -prune -exec rm -rf '{}' +
        ```
    *   Remove all `next build` output directories from Next.js apps (e.g., `apps/web-app`):
        ```bash
        find apps -name .next -type d -prune -exec rm -rf '{}' +
        ```
    *   Remove all nested `node_modules` directories:
        ```bash
        find packages apps services workers -name node_modules -type d -prune -exec rm -rf '{}' +
        ```
    *   Remove all TypeScript build info files:
        ```bash
        find packages apps services workers -name tsconfig.tsbuildinfo -type f -delete
         find packages apps services workers -name "tsconfig2.tsbuildinfo" -type f -delete
        ```
    *   Remove all nested `.turbo` cache directories:
        ```bash
        find packages apps services workers -name .turbo -type d -prune -exec rm -rf '{}' +
        ```
    *   Remove the root `.turbo` cache directory:
        ```bash
        rm -rf .turbo
        ```
    *   **Expected Outcome:** Your workspace is now free of previous build artifacts and dependency installations, except for pnpm's global store.

2.  **Prune the pnpm Store:**
    *   This removes orphaned and unreferenced packages from pnpm's global content-addressable store.
        ```bash
        pnpm store prune
        ```
    *   **Expected Outcome:** A message confirming that cached metadata and potentially some files/packages have been removed.

3.  **Install Dependencies:**
    *   Perform a fresh installation of all dependencies using pnpm.
        ```bash
        pnpm install
        ```
    *   **Expected Outcome:** `pnpm install` completes successfully. You will see output related to dependency resolution, downloads, and linking, followed by any postinstall scripts (including Prisma's). Deprecation warnings for sub-dependencies are normal.

4.  **Manually Generate Prisma Client (for `@2dots1line/database`):**
    *   To ensure the Prisma client is correctly generated and available, especially after a very clean install, run this command:
        ```bash
        cd packages/database && pnpm exec prisma generate && cd ../..
        ```
    *   **Expected Outcome:** A success message indicating "Generated Prisma Client" into `packages/database/node_modules/.prisma/client`.

5.  **Perform a Forced Full Monorepo Build:**
    *   Use the `--force` flag with Turbo to ensure no cached build artifacts from previous partial builds are used.
        ```bash
        pnpm build --force
        ```
    *   **Expected Outcome:** The build process completes for all packages without any errors. You should see "Tasks: XX successful, XX total" and "Cached: 0 cached, XX total".

**Committing Stable Configuration and Pushing to Main:**

Once the above steps result in a consistently successful clean build, it's a good time to commit any configuration changes (`package.json`, `tsconfig.json`, etc.) that contributed to this stability.

*Assumptions: Build artifacts like `dist/`, `.next/`, and `.tsbuildinfo` files are correctly listed in your `.gitignore` file and will not be committed.*

1.  **Check Git Status:**
    ```bash
    git status
    ```
    *   Review the modified files. These should primarily be configuration files, source code, and potentially `pnpm-lock.yaml`.

2.  **Stage Changes:**
    ```bash
    git add .
    ```
    *   Or stage files individually if you prefer more granular control.

3.  **Commit Changes:**
    ```bash
    git commit -m "chore: stabilize monorepo build process and configurations"
    ```
    *   Use a clear and descriptive commit message.

4.  **Ensure Local `main` Branch is Up-to-Date (Optional but Recommended):**
    *   If you were working on a separate branch to fix the build:
        ```bash
        git checkout main
        git pull origin main # Or your remote name for main
        git merge your-build-fix-branch
        # Resolve any merge conflicts if they occur, then commit the merge.
        ```
    *   If you were already on `main`, ensure it's synchronized with the remote:
        ```bash
        git pull origin main # Or your remote name for main
        ```

5.  **Push to `main`:**
    ```bash
    git push origin main # Or your remote name for main
    ```
    *   **Expected Outcome:** Your local changes, which ensure a stable and clean build process, are pushed to the remote `main` branch.

This comprehensive clean build and commit process ensures that the repository's `main` branch always represents a state that can be reliably built from scratch.

## 12. Recommended Workflow for Feature/Module Development

This chapter outlines a recommended workflow for developing new features or modules within the monorepo, emphasizing stability, iterative progress, and proper integration.

**A. Starting a New Feature or Module:**

1.  **Ensure `main` is Up-to-Date:**
    *   Before starting new work, make sure your local `main` branch is synchronized with the remote repository's `main` branch.
        ```bash
        git checkout main
        git pull origin main # Replace 'origin' if your remote has a different name
        ```
    *   **Optional but Recommended:** Perform a clean build (as per Chapter 11) on `main` to ensure you're starting from a known good state.

2.  **Create a Feature Branch:**
    *   Create a new branch from `main` for your feature or module. Use a descriptive name.
        ```bash
        git checkout -b feat/my-new-feature  # Example: feat/user-profile-page
        # or for a fix:
        # git checkout -b fix/login-bug
        ```
    *   **Expected Outcome:** You are now on a new branch, isolated from `main`, where you can make changes.

**B. Developing the Feature/Module:**

1.  **Locating or Creating Packages/Files:**
    *   Identify the existing package(s) (`apps/*`, `services/*`, `packages/*`, `workers/*`) where your new code will reside.
    *   If creating a new package, follow the established structure and ensure it's added to `pnpm-workspace.yaml` and any relevant `tsconfig.json` references in consuming packages.

2.  **Installing New Dependencies:**
    *   **Workspace-level (Root) Dev Dependencies:** If a new tool is needed for the entire workspace (e.g., a new linter plugin), add it to the root `package.json`:
        ```bash
        pnpm add -D -w <new-dev-module-name>
        ```
    *   **Package-Specific Dependencies:** If a package requires a new external library:
        ```bash
        # Navigate to the package if you prefer, or use --filter
        cd packages/<your-package>
        pnpm add <new-module-name>
        # or from the root:
        # pnpm --filter @2dots1line/<your-package> add <new-module-name>
        ```
    *   **Internal Workspace Dependencies:** If your feature in `package-A` now needs to use `package-B` from the workspace:
        *   Edit `packages/package-A/package.json` and add `"@2dots1line/package-B": "workspace:^"`.
        *   Update `packages/package-A/tsconfig.json` to include `{ "path": "../package-B" }` in its `references`.
    *   After adding dependencies, `pnpm install` is often run automatically by these commands, but you can run it explicitly from the root if needed:
        ```bash
        pnpm install
        ```
    *   **Expected Outcome:** New dependencies are installed, and `pnpm-lock.yaml` is updated.

3.  **Writing Code & Incremental Builds:**
    *   Make your code changes incrementally.
    *   **Local Package Build:** After making changes within a specific package (`my-package`):
        ```bash
        pnpm --filter @2dots1line/my-package build
        ```
        Address any TypeScript or build errors immediately.
    *   **Linting and Formatting:** Regularly apply linting and formatting to your changes.
        ```bash
        # For specific files, or run from root for all staged files via lint-staged on commit
        pnpm lint <path/to/your/file.ts>
        pnpm prettier --write <path/to/your/file.ts>
        ```
    *   **Testing:**
        *   Write unit tests for new functions and logic. Run them with:
            ```bash
            pnpm --filter @2dots1line/my-package test
            ```
        *   For UI changes, manually test in the browser.

4.  **Committing Changes to the Feature Branch:**
    *   Commit your work frequently in small, logical, and *working* increments. A commit should represent a self-contained piece of progress.
    *   Before each commit on your feature branch:
        1.  Ensure the specific package(s) you worked on build locally.
        2.  Consider running a full monorepo build if changes are significant or cross-cutting: `pnpm build`.
        3.  Ensure tests for your changes pass.
    *   Example commit:
        ```bash
        git add . # Or specific files
        git commit -m "feat(user-profile): implement basic profile data display"
        ```
    *   **Expected Outcome:** Your feature branch progresses with a history of stable, working changes.

**C. Finalizing and Merging the Feature:**

1.  **Complete Feature Development & Testing:**
    *   Ensure all aspects of the feature are implemented as per requirements.
    *   Complete all necessary unit and integration tests.
    *   Perform thorough end-to-end testing if applicable.

2.  **Update Feature Branch with Latest `main`:**
    *   Before merging, rebase your feature branch onto the latest `main` to incorporate any changes made by others and to maintain a linear history.
        ```bash
        git checkout feat/my-new-feature
        git fetch origin # Fetch latest changes from remote
        git rebase origin/main
        ```
    *   Resolve any merge conflicts that arise during the rebase.
    *   **Crucially, after a successful rebase, run a full clean build and all relevant tests again:**
        ```bash
        # Consider a full clean if many changes were pulled from main (see Chapter 11)
        # Then:
        pnpm install # If lockfile changed or clean was aggressive
        cd packages/database && pnpm exec prisma generate && cd ../.. # if database schema or client use changed
        pnpm build --force
        pnpm test # Run all tests or relevant ones
        ```
    *   **Expected Outcome:** Your feature branch is up-to-date with `main` and is confirmed to build and pass tests.

3.  **Create a Pull Request (PR):**
    *   Push your feature branch to the remote repository:
        ```bash
        git push origin feat/my-new-feature
        ```
    *   Go to your Git hosting platform (e.g., GitHub, GitLab) and create a Pull Request from your feature branch to `main`.
    *   Write a clear PR description: what the feature does, why it's needed, how it was implemented, and any specific testing instructions.
    *   Link to any relevant issues or tasks.

4.  **Code Review & CI Checks (If Applicable):**
    *   If your project has a Continuous Integration (CI) pipeline, it should automatically run builds and tests on the PR.
    *   If working in a team, your PR will be reviewed by other developers. Address any feedback.

5.  **Merge to `main`:**
    *   Once the PR is approved and all checks pass, merge it into `main` (usually via the Git hosting platform's UI, often using a "squash and merge" or "rebase and merge" strategy).
    *   Delete the feature branch after merging (optional, but good practice).

6.  **Post-Merge Verification (Optional but Recommended):**
    *   After your PR is merged, pull the latest `main` locally and run a final build/test cycle to be absolutely sure.
        ```bash
        git checkout main
        git pull origin main
        # Optional: pnpm build --force, pnpm test
        ```

This workflow helps ensure that new development is done in an isolated manner, integrated carefully, and that the `main` branch remains stable and buildable at all times.




## Summary of Output Directories:

### The following packages/applications produce specific build output directories:

Packages (packages/*): All packages in this directory now correctly produce a dist/ directory.
agent-framework
ai-clients
canvas-core
core-utils
database
document-tool
orb-core
shader-lib (also creates src/generated)
shared-types
text-tool
tool-registry
ui-components
utils
vision-tool
Applications (apps/*):
apps/api-gateway: Produces a dist/ directory.
apps/backend-api: Produces a dist/ directory.
apps/web-app: Produces a .next/ directory (standard for Next.js applications).
apps/storybook: This application is an exception. Its build command storybook build produces a storybook-static/ directory. It does not produce a dist/ directory for general consumption within the monorepo in the same way library packages do.
Services (services/*):
services/cognitive-hub: Produces a dist/ directory.
Workers (workers/*): All workers in this directory now correctly produce a dist/ directory.
workers/embedding-worker
workers/insight-worker
workers/scheduler

### Directories NOT Expected to Produce dist/ (or similar build artifacts for monorepo consumption):

Root-level configuration/asset/documentation directories:
.github/
.husky/
.turbo/ (cache directory)
3d-assets/
archive/
config/
docs/
infrastructure/
neo4j_data/, postgres_data/, redis_data/, weaviate_data/ (data stores)
temp_pnpm_version_check/
The monorepo root directory itself.
