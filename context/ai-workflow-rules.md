# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and what the current state of progress is. Always implement against these specs — do not infer or invent behavior from scratch.

## Tool Readiness

Before implementation:

- Verify all required tools, permissions, and MCP servers are available.
- Verify required repository, environment, and service access exists.
- If required access is missing, stop and document the blocker before proceeding.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When to Split Work

Split an implementation step if it combines:

- Host UI changes and remote widget changes
- API service changes and unrelated UI changes
- Multiple unrelated features or routes
- Behavior not clearly defined in context files or existing source code

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in context files or existing source code.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Patterns

Do not modify the following without an explicit instruction to do so:

- `packages/shared` type and contract definitions — consumed by `apps/widget`, `apps/dashboard`, and `apps/api` simultaneously; changes ripple across all three
- `apps/widget/vite.config.ts` library-mode build config — controls the self-mounting IIFE/UMD bundle and Shadow DOM mounting; breaking it breaks every host embed of the widget

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes affect:

- System architecture or module boundaries
- API contract (endpoints, payloads, response shapes)
- Widget embedding contract (`Roadly.init()` options, shared types in `packages/shared`)
- Code conventions or standards
- Feature scope

Progress state in `progress-tracker.md` must reflect the actual implementation state, not the intended state.

## Reuse Before Creation

Before writing new code:

- Search for an existing component, hook, utility, skeleton, or abstraction that can be reused.
- Prefer reuse and extension over duplication.
- Do not create new reusable components when an existing one can satisfy the requirement with reasonable changes.
- Create new abstractions only when there is a clear need that cannot be addressed by existing code.

## After Implementation

1. Run `npm run lint` to check for linting errors.
2. Run `npm run build` to verify the change compiles and builds cleanly.
3. Run relevant unit tests: `npx vitest run src/path/to/file.test.ts`.
4. Update `progress-tracker.md` to reflect completed work.
5. Summarize changed files and mention risks, assumptions, or incomplete areas.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. `npm run build` passes without errors.
