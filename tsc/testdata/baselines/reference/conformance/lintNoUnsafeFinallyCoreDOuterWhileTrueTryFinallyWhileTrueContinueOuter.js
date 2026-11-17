//// [tests/cases/conformance/lint/rules/no-unsafe-finally/lintNoUnsafeFinallyCoreDOuterWhileTrueTryFinallyWhileTrueContinueOuter.ts] ////

//// [input.ts]
outer: while (true) { try {} finally { while (true) { continue outer; } } }

//// [input.ts]
outer: while (true) { try {} finally { while (true) { continue outer; } } }
