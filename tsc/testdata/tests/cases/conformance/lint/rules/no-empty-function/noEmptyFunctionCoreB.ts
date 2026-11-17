// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-empty-function":"error"}},"files":["input.ts"]}
// @filename: input.ts
function empty() {}
const arrow = () => {};
class Item {
    constructor(public value: number) {}
    method() {}
    async asyncMethod() {}
    *generator() {}
}
function documented() { /* intentional */ }