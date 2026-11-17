//// [tests/cases/conformance/lint/rules/no-restricted-properties/lintNoRestrictedPropertiesCoreCConstBarBadFooBad.ts] ////

//// [input.ts]
const {bar: {bad} = {}} = foo; ({bad}) => {};

//// [input.ts]
const {bar: {bad} = {}} = foo; ({bad}) => {};
