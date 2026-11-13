# Docs

How the project docs are organized. The product overview is [SPEC.md](SPEC.md).

## Layout

```
docs/
  SPEC.md            # what and why: purpose, principles, phases, open questions
  development.md     # setting up a computer, running the app, installing it on the phone
  decisions/         # technical decisions (ADRs), one file each: 001-mobile-stack.md, ...
  images/            # images that span features (navigation, theme, overall look)
  features/
    _template.md     # copy this to start a new subfeature spec
    <feature>/
      README.md      # feature overview and links to its subfeatures
      images/
      <subfeature>/
        spec.md      # definition of done for this subfeature
        images/
```

- **At most two levels:** feature, then subfeature. If a subfeature needs its own subfeatures, split it into two subfeatures.
- **Names** are lowercase-with-hyphens, and the code uses the same names: `docs/features/nutrition/daily-log/` maps to `src/app/features/nutrition/daily-log/`. Code shared across features lives in `src/app/core/`, not inside a feature. (This code layout is expected; confirm it when the stack ADR is written.)
- **Shared rules are written once.** If a rule applies to several features, specify it in one place and link to it from the others.

## Images

- Put each image in the `images/` folder **next to the spec it illustrates**. Use `docs/images/` only for images that span features.
- Name files after what they show: `today-screen.png` or `food-search-results.jpg`, not `IMG_4031.jpg`.
- Embed with a relative path, real alt text, and a caption that says how literally to take the image:

  ```markdown
  ![Today screen: consumed vs target and remaining, per macro](images/today-screen.png)

  *Mockup. Layout and the information shown are binding; colors and fonts are placeholders.*
  ```

- **Text wins.** If an image and the spec text disagree, the text is correct; update the image or add a note.
- Shrink large screenshots before committing them.

## Status values

Each spec starts with a status line: **Not started**, **Drafting**, **Ready to build**, **Building**, or **Done**. Claude builds a subfeature only when its spec says **Ready to build**, unless asked otherwise.

A subfeature is **Done** only when every Definition of done item is covered in the spec's **Verification** section, every test listed there passes, and the manual phone checks are ticked ([ADR-005](decisions/005-testing.md)).
