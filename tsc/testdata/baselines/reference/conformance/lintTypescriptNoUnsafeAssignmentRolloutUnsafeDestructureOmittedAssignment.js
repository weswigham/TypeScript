//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeDestructureOmittedAssignment.ts] ////

//// [input.ts]
declare const values: [string, any]; let value: unknown; ([, value] = values);

//// [input.ts]
declare const values: [string, any]; let value: unknown; ([, value] = values);
