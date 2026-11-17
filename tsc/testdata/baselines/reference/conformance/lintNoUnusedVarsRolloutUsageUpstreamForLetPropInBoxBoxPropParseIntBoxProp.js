//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamForLetPropInBoxBoxPropParseIntBoxProp.ts] ////

//// [globals.d.ts]

//// [input.ts]
for (let prop in box) {
        box[prop] = parseInt(box[prop]);
}

//// [input.ts]
for (let prop in box) {
        box[prop] = parseInt(box[prop]);
}
