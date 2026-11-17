//// [tests/cases/conformance/lint/rules/no-restricted-exports/lintNoRestrictedExportsRolloutBindingsRulesExportsPattern.ts] ////

//// [input.ts]
export const allowed = 1, denied = 2; export {value as default}; export default 1;

//// [input.ts]
export const allowed = 1, denied = 2; export {value as default}; export default 1;
