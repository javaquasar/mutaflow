# Next App Example

A full App Router example for Mutaflow.

## What it shows

- real Next.js App Router structure
- a real server action in [app/actions.ts](app/actions.ts)
- optimistic client-side resource state via [lib/client-store.ts](lib/client-store.ts)
- a flow defined in [lib/flows.ts](lib/flows.ts)
- a reusable invalidation registry built on `mutaflow/next`
- `consistency.immediate(...)` for read-your-own-writes behavior
- event-driven mutation tracking and a prototype devtools panel
- initial server data hydration into the client store

## Files to start with

- [app/page.tsx](app/page.tsx)
- [app/actions.ts](app/actions.ts)
- [app/_components/TodoExperience.tsx](app/_components/TodoExperience.tsx)
- [app/_components/DevtoolsPanel.tsx](app/_components/DevtoolsPanel.tsx)
- [lib/flows.ts](lib/flows.ts)

## Run locally

```powershell
cd examples/next-app
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

This example uses a tiny in-memory server-side data module in [lib/data.ts](lib/data.ts) so the focus stays on Mutaflow and not on database setup.

If your app uses `next-safe-action`, the corresponding Mutaflow helper API lives at `mutaflow/next-safe-action`.


