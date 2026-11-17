// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-extra-boolean-cast":["error",{"enforceForInnerExpressions":true}]}},"files":["input.ts"]}
// @filename: input.ts
if (value && Boolean(other)) {}
if (value ?? Boolean(other)) {}
if ((value, Boolean(other))) {}
if (value ? Boolean(other) : !!third) {}
const keep = value || Boolean(other);