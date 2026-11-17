//// [tests/cases/conformance/lint/rules/no-useless-default-assignment/lintTypescriptNoUselessDefaultAssignmentFinalSimplifyDefaultDeclareConstFlagBooleanConstValue1FlagValue2.ts] ////

//// [input.ts]
declare const flag: boolean; const { value = 1 } = flag ? { value: 2 } : {};

//// [input.ts]
declare const flag: boolean; const { value = 1 } = flag ? { value: 2 } : {};
