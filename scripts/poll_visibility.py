import json, os, sys, time, urllib.request

name = os.environ.get("ARTIFACT_NAME", "github-pages")
interval = int(os.environ.get("POLL_INTERVAL_MS", "200")) / 1000.0
budget_s = float(os.environ.get("BUDGET_S", "240"))

base = os.environ.get("ACTIONS_RESULTS_URL", "").rstrip("/")
token = os.environ.get("ACTIONS_RUNTIME_TOKEN", "")
if not base or not token:
    print("MISSING_ENV ACTIONS_RESULTS_URL=%r ACTIONS_RUNTIME_TOKEN_set=%s" % (base, bool(token)))
    print("RESULT lag_ms=na reason=missing_env")
    sys.exit(2)

url = base + "/twirp/github.actions.results.api.v1.ArtifactService/ListArtifacts"

def list_artifacts():
    req = urllib.request.Request(
        url, data=b"{}", method="POST",
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())

start = time.monotonic()
deadline = start + budget_s
attempt = 0
while True:
    attempt += 1
    t_ms = (time.monotonic() - start) * 1000.0
    try:
        data = list_artifacts()
        arts = data.get("artifacts") or []
        names = [a.get("name") for a in arts]
        print("[probe] attempt=%d t=%.0fms count=%d names=%s" % (attempt, t_ms, len(arts), names), flush=True)
        if name in names:
            print("RESULT lag_ms=%.0f attempts=%d total=%d" % (t_ms, attempt, len(arts)), flush=True)
            break
    except Exception as e:
        print("[probe] attempt=%d t=%.0fms error=%s" % (attempt, t_ms, e), flush=True)
    if time.monotonic() > deadline:
        print("RESULT lag_ms=timeout attempts=%d" % attempt, flush=True)
        sys.exit(1)
    time.sleep(interval)
