//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeDestructureNestedOmittedBinding.ts] ////

//// [input.ts]
declare const values: [[string, any]]; const [[, value]] = values;

//// [input.ts]
declare const values: [[string, any]]; const [[, value]] = values;
