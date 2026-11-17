// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-empty-static-block":"error"}},"files":["input.ts"]}
// @filename: input.ts
class Item {
    static {}
    static { /* intentional */ }
    static { work(); }
}