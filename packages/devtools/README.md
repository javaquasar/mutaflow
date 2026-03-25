# @mutaflow/devtools

Prototype devtools package for inspecting Mutaflow mutation timelines.

## Current Components

- `MutationTimelinePanel`
- `MutationEventInspector`

## Prototype Direction

The current package renders directly from a `MutationEventStore` and is meant to be the first visible layer on top of Mutaflow's event stream.

It is currently useful for:
- browsing mutation timelines
- checking retries and cancellations
- inspecting flow ids and attempts
- validating optimistic and reconcile behavior while developing
