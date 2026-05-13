# ADR-001: Turborepo + pnpm Workspaces

## Status
Accepted

## Context
The Excellence project requires a monorepo structure to share types and contracts across Electron shell, React renderer, extraction-core, excel-sdk, and Python backend services. We need deterministic builds and parallel task execution.

## Decision
Use Turborepo for task orchestration with pnpm workspaces for package management.

### Rationale
- **pnpm**: Faster installs, strict dependency isolation via content-addressable storage, native workspace support
- **Turborepo**: Incremental builds, topological task ordering (shared-types builds before consumers), remote caching potential
- **Alternative rejected**: Nx — heavier, more opinionated, unnecessary for our package count

## Consequences
- All packages declare dependencies explicitly — no phantom dependencies
- `turbo.json` pipeline ensures shared-types builds first via `^build` dependency
- CI uses `pnpm install --frozen-lockfile` for reproducibility
- Each package maintains its own `tsconfig.json` extending `tsconfig.base.json`
