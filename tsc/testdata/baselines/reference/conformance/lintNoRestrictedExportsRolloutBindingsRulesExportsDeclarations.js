//// [tests/cases/conformance/lint/rules/no-restricted-exports/lintNoRestrictedExportsRolloutBindingsRulesExportsDeclarations.ts] ////

//// [input.ts]
export const {key: denied, ...rest} = source; export function denied() {} export class denied {}

//// [input.ts]
export const {key: denied, ...rest} = source; export function denied() {} export class denied {}
