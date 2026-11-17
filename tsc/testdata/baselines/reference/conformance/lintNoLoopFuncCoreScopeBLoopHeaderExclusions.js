//// [tests/cases/conformance/lint/rules/no-loop-func/lintNoLoopFuncCoreScopeBLoopHeaderExclusions.ts] ////

//// [input.ts]
for (var index = 0, callback = () => index; index < 3; index++) {} for (var item of values.filter(() => item)) {}

//// [input.ts]
for (var index = 0, callback = () => index; index < 3; index++) {} for (var item of values.filter(() => item)) {}
