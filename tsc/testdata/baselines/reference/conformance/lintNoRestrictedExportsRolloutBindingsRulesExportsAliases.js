//// [tests/cases/conformance/lint/rules/no-restricted-exports/lintNoRestrictedExportsRolloutBindingsRulesExportsAliases.ts] ////

//// [input.ts]
export {denied as allowed, allowed as denied, value as 'denied'} from 'mod'; export * as denied from 'mod';

//// [input.ts]
export {denied as allowed, allowed as denied, value as 'denied'} from 'mod'; export * as denied from 'mod';
