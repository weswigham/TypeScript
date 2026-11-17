//// [tests/cases/conformance/lint/rules/no-unsafe-call/lintTypescriptNoUnsafeCallRolloutUnsafeFlowFunctionConstruct.ts] ////

//// [input.ts]
interface Value extends Function { (): void } declare const value: Value; new value();

//// [input.ts]
interface Value extends Function { (): void } declare const value: Value; new value();
