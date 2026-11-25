# artifact-visibility-probe

Measures how long a freshly finalized GitHub Actions artifact stays invisible to the artifact service
listing (`twirp ...ArtifactService/ListArtifacts`, the lookup `actions/deploy-pages` performs).

Context: https://github.com/actions/deploy-pages/issues/451 and https://github.com/actions/download-artifact/issues/505

Each manual run uploads a ~1.9 MB `github-pages` artifact via `actions/upload-pages-artifact@v5`, then
polls the same listing endpoint the deploy action uses (200 ms interval) and prints

    RESULT lag_ms=<time from first lookup to first successful listing> attempts=<n>

`lag_ms` is exactly the retry budget a deploy step would need.
