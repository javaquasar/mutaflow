# Published Next App Example

This example consumes the published npm packages instead of the local workspace packages.

## What It Shows

- `mutaflow` installed from npm
- `@mutaflow/devtools` installed from npm
- a real Next.js App Router page
- a real server action
- optimistic insert, rollback, reconcile, and consistency metadata
- a visual devtools panel for understanding the mutation lifecycle

## Best Entry Point

If you want to understand the architecture before running the app, read:

- [docs/CONCEPTS.md](../../docs/CONCEPTS.md)

That document explains:

- what a flow is
- how optimistic updates work
- when rollback happens
- how reconcile differs from invalidation
- how `mutaflow/next/server` connects to Next cache APIs
- how devtools and testkit observe the same runtime

## Install

```powershell
cd C:\Workspace\prj\react\mutaflow\examples\published-next-app
npm install
```

## Run

```powershell
npm run dev
```

Then open:

- [http://localhost:3000](http://localhost:3000)

## Demo Scenarios

Try these from the page:

- `Fast success`: optimistic item appears and quickly reconciles.
- `Slow success`: optimistic item stays visible long enough to inspect the devtools timeline.
- `Server error`: optimistic item rolls back and the error is visible in the event stream.

## Why This Example Exists

The workspace example in [examples/next-app](../next-app/README.md) is useful for developing the repo itself.

This example proves the public install story:

- install from npm
- build in a consumer app
- run in the browser
- inspect real flows with published packages
