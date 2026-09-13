# Go Tour Course

An interactive, static website for learning Go: read, click, and answer — no toolchain
needed. Structured after [A Tour of Go](https://go.dev/tour), with a patterns cheatsheet
in the spirit of [Go by Example](https://gobyexample.com) and a chapter on the `go` CLI.

## Run locally

```bash
cd client
npm install
npm run dev        # → http://localhost:5173
npm test           # unit tests + content validation
npm run check:go   # compile/run lesson examples; requires Go 1.25+
```

All 73 lessons are authored: 33 Tour lessons, 34 practical patterns, and six
toolchain lessons. Each includes interactive exercises. Start with Getting Started,
follow the Tour, then use the patterns index as a reference.
See [course status and verification](docs/course-status.md) for the completed scope.

The Go example check extracts programs and prediction questions from Markdown,
compiles them, checks declared output, and runs embedded test examples. Supporting
files for multi-file examples live in `content/example-fixtures.json`. Add `-- --race`
to run with Go's race detector. Shell recipes and deliberately invalid quiz snippets
are reviewed separately, not executed by this check.

## Layout

- `content/course.json` — course manifest (parts → chapters → lessons)
- `content/**/*.md` — lessons; interactive blocks are fenced `annotate`, `trace`, `quiz`, `diagram` blocks with a YAML body
- `client/` — Vite + React app

## Deploy

Amplify uses `amplify.yml` to install the client dependencies, build the site, and
publish `client/dist`. Configure the connected branch and SPA rewrite in Amplify.
Run `npm test`, `npm run typecheck`, and `npm run check:go -- --race` from `client/`
before publishing lesson changes. Progress is stored in the browser's
`localStorage`; nothing is sent anywhere.

## Credits

Gopher by [Renee French](https://reneefrench.blogspot.com/) (CC BY 3.0), vector by
[Takuya Ueda](https://github.com/golang-samples/gopher-vector). Go Mono font by
Bigelow & Holmes (BSD, see `client/public/fonts/LICENSE`).
