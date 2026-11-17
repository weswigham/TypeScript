//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeDestructureOmittedUnsafeBinding.ts] ////

//// [input.ts]
declare const values: [any, string]; const [, value] = values;

//// [input.ts]
declare const values: [any, string]; const [, value] = values;
