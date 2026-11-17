//// [tests/cases/conformance/lint/rules/no-unsafe-call/lintTypescriptNoUnsafeCallRolloutUnsafeFlowFunctionTyped.ts] ////

//// [input.ts]
interface Value extends Function { (): string } declare const value: Value; new value();

//// [input.ts]
interface Value extends Function { (): string } declare const value: Value; new value();
