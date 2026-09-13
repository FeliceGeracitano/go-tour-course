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
```

## Layout

- `content/course.json` — course manifest (parts → chapters → lessons)
- `content/**/*.md` — lessons; interactive blocks are fenced `annotate`, `trace`, `quiz`, `diagram` blocks with a YAML body
- `client/` — Vite + React app

## Credits

Gopher by [Renee French](https://reneefrench.blogspot.com/) (CC BY 3.0), vector by
[Takuya Ueda](https://github.com/golang-samples/gopher-vector). Go Mono font by
Bigelow & Holmes (BSD, see `client/public/fonts/LICENSE`).
