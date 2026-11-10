# Fitness Tracker

Personal Android fitness tracker. Ionic + Angular + Capacitor. Local-first.

## Docs are the source of truth
- Product overview: docs/SPEC.md. Docs layout and conventions: docs/README.md. Read both before starting feature work.
- Build a subfeature only when its spec.md status is **Ready to build**, unless the owner says otherwise.
- The owner writes specs; ask before changing requirements. Don't silently resolve open questions. Raise them.
- Before writing code, do an overview of the target spec with the owner to ensure that all relevant information is included in the spec in a format that allows for the easiest implementation for the agent.

## Keep the docs in sync
When you change code or docs, update in the same change:
- The status line in the subfeature's spec.md, and the matching row in its feature README.md.
- The **Code** section of the spec, with the paths you created or changed.
- The feature README's subfeature table, if you add, rename, or remove a subfeature.
- docs/SPEC.md §11 Open questions, if one gets answered (move the answer into the right spec).
