//// [tests/cases/conformance/lint/rules/no-loop-func/lintNoLoopFuncCoreScopeBLoopVarCapture.ts] ////

//// [input.ts]
for (var index = 0; index < 3; index++) { const callback = () => index; }

//// [input.ts]
for (var index = 0; index < 3; index++) { const callback = () => index; }
