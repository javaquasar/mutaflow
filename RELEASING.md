# Release Checklist

## Release Standard

A Mutaflow release is considered ready only when:
- the public README reads like a landing page, not internal notes
- the main package README is npm-friendly and up to date
- examples reflect the documented API
- `CHANGELOG.md` clearly explains what shipped
- the CI workflow is green

## v0.1.0 Scope

`v0.1.0` is the first serious public release for early adopters.

It should represent:
- a usable core runtime
- documented Next integrations
- a working `next-safe-action` helper API
- an inspectable devtools package
- a useful testkit package

## Before Publish

1. Run `npm install`
2. Run `npm run typecheck`
3. Run `npm run build`
4. Run `npm run test`
5. Review [README.md](README.md) and [packages/mutaflow/README.md](packages/mutaflow/README.md)
6. Review [CHANGELOG.md](CHANGELOG.md)
7. Confirm versions in:
   - [package.json](package.json)
   - [packages/mutaflow/package.json](packages/mutaflow/package.json)
   - [packages/devtools/package.json](packages/devtools/package.json)
   - [packages/testkit/package.json](packages/testkit/package.json)
8. Confirm `dist` output exists after build
9. Confirm GitHub URLs and npm metadata are correct

## Publish Order

1. Publish `mutaflow`
2. Publish `@mutaflow/devtools`
3. Publish `@mutaflow/testkit`

Commands:

```powershell
npm publish --workspace mutaflow --access public
npm publish --workspace @mutaflow/devtools --access public
npm publish --workspace @mutaflow/testkit --access public
```

## After Publish

1. Create Git tag `v0.1.0`
2. Create GitHub release notes
3. Verify npm package pages
4. Verify install from a clean sample app
5. Verify README images render correctly on GitHub and npm

## Discipline

- Use [VERSIONING.md](VERSIONING.md) for release version decisions.
- Do not publish undocumented exports.
- Do not publish untested package changes.
- Prefer small, explicit releases over large bundled drops.
