//// [tests/cases/conformance/lint/rules/no-loop-func/lintNoLoopFuncCoreScopeBLoopNestedWrite.ts] ////

//// [input.ts]
let value; function update() { value = 1; } while (ready) { () => value; }

//// [input.ts]
let value; function update() { value = 1; } while (ready) { () => value; }
