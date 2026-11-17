//// [tests/cases/conformance/lint/rules/strict/lintStrictRolloutStyleAndOneVarFunctionFooUseUseReturn.ts] ////

//// [input.ts]
function foo() { 'use strict'; 'use strict'; return; }

//// [input.ts]
function foo() { 'use strict';  return; }
