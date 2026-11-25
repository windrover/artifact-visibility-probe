# artifact-visibility-probe

Measures how long a freshly finalized GitHub Actions artifact stays invisible to
`actions/deploy-pages` (which lists the run's artifacts through the Actions artifact service).

Each manual run:

1. uploads a ~1.9 MB `github-pages` artifact via `actions/upload-pages-artifact@v5`,
2. runs `actions/deploy-pages@v5` immediately, then again at cumulative offsets
   **+2s, +5s, +10s, +20s, +40s, +70s** after the first attempt,
3. prints the outcome of every attempt.

The first offset whose deploy succeeds brackets the artifact visibility time for that run.
A failure at an offset means the lookup still returned `Found 0 artifact(s)`.

Context and reported cases:
- https://github.com/actions/deploy-pages/issues/451
- https://github.com/actions/download-artifact/issues/505
