# Feature Request & Roadmap Board — Project Plan

## Overview
A feedback and roadmap tool with two surfaces:

1. **Embeddable Widget** — public-facing, embedded inside a third-party host app. End users submit feature requests and vote on existing ones.
2. **Admin Dashboard** — standalone app for managing the board: updating status, moderating, responding to comments.

## Stack

**Frontend**
- React + TypeScript
- Redux Toolkit + RTK Query
- dnd-kit (drag-and-drop status board)

**Backend**
- NestJS
- Database: TBD (schema design in progress)

## Auth Design

**Widget (end users)**
- **MVP:** identified but unverified. The host app passes the current user's id/name/email directly into the widget's init call (e.g. `Widget.init({ userId, name, email })`). No signing, no secret, no backend token generation. This trusts the host app's claimed identity by design and is documented as a known trade-off.
- **Post-MVP:** identity verification via a signed, short-lived JWT. The host app's backend signs a payload containing the user's identity with a shared secret; the widget passes this token at init instead of raw user data; the backend verifies the signature and expiry before trusting the identity. Prevents user impersonation.

**Admin Dashboard**
- Self-built authentication: JWT/sessions, refresh tokens, role-based guards (admin vs. regular user).

## Feature Scope

### Core (MVP)
1. Submit feature request (title, description, optional category)
2. Public list view, sortable by votes / newest
3. Upvote — one vote per user per request
4. Status board — Backlog / Planned / In Progress / Shipped, drag-and-drop (admin)
5. Dashboard authentication
6. Widget identity: identified but unverified (host app passes user data directly)

### Stretch
7. Identity verification for the widget (signed, short-lived JWT)
8. Comments
9. Admin vs. regular user roles
10. Filtering (status, category, "my requests")
11. Pagination
12. Status-change notifications (email or in-app)

### Nice-to-have
13. Duplicate-request detection on submit
14. Public read-only roadmap embed
15. Basic analytics (top requesters, vote trends)

## Redux Slices (planned)
- `requestsSlice` — normalized requests list (entity adapter), filters/sort state
- `boardSlice` — column order, drag state
- RTK Query API slice — server calls, optimistic updates on upvote

## Next Steps
- Finalize DB schema (entities: User, FeatureRequest, Vote, Comment)
- Decide ORM (Prisma vs TypeORM)
- Scaffold repo structure