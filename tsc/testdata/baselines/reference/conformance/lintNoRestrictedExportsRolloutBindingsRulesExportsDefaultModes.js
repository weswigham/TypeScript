//// [tests/cases/conformance/lint/rules/no-restricted-exports/lintNoRestrictedExportsRolloutBindingsRulesExportsDefaultModes.ts] ////

//// [input.ts]
export {value as default}; export {default} from 'mod'; export {value as default} from 'mod'; export * as default from 'mod';

//// [input.ts]
export {value as default}; export {default} from 'mod'; export {value as default} from 'mod'; export * as default from 'mod';
