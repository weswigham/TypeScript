//// [tests/cases/conformance/lint/rules/no-unnecessary-type-conversion/lintTypescriptNoUnnecessaryTypeConversionTypedBConversionAndEnumFunctionLocalStringValueStringStringStringValue.ts] ////

//// [input.ts]
function local(String: (value: string) => string) { String('value'); }

//// [input.ts]
function local(String: (value: string) => string) { String('value'); }
