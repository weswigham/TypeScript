// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-lonely-if":"error"}},"files":["input.ts"]}
// @filename: input.ts
if (first) {} else { if (second) {} }
if (first) {} else { /* keep */ if (second) {} }
if (first) {} else { if (second) work() }
[1].forEach(work);
if (first) if (second) {} else { if (third) {} } else {}