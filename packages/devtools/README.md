# @mutaflow/devtools

Devtools package for inspecting Mutaflow mutation timelines.

## Current Components

- `MutationSummaryPanel`
- `MutationTimelinePanel`
- `MutationEventInspector`
- `MutationDevtoolsPanel`

## Current Direction

The package now helps answer the practical debugging questions behind a mutation flow:
- what happened
- which flow ran
- which `flowId` grouped the lifecycle
- where retries happened
- where rollback happened
- which invalidations were emitted
- which consistency strategy was applied
- what `meta` was attached to the run

## Highlights

- grouping by `flowId`
- filtering by `flowName`
- filtering by event type
- summary cards for success, errors, cancellations, and retries
- richer event inspection for `meta`, `consistency`, and merged invalidations

## Example

```tsx
import { MutationDevtoolsPanel } from "@mutaflow/devtools";

<MutationDevtoolsPanel
  store={events}
  initialFlowName="createTodo"
/>
```
