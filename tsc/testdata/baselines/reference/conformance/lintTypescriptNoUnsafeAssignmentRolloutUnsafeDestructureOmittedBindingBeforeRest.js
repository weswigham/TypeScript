//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeDestructureOmittedBindingBeforeRest.ts] ////

//// [input.ts]
declare const values: [any, any]; const [, ...rest] = values;

//// [input.ts]
declare const values: [any, any]; const [, ...rest] = values;
