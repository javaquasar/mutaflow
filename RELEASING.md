# Release Checklist

## Before First Public Push

- Review package naming and npm availability.
- Add repository URL to `packages/mutaflow/package.json`.
- Add author and funding fields if desired.
- Confirm the chosen open-source license.
- Make sure README examples match the current API.

## Before First npm Publish

- Run `npm install`
- Run `npm run typecheck`
- Run `npm run build`
- Inspect `packages/mutaflow/dist`
- Review `packages/mutaflow/package.json` exports and files
- Confirm version number in `packages/mutaflow/package.json`
- Confirm `README.md`, `LICENSE`, and changelog are up to date
- Run `npm publish --workspace mutaflow --access public`

## After Publish

- Create a Git tag matching the published version
- Create a GitHub release note
- Verify the package page on npm
- Verify install instructions from a clean sample app
