# Versioning Discipline

Mutaflow follows semantic versioning.

## Version Rules

- `0.1.x`: documentation, examples, fixes, and small additive API changes while the library is still stabilizing.
- `0.2.x`: additive runtime and ecosystem improvements that do not intentionally break the documented v0.1 surface.
- `0.x` minor bumps: may contain breaking changes while the API is still pre-1.0.
- `1.0.0`: the point where the core public API and package layout are considered stable.

## Release Expectations

- Every publish must update [CHANGELOG.md](CHANGELOG.md).
- Every publish must pass `npm run typecheck`, `npm run build`, and `npm run test`.
- New public exports should be reflected in both [README.md](README.md) and [packages/mutaflow/README.md](packages/mutaflow/README.md).
- Public API changes should update at least one example or smoke test.

## Recommended First Public Release

`v0.1.0` should represent:
- core runtime ready for early adopters
- `mutaflow/next`, `mutaflow/next/server`, and `mutaflow/next-safe-action` documented
- `@mutaflow/devtools` and `@mutaflow/testkit` available as ecosystem packages
- the Next example app build-verified
