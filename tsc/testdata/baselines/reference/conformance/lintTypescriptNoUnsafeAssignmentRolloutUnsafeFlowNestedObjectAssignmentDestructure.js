//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeFlowNestedObjectAssignmentDestructure.ts] ////

//// [input.ts]
declare const values: [{value: any}]; let value: string; ([{value}] = values);

//// [input.ts]
declare const values: [{value: any}]; let value: string; ([{value}] = values);
