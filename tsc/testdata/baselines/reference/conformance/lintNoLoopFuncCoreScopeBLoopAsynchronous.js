//// [tests/cases/conformance/lint/rules/no-loop-func/lintNoLoopFuncCoreScopeBLoopAsynchronous.ts] ////

//// [input.ts]
for (var index = 0; index < 3; index++) { (async () => index)(); (function*() { yield index; })(); }

//// [input.ts]
for (var index = 0; index < 3; index++) { (async () => index)(); (function*() { yield index; })(); }
