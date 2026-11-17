// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-global-assign":["error",{"exceptions":["Object"]}]}},"files":["input.ts"]}
// @filename: input.ts
/* global custom:readonly, writable:true */
Array = 1;
String++;
({ Math = 0 } = source);
for (JSON of values) {}
custom = 1;
writable = 1;
Object = 1;
function shadow(Array) { Array = 1; }