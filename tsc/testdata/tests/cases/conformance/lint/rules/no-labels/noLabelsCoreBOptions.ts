// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-labels":["error",{"allowLoop":true,"allowSwitch":true}]}},"files":["input.ts"]}
// @filename: input.ts
outer: while (ready) { continue outer; break outer; }
selection: switch (value) { default: break selection; }
block: { break block; }