//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipOptionsAndEdgesAmbientAllow.ts] ////

//// [input.ts]
declare module 'owned-lib' { export type R = RegExp | string[]; } function f(value: import('owned-lib').R) {}

//// [input.ts]
declare module 'owned-lib' { export type R = RegExp | string[]; } function f(value: import('owned-lib').R) {}
