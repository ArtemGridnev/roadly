# Roadly: Testing Strategy

Test where a bug would hurt a user or break a promise the product makes. Most of the value is in integration tests: real code running together, with only the outside world faked. Keep the suite small enough that every test is worth reading.

## Layers

| Layer | Where | Tools | Role |
|---|---|---|---|
| API e2e | `apps/api/src/**/*.e2e-spec.ts` | Jest + Supertest, real Postgres (`apps/api/test/docker-compose.yml`) | Main backend layer. Real HTTP through guards, pipes, DTOs, Prisma and DB constraints. |
| Frontend integration | `apps/dashboard`, `apps/widget`, next to the file they test (`*.test.tsx`) | Vitest + React Testing Library + user-event | Main frontend layer. Render a feature, act like a user, fake only the server. |
| Unit | Next to the file they test | Vitest (frontend), Jest (API) | Only for pure logic with real rules. |
| Browser e2e | Not set up yet | Playwright | 1 to 3 tests for what only a real browser can prove. |

### API e2e

- Boot the real app with `createTestingApp()` and hit routes over HTTP. Do not call services directly.
- Tables are truncated before every test (`test/app.e2e-spec.ts`). Each test seeds its own data with the helpers in `test/utils`.
- Assert on the response and, when it matters, on the database state.
- No mocked Prisma. If a service only reads and writes through Prisma, the e2e tests cover it.

### Frontend integration

- Fake the network only: `mockApi()` stubs `fetch` per `METHOD /path`. An unhandled request throws, so unexpected calls fail the test.
- Each test sets up its own routes. Take the Agent and Workspace data from `src/test/fixtures.ts` instead of redefining them. Vitest undoes the `fetch` stub after each test (`unstubGlobals`).
- Render through `renderApp()` (dashboard) so the real router, store and RTK Query run. The widget uses the same approach with a fresh TanStack `QueryClient` per test.
- Query by role, label and text. Not by class name, test id or component internals.
- Do not `vi.mock` our own hooks, slices or API layer.

### Unit

- Only when a function has logic worth isolating: parsing, sorting, formatting, language detection, slug rules, token claim checks.
- No unit tests for components, for services that only call Prisma, or for code that only wires things together.

## Always cover

The product's promises. Each one needs a test, and a change that touches one must keep its test passing.

- **Tenant isolation.** A Workspace can never read, change or delete another Workspace's data. Cross-workspace access returns 404. Cover reads and writes.
- **Auth guards.** No token gives 401. An Agent outside the Workspace is rejected. Widget and Agent tokens are never accepted in place of each other.
- **Auth sessions.** Refresh token rotation, a reused refresh token is rejected, logout revokes the session.
- **Widget identity.** Signed session rules (signature, algorithm, audience, expiry, secret rotation) and enforcement of signed identity.
- **One Vote per Contact per Feature Request**, including two votes sent at the same time. No voting or un-voting on Shipped requests.
- **The widget never exposes admin data.** No author name, email, `authorId` or other Contact ids in widget responses.
- **Client input never sets ownership.** `authorId` and `workspaceId` sent by the client are rejected.
- **Optimistic update rollback.** When an optimistic change fails, the UI goes back and says so.
- **Rate limits.** One test per limit: the request after the limit gets 429.

Not applicable yet, cover when the feature exists: role guards (all Agents have equal access in MVP) and Status transition rules (any move is allowed today).

## Rules for every test

- **It must fail when the behavior breaks.** After writing a test, temporarily break the code it protects, confirm the test fails, then revert. Mention this check in the task summary.
- **Every bug fix gets a regression test** that fails before the fix and passes after.
- **Name it by behavior**, as a sentence: `rejects a second vote from the same contact`, not `calls votesService.create twice`.
- **One reason to fail.** Cover cases that behave differently, not every input for the same rule.

## When changing code

- Before starting, run the tests of the app you are changing. Note any test that already fails, and do not fix unrelated failures in the same task.
- After changing code, run the existing tests before editing any test. A failing test means one of:
  - **The task changes this behavior.** Update the test to the new behavior. This is part of the task, not an exception. List the changed tests in the task summary.
  - **The task does not change this behavior.** The code broke something. Fix the code, not the test.
  - **Not sure which.** Stop and ask.
- Never write code whose only purpose is to make a test pass (special cases for test data, checks for the test environment, keeping old behavior alive just for a test). If a test and the intended behavior disagree, the test changes.
- Never skip or delete a test to make the suite pass. If a test no longer makes sense, say so in the task summary.

## Do not add

Defaults, not hard bans. To add a test that goes against one, explain why in the task summary.

- Tests for routes or features that do not exist.
- Repeats of global behavior in every controller. Global `ValidationPipe` rules (unknown fields, whitelisting) are tested once.
- Assertions on styling: class names used for looks, colors, sizes.
- Tests of translation file content or exact copy.
- Tests of libraries: shadcn, Radix, dnd-kit pointer dragging, RTK Query or TanStack Query internals.
- Mocks of our own hooks or of Prisma.
- Snapshot tests.
- A coverage percentage target.
- Visual regression, contract tests, Storybook, fuzzing.

## Running

```bash
pnpm test                                    # frontend tests (Turborepo)
pnpm test:e2e                                # API e2e, needs the test Postgres
npx vitest run src/path/to/file.test.tsx     # one frontend file, from the app folder
```

Start the test Postgres with `docker compose -f apps/api/test/docker-compose.yml up -d`. API e2e reads `apps/api/.env.test`.
