//// [tests/cases/conformance/lint/rules/vars-on-top/lintVarsOnTopCoreDCallVarFirstFunctionFooIfFirstVarSecondForVarIndex0.ts] ////

//// [input.ts]
call(); var first; function foo() { if (first) { var second; } for (var index = 0;;) {} }

//// [input.ts]
call(); var first; function foo() { if (first) { var second; } for (var index = 0;;) {} }
