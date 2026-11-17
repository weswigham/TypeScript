// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-empty":"error"}},"files":["input.ts"]}
// @filename: input.ts
if (value) {}
switch (value) {}
try {} catch {}
while (ready) { /* intentional */ }
function allowed() {}
class Item { static {} }