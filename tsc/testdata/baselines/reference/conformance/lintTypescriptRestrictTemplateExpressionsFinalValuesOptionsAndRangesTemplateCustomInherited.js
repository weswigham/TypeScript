//// [tests/cases/conformance/lint/rules/restrict-template-expressions/lintTypescriptRestrictTemplateExpressionsFinalValuesOptionsAndRangesTemplateCustomInherited.ts] ////

//// [input.ts]
class Base {} class Derived extends Base {} `${new Derived()}`;

//// [input.ts]
class Base {} class Derived extends Base {} `${new Derived()}`;
