//// [tests/cases/conformance/lint/rules/camelcase/lintCamelcaseRolloutBindingsRulesCamelExportLabels.ts] ////

//// [input.ts]
export {value as snake_case}; export * as other_name from 'mod'; snake_label: while (true) { break snake_label; }

//// [input.ts]
export {value as snake_case}; export * as other_name from 'mod'; snake_label: while (true) { break snake_label; }
