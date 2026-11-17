// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-var": "error" } }
}
// @filename: input.ts
export {};
var moduleValue = 1;
function declarations(parameter: number) {
    var /* preserve */ value = 1;
    var parameter;
    consume(hoisted);
    var hoisted = 2;
    for (var item of values) callbacks.push(() => item);
    try {} catch (error) { var error = 1; }
    return value;
}
declare global { var permittedGlobal: number; }