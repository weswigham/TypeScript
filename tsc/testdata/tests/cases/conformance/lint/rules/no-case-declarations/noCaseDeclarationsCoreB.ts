// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-case-declarations":"error"}},"files":["input.ts"]}
// @filename: input.ts
switch (value) {
    case 0: let local; const fixed = 1; function nested() {} class Item {} break;
    case 1: var hoisted; break;
    default: { let valid; }
}