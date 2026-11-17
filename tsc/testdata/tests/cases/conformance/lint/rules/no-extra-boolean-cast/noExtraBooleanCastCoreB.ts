// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-extra-boolean-cast":"error"}},"files":["input.ts"]}
// @filename: input.ts
if (!!value) {}
while (Boolean(value)) {}
Boolean(!!value);
if (!Boolean()) {}
if (Boolean(/* keep */ value)) {}
if (Boolean(value, sideEffect())) {}
const keep = !!value;
function shadow(Boolean) { if (Boolean(value)) {} }