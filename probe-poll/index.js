// Polls the same artifact-service endpoint actions/deploy-pages uses (twirp ListArtifacts).
// The runtime env vars and the run/job backend IDs come from the JWT in ACTIONS_RUNTIME_TOKEN.
const name = process.env.ARTIFACT_NAME || 'github-pages'
const interval = Number(process.env.POLL_INTERVAL_MS || 200)
const budget = Number(process.env.BUDGET_MS || 240000)
const base = (process.env.ACTIONS_RESULTS_URL || '').replace(/\/$/, '')
const token = process.env.ACTIONS_RUNTIME_TOKEN || ''
const url = `${base}/twirp/github.actions.results.api.v1.ArtifactService/ListArtifacts`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function backendIds(jwt) {
  try {
    const claims = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString())
    const run = claims.WorkflowRunBackendId || claims.workflow_run_backend_id || ''
    const job = claims.WorkflowJobRunBackendId || claims.workflow_job_run_backend_id || ''
    if (!run) console.log(`claims_keys=${Object.keys(claims).join(',')}`)
    return { run, job }
  } catch (e) {
    console.log(`jwt_decode_failed=${e.message}`)
    return { run: '', job: '' }
  }
}

;(async () => {
  const ids = backendIds(token)
  console.log(`poll_start=${new Date().toISOString()} interval_ms=${interval} run_backend_id_set=${Boolean(ids.run)} job_backend_id_set=${Boolean(ids.job)}`)
  const body = JSON.stringify({
    workflow_run_backend_id: ids.run,
    workflow_job_run_backend_id: ids.job,
    name_filter: name
  })
  const start = Date.now()
  for (let attempt = 1; ; attempt++) {
    const t = Date.now() - start
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body
      })
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`)
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`non-json ${text.slice(0, 200)}`)
      }
      if (attempt === 1) console.log(`first_response=${text.slice(0, 400)}`)
      const arts = data.artifacts || []
      const names = arts.map((a) => a.name)
      console.log(`[probe] attempt=${attempt} t=${t}ms count=${arts.length} names=${JSON.stringify(names)}`)
      if (names.includes(name)) {
        if (attempt === 1) console.log('found_on_first_lookup=true')
        console.log(`found_at=${new Date().toISOString()}`)
        console.log(`RESULT lag_ms=${t} attempts=${attempt} total=${arts.length}`)
        return
      }
    } catch (e) {
      console.log(`[probe] attempt=${attempt} t=${t}ms error=${e.message}`)
    }
    if (Date.now() - start > budget) {
      console.log(`RESULT lag_ms=timeout attempts=${attempt}`)
      process.exitCode = 1
      return
    }
    await sleep(interval)
  }
})()
