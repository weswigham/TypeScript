//// [tests/cases/conformance/lint/rules/no-unsafe-member-access/lintTypescriptNoUnsafeMemberAccessRolloutUnsafeFlowMemberParenthesized.ts] ////

//// [input.ts]
declare const value: any; (value.key).other;

//// [input.ts]
declare const value: any; (value.key).other;
