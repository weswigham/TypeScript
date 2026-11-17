// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-inline-comments":["error",{"ignorePattern":"Note:"}]}},"files":["input.ts"]}
// @filename: input.ts
work(); // Note: ignored.
work(); // Reported.