//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeFlowNestedArrayAssignmentDestructure.ts] ////

//// [input.ts]
declare const values: {value: [any]}; let value: string; ({value: [value]} = values);

//// [input.ts]
declare const values: {value: [any]}; let value: string; ({value: [value]} = values);
