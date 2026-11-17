//// [tests/cases/conformance/lint/rules/strict/lintStrictRolloutStyleAndOneVarFunctionFooUseFunctionBarUse.ts] ////

//// [input.ts]
function foo() { 'use strict'; function bar() { 'use strict'; } }

//// [input.ts]
function foo() { 'use strict'; function bar() {  } }
