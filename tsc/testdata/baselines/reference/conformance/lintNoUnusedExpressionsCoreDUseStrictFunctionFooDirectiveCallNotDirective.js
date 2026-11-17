//// [tests/cases/conformance/lint/rules/no-unused-expressions/lintNoUnusedExpressionsCoreDUseStrictFunctionFooDirectiveCallNotDirective.ts] ////

//// [input.ts]
'use strict'; function foo() { 'directive'; call(); 'not directive'; }

//// [input.ts]
'use strict'; function foo() { 'directive'; call(); 'not directive'; }
