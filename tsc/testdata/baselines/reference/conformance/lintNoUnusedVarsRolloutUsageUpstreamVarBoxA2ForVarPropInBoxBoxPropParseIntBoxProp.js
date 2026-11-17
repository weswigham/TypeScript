//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarBoxA2ForVarPropInBoxBoxPropParseIntBoxProp.ts] ////

//// [globals.d.ts]

//// [input.ts]
var box = {a: 2};
    for (var prop in box) {
        box[prop] = parseInt(box[prop]);
}

//// [input.ts]
var box = {a: 2};
    for (var prop in box) {
        box[prop] = parseInt(box[prop]);
}
