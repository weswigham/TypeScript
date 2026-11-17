//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/lintTypescriptNoUnsafeAssignmentRolloutUnsafeDestructureOmittedAssignmentBeforeRest.ts] ////

//// [input.ts]
declare const values: [any, any]; let rest: any[]; ([, ...rest] = values);

//// [input.ts]
declare const values: [any, any]; let rest: any[]; ([, ...rest] = values);
