// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-lone-blocks":"error"}},"files":["input.ts"]}
// @filename: input.ts
{}
{ var hoisted; }
{ let scoped; }
{ using resource = acquire(); }
function run() { { const only = 1; } }
switch (value) {
    case 1: { work(); }
    case 2: {} work();
}
class Item {
    static { { let only; } }
    method() { work(); { class Local {} } }
}