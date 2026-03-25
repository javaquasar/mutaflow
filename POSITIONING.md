# Mutaflow Positioning

## Slogan

Mutaflow makes Next.js Server Actions feel like a real mutation system.

Alternative short slogans:
- Mutation flows for Next.js
- Optimistic UI without the glue code
- The orchestration layer for Server Actions

## What Mutaflow Is

Mutaflow is a mutation orchestration library for Next.js App Router and React Server Actions.

It does not try to replace server actions, schema validation, or transport-level safety.
It focuses on the layer that starts after an action is already callable:

- optimistic updates
- rollback
- invalidation
- reconciliation
- redirects
- mutation status
- UX side effects
- developer tooling around mutation flows

## Core Positioning

next-safe-action helps define and execute type-safe actions.

Mutaflow helps orchestrate what happens around and after a mutation.

The main difference is focus:

- next-safe-action: action definition and execution safety
- Mutaflow: mutation workflow and UI consistency

Mutaflow should work with:
- plain Next.js server actions
- next-safe-action
- custom action wrappers

## ICP

### Primary ICP

Frontend and full-stack teams building real CRUD products with Next.js App Router:

- SaaS dashboards
- internal admin panels
- collaborative tools
- ecommerce back offices
- content platforms

These teams usually have:
- many forms and mutations
- optimistic UI needs
- cache invalidation complexity
- repeated mutation boilerplate
- a desire to keep Server Actions, not move back to API routes

### Secondary ICP

Library-minded teams that already use:
- next-safe-action
- Zod or Standard Schema
- React 19 features
- App Router with cache tags and revalidation

They care about:
- consistency
- less glue code
- predictable mutation behavior
- strong TypeScript ergonomics

## Problems Mutaflow Solves

### 1. Mutation glue code is scattered

Today the logic is split across:
- server action body
- useOptimistic
- useActionState
- revalidatePath
- revalidateTag
- redirect
- toasts
- client event handlers

Mutaflow gives one place to describe the mutation flow.

### 2. Optimistic UI is too low-level

React provides primitives, but production apps need higher-level behavior:
- temporary IDs
- rollback
- reconciliation with server data
- conflict-safe updates
- repeatable patterns across lists and detail views

### 3. Invalidation is hard to standardize

Teams often struggle with:
- path vs tag invalidation
- read-your-own-writes behavior
- naming consistency
- forgotten invalidations
- duplicated revalidation logic

Mutaflow makes invalidation declarative and reusable.

### 4. Mutation state is not observable enough

Developers need visibility into:
- what started
- what changed optimistically
- what got invalidated
- what rolled back
- what failed and why

Mutaflow should make mutation lifecycles inspectable.

## Key Features

### Declarative mutation flows

Describe one mutation in one place:
- run
- optimistic patch
- rollback
- reconcile
- invalidate
- redirect
- callbacks

### Built-in optimistic workflows

Not just "temporary render state", but structured support for:
- insert
- update
- remove
- reorder
- temp IDs
- success reconciliation
- automatic revert on failure

### Unified invalidation

A single abstraction over:
- revalidatePath
- revalidateTag
- updateTag

With reusable helpers and type-safe conventions.

### Adapter-based integration

Mutaflow should accept:
- plain server actions
- next-safe-action actions
- custom action clients

### Mutation devtools

A timeline for:
- started
- optimistic patch applied
- succeeded
- rolled back
- invalidated tags or paths
- redirected

### Strong TypeScript ergonomics

Mutaflow should infer:
- input
- result
- optimistic payloads
- mutation event hooks

## Anti-Features

These are things Mutaflow should avoid, especially in v0.1.

### Not another action validation library

Mutaflow should not compete on:
- schema definition
- auth middleware
- transport safety
- input parsing

That is already well served by existing tools.

### Not a generic global state manager

Mutaflow should not try to become:
- Zustand
- Redux
- TanStack Query replacement
- full client cache

Its scope is mutation flows around Server Actions.

### Not an all-in-one form framework

Mutaflow can support forms, but should not become a giant form engine in v0.1.

### Not magic-heavy

The API should stay explicit.
Developers should be able to understand:
- what is optimistic
- what is invalidated
- what is rolled back
- when redirects happen

### Not tightly coupled to one stack

Mutaflow should feel native to Next.js first, but avoid needless lock-in in the API design.

## Positioning Statement

Mutaflow is the mutation orchestration layer for Next.js Server Actions.

If next-safe-action makes actions safe to call, Mutaflow makes mutations predictable to ship.
