//// [tests/cases/conformance/lint/rules/restrict-template-expressions/lintTypescriptRestrictTemplateExpressionsFinalValuesOptionsAndRangesTemplateGeneric.ts] ////

//// [input.ts]
function fn<T extends string | {}>(value: T) { return `${value}`; }

//// [input.ts]
function fn<T extends string | {}>(value: T) { return `${value}`; }
