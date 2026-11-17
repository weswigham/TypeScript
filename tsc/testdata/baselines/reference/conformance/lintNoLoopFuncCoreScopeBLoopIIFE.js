//// [tests/cases/conformance/lint/rules/no-loop-func/lintNoLoopFuncCoreScopeBLoopIIFE.ts] ////

//// [input.ts]
for (var index = 0; index < 3; index++) { (() => index)(); (() => { return () => index; })(); }

//// [input.ts]
for (var index = 0; index < 3; index++) { (() => index)(); (() => { return () => index; })(); }
