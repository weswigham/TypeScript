// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-inline-comments":"error"}},"files":["input.ts"]}
// @filename: input.ts
// Standalone comment.
const value = '/* not a comment */'; // Inline comment.
/* Before code. */ work();
work(); /* global work */
work(); // eslint-disable-line no-alert
const pattern = /[/*]/;