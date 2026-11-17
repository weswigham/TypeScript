//// [tests/cases/conformance/lint/rules/no-loop-func/lintNoLoopFuncCoreScopeBLoopLexical.ts] ////

//// [input.ts]
for (let index = 0; index < 3; index++) { const callback = () => index; } const stable = 0; while (ready) { () => stable; }

//// [input.ts]
for (let index = 0; index < 3; index++) { const callback = () => index; } const stable = 0; while (ready) { () => stable; }
