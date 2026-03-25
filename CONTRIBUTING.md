# Contributing

Thanks for your interest in contributing to Mutaflow.

## Local Setup

```powershell
npm install
npm run typecheck
npm run build
```

## Repository Structure

- `packages/mutaflow`: publishable package
- `mutaflow`: product notes and planning docs
- `examples/basic`: small usage example

## Guidelines

- Keep the API explicit and predictable.
- Prefer small, composable primitives over magic.
- Avoid expanding scope into validation, auth middleware, or a full client cache.
- Update docs when the public API changes.

## Pull Requests

Please include:
- a short description of the change
- the reasoning behind the API change, if any
- documentation updates for public behavior
- a note about follow-up work if the feature is partial

## Release Philosophy

Mutaflow is still early.
Favor clarity of direction over breadth of features.
