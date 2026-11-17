// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-continue":"error"}},"files":["input.ts"]}
// @filename: input.ts
outer: while (ready) {
    if (skip) continue;
    continue outer;
}
while (ready) { break; }