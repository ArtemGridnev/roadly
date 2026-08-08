# Roadly

A multi-tenant feature-request and roadmap tool. Contacts submit and vote on feature requests through an embeddable widget hosted inside a third-party app; each customer business (Workspace) has a product team that triages those requests and manages a public roadmap through a separate admin dashboard.

## Language

**Widget**:
The embeddable, unauthenticated end-user surface. Mounts into a host-provided container inside Shadow DOM and is initialized via `Roadly.init({ container, user, theme })`.
_Avoid_: embed, plugin

**Host App**:
The third-party application that embeds the Widget and supplies the end user's identity to it.
_Avoid_: parent app, client app

**Admin Dashboard**:
The standalone, authenticated surface the product team uses to triage Feature Requests and manage the roadmap.
_Avoid_: admin panel, backoffice, CMS

**Workspace**:
One customer business using Roadly. Roadly is a single shared platform serving many Workspaces (a real multi-tenant SaaS, not one deployment per customer). Every Contact and Feature Request belongs to exactly one Workspace; an Agent can belong to several.
_Avoid_: tenant, account, organization

**Contact**:
A person who submits and votes on Feature Requests through the Widget, scoped to one Workspace. Identified by a host-supplied id/name/email (unverified in MVP), never signs in, never has admin capabilities.
_Avoid_: User, EndUser, End User, member, account

**Agent**:
A person who signs into the Admin Dashboard to triage Feature Requests and manage the roadmap. Has credentials; a global identity that can belong to multiple Workspaces (linked via WorkspaceMember). In MVP, every Agent has identical (full) access within a Workspace — no admin/regular distinction yet.
_Avoid_: User, TeamMember, Team Member, admin, product team (that's the group, not the individual)

**Feature Request**:
A titled, described suggestion submitted by a Contact through the Widget, with a Status and an optional Category. The unit of both voting and roadmap tracking.
_Avoid_: issue, ticket, item, idea

**Vote**:
A single Contact's upvote on one Feature Request. One Vote per (Contact, Feature Request) pair — enforced by a unique constraint. There is no downvote in scope.
_Avoid_: like, upvote (as a noun — "upvote" is the action of casting a Vote, "Vote" is the record)

**Category**:
An optional free-text label a Contact attaches to a Feature Request at submission. Not a predefined/curated list — no admin category-management feature exists.
_Avoid_: tag, type, label

**Roadmap Board**:
The Admin Dashboard surface listing Feature Requests in kanban (by Status column) or table view, with drag-and-drop Status changes. Short form: Board (used in code — `boardSlice`, `<Board>`).
_Avoid_: status board, board (in prose)

**Status**:
The stage of a Feature Request on the roadmap: `Backlog → Planned → In Progress → Shipped`. Set by the product team; there is no rejection/decline state in MVP scope.
_Avoid_: Open, Done, state (as a noun)
