// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-empty":["error",{"allowEmptyCatch":true}]}},"files":["input.ts"]}
// @filename: input.ts
try { work(); } catch {}
try {} catch {} finally {}