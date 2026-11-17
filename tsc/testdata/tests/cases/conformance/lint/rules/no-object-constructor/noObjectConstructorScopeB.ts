// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-object-constructor":"error"}},"files":["input.ts"]}
// @filename: input.ts
Object();
const object = new Object;
const callback = () => Object?.();
Object(value);
new globalThis.Object();
function shadow(Object) { Object(); }