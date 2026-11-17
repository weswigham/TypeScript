// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-promise-executor-return":["error",{"allowVoid":true}]}},"files":["input.ts"]}
// @filename: input.ts
new Promise(resolve => void resolve(1));
new Promise(resolve => { return void resolve(1); });
new Promise(resolve => resolve(1));
new Promise(resolve => { return resolve(1); });