//// [tests/cases/conformance/lint/rules/naming-convention/namingConventionSelectorPriority.ts] ////

//// [input.ts]
const allowed_name = 1;
let rejected_name = allowed_name;
function acceptParameter(rejected_parameter: number) {
    return rejected_parameter;
}


//// [input.ts]
const allowed_name = 1;
let rejected_name = allowed_name;
function acceptParameter(rejected_parameter: number) {
    return rejected_parameter;
}
