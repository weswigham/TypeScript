//// [tests/cases/conformance/lint/rules/no-unnecessary-condition/lintTypescriptNoUnnecessaryConditionFinalBooleanConditionDeclareFunctionIsStringValueUnknownValueIsStringDeclar.ts] ////

//// [input.ts]
declare function isString(value: unknown): value is string; declare const value: string; isString(value);

//// [input.ts]
declare function isString(value: unknown): value is string; declare const value: string; isString(value);
