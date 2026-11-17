//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesConstObjectSetValueParameterConsumeObject.ts] ////

//// [globals.d.ts]

//// [input.ts]
const object = { set value(parameter) {} }; consume(object);

//// [input.ts]
const object = { set value(parameter) {} }; consume(object);
