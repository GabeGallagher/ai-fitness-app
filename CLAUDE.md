# Fitness Tracker

Personal Android fitness tracker. Ionic + Angular + Capacitor. Local-first.

## Docs are the source of truth
- Product overview: docs/SPEC.md. Docs layout and conventions: docs/README.md. Read both before starting feature work.
- Build a subfeature only when its spec.md status is **Ready to build**, unless the owner says otherwise.
- The owner writes specs; ask before changing requirements. Don't silently resolve open questions. Raise them.
- Before writing code, do an overview of the target spec with the owner to ensure that all relevant information is included in the spec in a format that allows for the easiest implementation for the agent.

## Verification
- `npm run verify` runs lint, typecheck, and every automated test. A Stop hook (.claude/settings.json) runs it before you finish a task and blocks you if it fails. Fix the failures; don't work around the hook.
- Add every new automated test layer to `npm run verify` (docs/decisions/005-testing.md).

## Setup and the phone
- The owner works on this app from more than one computer. On a new one, follow docs/development.md (tools, `npm install`, `npx playwright install chromium`).
- Before the owner tests anything on the phone, confirm the phone has the current build: `adb devices`, then compare the installed app's `lastUpdateTime` with the latest change (docs/development.md, Checking what's on the phone). `npx cap sync android` doesn't install; `npx cap run android` does.
- If installing fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the phone's copy was signed by another computer. Uninstalling fixes it but deletes the app's on-device data, so ask the owner first.

## Keep the docs in sync
When you change code or docs, update in the same change:
- The status line in the subfeature's spec.md, and the matching row in its feature README.md.
- The **Code** section of the spec, with the paths you created or changed.
- The **Verification** section of the spec, with the tests you added, changed, or removed (layers and conventions: docs/decisions/005-testing.md).
- The feature README's subfeature table, if you add, rename, or remove a subfeature.
- docs/SPEC.md §11 Open questions, if one gets answered (move the answer into the right spec).
