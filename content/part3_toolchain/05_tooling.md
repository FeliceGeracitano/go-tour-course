# doc, generate, pprof, trace, gopls

Use the toolchain to answer concrete questions: go doc explains APIs, go generate runs
explicit generation steps, pprof inspects sampled profiles, and execution traces show
scheduling and blocking over time. Gopls brings language-aware navigation and diagnostics
to editors.

Profile a representative workload before changing code for speed. A tiny benchmark may
not resemble an API endpoint waiting on storage or contending on locks.

## Read the example

```annotate
code: |
  go doc net/http.Client
  go doc -all ./internal/catalog
  go generate ./...
  go test -run '^$' -bench BenchmarkJoin -cpuprofile=cpu.out -memprofile=mem.out .
  go tool pprof -top cpu.out
  go tool pprof -alloc_space -top mem.out
  go test -run TestValidQuantity -trace=trace.out .
  go tool trace trace.out
hotspots: [{"line": 1, "match": "go doc net/http.Client", "title": "Inspect the installed API", "note": "Documentation follows the available package/toolchain version."}, {"line": 3, "match": "go generate ./...", "title": "Explicit generation", "note": "Generation directives run commands; builds do not invoke them automatically."}, {"line": 8, "match": "go tool trace", "title": "Inspect execution events", "note": "Useful for scheduling, blocking, and concurrency questions that CPU samples alone cannot answer."}]
lang: "bash"
```

## Match the tool to the symptom

Run the catalog documentation command in the module-layout example, and the test/profile
commands in a package containing the corresponding test and benchmark. CPU profiles show
where sampled CPU time was spent. Allocation-space profiles show allocated bytes, which
is different from retained heap size. A profile with little CPU work can be expected when
the request mostly waits on I/O.

A directive such as `//go:generate stringer -type=State` executes a tool available in the
generation environment. Review generation commands before running them on unfamiliar code,
pin generator versions, and decide whether generated output is committed. go generate is
neither a build dependency graph nor a sandbox.

Install gopls using its official installation guidance and configure the editor to use
it. It supplies completion, rename, references, and diagnostics based on module context.
Keep the editor environment consistent with command-line Go, especially GOWORK and build
flags.

Profiling HTTP endpoints can expose application details. Enable them deliberately on a
restricted diagnostics listener when needed, rather than attaching them casually to a
public mux. Use a repeatable before/after workload to validate any resulting optimization.

## Check your understanding

```quiz
type: "mcq"
question: "Does go build automatically run //go:generate directives?"
options: ["Yes", "No, generation is an explicit separate command", "Only for enums"]
answer: 1
explain: "Run go generate when regeneration is intended; ordinary builds do not invoke it."
```

```quiz
type: "mcq"
question: "Which evidence best reveals goroutine blocking and scheduling over time?"
options: ["An execution trace", "Only a formatting diff", "A dependency checksum"]
answer: 0
explain: "Execution traces capture scheduling and blocking events rather than only CPU samples."
```

## Further reading

[Go diagnostics overview](https://go.dev/doc/diagnostics)

[Gopls documentation](https://go.dev/gopls/)
