// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "no-redeclare": "error" } }
}
// @filename: input.ts
var repeated;
var repeated;
var Object;
function parameters(parameter) { var parameter; }
function defaultParameter(parameter = 1) { var parameter; }
const named = function expression(expression) { var expression; };
{ let repeated; }