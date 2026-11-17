// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "no-shadow": ["error", { "builtinGlobals": true }] } }
}
// @filename: input.ts
let outer;
function shadowed(outer, Object) {}
function before() { let later; }
function later() {}
const named = function named() {};
const wrapped = wrap(function wrapped() {});
type TypeName = string;
function independent() { const TypeName = 1; }