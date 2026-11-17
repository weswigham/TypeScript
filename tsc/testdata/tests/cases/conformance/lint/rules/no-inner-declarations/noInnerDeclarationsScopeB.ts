// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext","moduleDetection":"legacy"},"lint":{"rules":{"no-inner-declarations":"error"}},"files":["input.ts"]}
// @filename: input.ts
if (ready) { function nested() {} var allowed; }
function root() {
    function nestedRoot() {}
    if (ready) { function inner() {} }
}
function strict() {
    "use strict";
    if (ready) { function allowed() {} }
}