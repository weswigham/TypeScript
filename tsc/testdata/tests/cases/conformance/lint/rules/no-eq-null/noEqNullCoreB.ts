// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-eq-null":"error"}},"files":["input.ts"]}
// @filename: input.ts
value == null;
null != value;
value === null;
value !== null;
value == undefined;