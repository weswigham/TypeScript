//// [tests/cases/conformance/lint/rules/no-unsafe-member-access/lintTypescriptNoUnsafeMemberAccessRolloutUnsafeFlowComputedMember.ts] ////

//// [input.ts]
declare const value: {key: string}; declare const key: any; value[key];

//// [input.ts]
declare const value: {key: string}; declare const key: any; value[key];
