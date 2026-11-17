//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeFlowNestedDestructure.ts] ////

//// [input.ts]
declare const values: [{value: any}]; const [{value}] = values;

//// [input.ts]
declare const values: [{value: any}]; const [{value}] = values;
