// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-implicit-globals": ["error", { "lexicalBindings": true }] } }
}
// @filename: input.ts
var globalVariable;
let lexical;
class GlobalClass {}
function globalFunction() {
    var local;
    leaked = 1;
}
{ var hoisted; let blockLocal; }
for (otherLeak of values) {}