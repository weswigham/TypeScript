// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-extra-label":"error"}},"files":["input.ts"]}
// @filename: input.ts
outer: while (ready) {
    if (skip) continue outer;
    switch (value) { default: continue outer; }
    break outer;
}
commented: while (ready) { break /* keep */ commented; }
required: { break required; }