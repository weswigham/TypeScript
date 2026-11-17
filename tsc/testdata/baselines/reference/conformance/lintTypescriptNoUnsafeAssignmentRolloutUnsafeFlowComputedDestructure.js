//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeFlowComputedDestructure.ts] ////

//// [input.ts]
declare const values: {value: any}; const {['value']: result} = values;

//// [input.ts]
declare const values: {value: any}; const {['value']: result} = values;
