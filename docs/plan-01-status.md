# Plan 1 — Scaffold and introductory lessons

Historical phase report. See [current course status](course-status.md) for the
completed lesson content and current hosting setup.

Completed on 2026-09-13. This repository note supersedes the older planning
memory that still says execution is pending.

The app includes course navigation, Markdown lessons, annotated code, execution
traces, three quiz modes, a slice diagram, local progress, pattern search and tag
filters, content validation, and GitHub Actions deployment to Pages.

Eight lessons are authored: three in Getting Started and five in Basics. The
remaining 65 lessons are intentional placeholders for later phases.

## Final QA

Verified in Chrome on desktop and at a 400 × 850 viewport:

- Home page, gopher, three part cards, and course links render correctly.
- The introductory widget lesson supports annotation selection, trace stepping,
  wrong/correct quiz answers, retry, and diagram play/reset/step.
- Quiz answers and lesson completion preserve other widgets' current state.
  Lesson completion remains visible after a reload.
- The functions trace reaches step 6/6 with output `7 10`; arrow keys work and
  the current line is highlighted.
- The packages lesson's line-selection quiz marks the wrong selection and
  correct line, supports retry, and accepts the correct selection. Its multiple
  choice quiz also accepts the correct answer.
- Pattern tags and search combine correctly; unmatched queries show an empty state.
- On mobile, the sidebar is hidden and wide code/diagram content scrolls inside
  its container. The page remains 400 pixels wide.
- No browser console warnings or errors were observed during these checks.

Final fixes preserve Markdown component identity across parent renders, allow
widget utilities to override prose styles, remove quiz list bullets/indentation,
and contain the slice diagram's horizontal overflow.

Validation: 78 tests across 18 files pass, TypeScript passes, and the production
build succeeds with `VITE_BASE=/go-tour-course/`. The test environment prints its
existing `window.scrollTo` not-implemented notice; tests pass.

## Handoff

Next phase: author Tour chapters ch02–ch06, followed by Patterns, Toolchain, and
additional diagrams. Code execution remains outside the current scope.

- Repository: https://github.com/FeliceGeracitano/go-tour-course
- Site: https://felicegeracitano.github.io/go-tour-course/
