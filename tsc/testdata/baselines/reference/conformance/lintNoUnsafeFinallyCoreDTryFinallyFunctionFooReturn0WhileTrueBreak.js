//// [tests/cases/conformance/lint/rules/no-unsafe-finally/lintNoUnsafeFinallyCoreDTryFinallyFunctionFooReturn0WhileTrueBreak.ts] ////

//// [input.ts]
try {} finally { function foo() { return 0; } while (true) { break; } }

//// [input.ts]
try {} finally { function foo() { return 0; } while (true) { break; } }
