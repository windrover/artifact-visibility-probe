const keys = Object.keys(process.env).filter(k => /^ACTIONS_/.test(k)).sort()
console.log('ACTIONS_ENV_KEYS ' + keys.join(','))
console.log('RESULTS_URL_SET ' + Boolean(process.env.ACTIONS_RESULTS_URL))
console.log('RUNTIME_TOKEN_SET ' + Boolean(process.env.ACTIONS_RUNTIME_TOKEN))
