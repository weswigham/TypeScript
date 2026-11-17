//// [tests/cases/conformance/lint/rules/no-unsafe-member-access/lintTypescriptNoUnsafeMemberAccessRolloutUnsafeSpansKey1.ts] ////

//// [input.ts]
function get(value: {key: number}, key: any) { value[(key += 1)]; }

//// [input.ts]
function get(value: {key: number}, key: any) { value[(key += 1)]; }
