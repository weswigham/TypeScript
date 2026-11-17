// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-labels":"error"}},"files":["input.ts"]}
// @filename: input.ts
outer: while (ready) { continue outer; break outer; }
block: { break block; }
selection: switch (value) { default: break selection; }
while (ready) { continue; break; }