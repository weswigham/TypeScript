//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsFixtures.ts] ////

//// [input.ts]
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

//// [input.ts]
export {};
let moduleValue = 1;
function declarations(parameter: number) {
    let /* preserve */ value = 1;
    var parameter;
    consume(hoisted);
    var hoisted = 2;
    for (var item of values) callbacks.push(() => item);
    try {} catch (error) { var error = 1; }
    return value;
}
declare global { var permittedGlobal: number; }
