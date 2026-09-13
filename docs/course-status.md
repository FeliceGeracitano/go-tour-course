# Complete lesson content

Updated 2026-09-13. All 73 manifest lessons are authored; no lesson placeholders
remain. This supersedes the content roadmap in the earlier Plan 1 handoff.

| Part | Lessons | Status |
| --- | ---: | --- |
| Tour | 33 | Authored |
| Patterns & use cases | 34 | Authored |
| Toolchain | 6 | Authored |

The final content pass added 65 lessons and 130 questions. The course now contains
148 quiz blocks, annotated examples throughout, loop and channel traces, and the
slice backing-array diagram. The diagram labels its capacity growth as illustrative
rather than a language guarantee.

## Verification

- 79 frontend/content tests pass, including a check against unfinished placeholders
  and lessons without a quiz.
- TypeScript checking and the production build pass.
- Command-line smoke checks pass for module inspection/vendor workflows, formatting,
  vet, coverage, benchmarks, CPU/allocation profiles, trace parsing, a two-second
  active fuzz run, workspace init/sync, build/run/install, and Linux amd64/arm64
  cross-compilation. Cross-built binaries were inspected, not executed on Linux.
- `npm run check:go -- --race` verifies 82 Go examples: it compiles programs,
  executes examples with declared output, checks prediction answers, and runs test
  examples (including fuzz seeds) with race instrumentation.
- The checker supplies documented support files for embed, golden-file, and module
  layout examples from `content/example-fixtures.json`. One pre-existing introductory
  project excerpt is reported separately because it requires its own module setup.
- Deliberately invalid line-selection questions and general code fragments are
  excluded from executable-example checks. Multiple-choice explanations are reviewed
  as prose, not treated as executable assertions.
- Browser QA covers slices and the diagram, channel buffer stepping and output,
  the JSON handler, shell-command annotations, and benchmarks/fuzzing. Representative
  pages remain within a 400-pixel mobile viewport while wide code scrolls internally.
  No browser console warnings or errors were observed during these checks.

The Go examples were verified with Go 1.27.1. The lessons use Go 1.25+ as a common
baseline and call out relevant earlier feature introductions. The site itself remains
static: visitors do not need Go installed to read or interact with the course.

## Hosting and future scope

Hosting now uses the repository's Amplify configuration. The lesson changes preserve
that configuration and do not restore the removed GitHub Pages deployment workflow.

There are no remaining lesson-authoring phases. Additional diagrams, editorial
refinement, and an optional code runner can be separate future work.
