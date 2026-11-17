// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-implicit-coercion":["error",{"boolean":false,"number":false,"allow":["+"],"disallowTemplateShorthand":true}]}},"files":["input.ts"]}
// @filename: input.ts
!!value;
+value;
"" + value;
`${value}`;
tag`${value}`;
`${String(value)}`;
`${value}suffix`;