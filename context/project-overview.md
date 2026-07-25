# Roadly

## Overview

Roadly is a feature request and roadmap tool. End users submit feature requests and vote on them through an embeddable widget placed inside a third-party host application; a product team manages those requests, moves them across roadmap stages, and communicates status through a separate admin dashboard.

## Goals

1. Let end users submit and upvote feature requests from inside a host app, without a separate login.
2. Let a product team triage requests and manage a public roadmap (Backlog → Planned → In Progress → Shipped).
3. Keep the widget lightweight and embeddable while giving the admin dashboard a full management UI.

## Surfaces

- **Widget** — public/end-user facing. Embedded inside a host app and initialized via a script, e.g. `Roadly.init({ ... })`. Users submit and vote on requests.
- **Admin dashboard** — product-team facing. A standalone app with its own sign-in, used to manage requests and the roadmap.

## Core User Flows

### Widget (end user)

1. Host app loads and initializes the widget, passing the current user's identity.
2. User views the list of existing feature requests, sortable by votes or newest.
3. User upvotes existing requests (one vote per user per request) or submits a new request.

### Admin dashboard (product team)

1. Team member signs in.
2. Team member views all requests on the Roadmap Board.
3. Team member drags requests between status columns and (future) responds to comments.

## Features

### Feature Requests (widget)

- Submit a feature request (title, description, optional category).
- Public list view, sortable by votes or newest.
- Upvote — one vote per user per request, with duplicate-vote prevention.

### Roadmap Board (admin dashboard)

- Roadmap Board with columns: Backlog / Planned / In Progress / Shipped.
- Drag-and-drop requests between statuses (admin only).

### Authentication

- Admin dashboard sign-in with role-based access.
- Widget identity is passed in by the host app. For MVP the widget trusts the host app's claimed identity (identified but unverified); verified identity is a future addition.

## Scope

### In Scope (MVP)

- Submit feature request
- Public list view sortable by votes / newest
- Upvote with one-vote-per-user
- Roadmap Board with drag-and-drop columns (admin)
- Admin dashboard authentication
- Widget identity passed in by the host app (unverified)

### Future

- Verified widget identity
- Comments on requests
- Admin vs. regular user roles
- Filtering (status, category, "my requests")
- Pagination on the requests list
- Status-change notifications (email or in-app)

### Out of Scope

- Duplicate-request detection on submit
- Public read-only roadmap embed
- Analytics / vote trends
- Billing / subscriptions
- Native mobile applications

## Success Criteria

1. An end user can submit a feature request through the widget and see it appear in the list.
2. An end user can upvote a request once, with a second attempt prevented, and the count updates immediately.
3. An admin can sign in and drag a request between status columns, persisting the new status.