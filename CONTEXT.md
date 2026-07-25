# Roadly

A feature-request and roadmap tool. End users submit and vote on feature requests through an embeddable widget hosted inside a third-party app; a product team triages those requests and manages a public roadmap through a separate admin dashboard.

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

**End User**:
A person who submits and votes on Feature Requests through the Widget. Identified by a host-supplied id/name/email (unverified in MVP), never signs in, never has admin capabilities.
_Avoid_: User, member, account

**Team Member**:
A person who signs into the Admin Dashboard to triage Feature Requests and manage the roadmap. Has credentials; in MVP, every Team Member has identical (full) access — no admin/regular distinction yet.
_Avoid_: User, admin, product team (that's the group, not the individual)

**Feature Request**:
A titled, described suggestion submitted by an End User through the Widget, with a Status and an optional Category. The unit of both voting and roadmap tracking.
_Avoid_: issue, ticket, item, idea

**Vote**:
A single End User's upvote on one Feature Request. One Vote per (End User, Feature Request) pair — enforced by a unique constraint. There is no downvote in scope.
_Avoid_: like, upvote (as a noun — "upvote" is the action of casting a Vote, "Vote" is the record)

**Category**:
An optional free-text label an End User attaches to a Feature Request at submission. Not a predefined/curated list — no admin category-management feature exists.
_Avoid_: tag, type, label

**Roadmap Board**:
The Admin Dashboard surface listing Feature Requests in kanban (by Status column) or table view, with drag-and-drop Status changes. Short form: Board (used in code — `boardSlice`, `<Board>`).
_Avoid_: status board, board (in prose)

**Status**:
The stage of a Feature Request on the roadmap: `Backlog → Planned → In Progress → Shipped`. Set by the product team; there is no rejection/decline state in MVP scope.
_Avoid_: Open, Done, state (as a noun)
