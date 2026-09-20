# Go Tour Course

An interactive, static website for learning Go: read, click, and answer.
Structured after [A Tour of Go](https://go.dev/tour), with a patterns cheatsheet in the
spirit of [Go by Example](https://gobyexample.com) and a chapter on the `go` CLI.
No toolchain needed.

## Run locally

```bash
cd client
npm install
npm run dev        # → http://localhost:5173
npm test           # unit tests + content validation
npm run build      # type-check + production build in client/dist
npm run check:go   # compile/run lesson examples; requires Go 1.25+
```

## What's inside

- 79 lessons: 33 Tour lessons, 40 practical patterns, and six toolchain lessons, each
  with interactive exercises.
- Annotated code, step-through traces, quizzes, and diagrams, including a chapter on
  structuring a large Go service backed by the runnable `examples/large-service/`.
- Landing page, collapsible chapter sidebar with progress rings, previous/next
  navigation, and shareable lesson links.
- Progress lives in the browser's `localStorage`; nothing is sent anywhere.

`npm run check:go` compiles every lesson example, checks declared output, and tests the
large-service example (add `-- --race` for the race detector). See
[course status](docs/course-status.md) for the verified scope.

## Layout

- `content/course.json` — course manifest (parts → chapters → lessons)
- `content/**/*.md` — lessons; interactive blocks are fenced `annotate`, `trace`, `quiz`,
  `diagram` blocks with a YAML body
- `client/` — Vite + React app
- `examples/large-service/` — runnable Go service, tests, and optional chi/Fx adapters

## Deploy

Amplify uses `amplify.yml` to install the client dependencies, build the site, and
publish `client/dist`. Configure the connected branch and an SPA rewrite in Amplify,
since lesson URLs are real paths.

## Credits

Gopher by [Renee French](https://reneefrench.blogspot.com/) (CC BY 3.0), vector by
[Takuya Ueda](https://github.com/golang-samples/gopher-vector). Go Mono font by
Bigelow & Holmes (BSD, see `client/public/fonts/LICENSE`).
