//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesBaseToStringFunctionStringifyTExtendsValueTReturnStringValue.ts] ////

//// [input.ts]
function stringify<T extends {}>(value: T) { return String(value); }

//// [input.ts]
function stringify<T extends {}>(value: T) { return String(value); }
