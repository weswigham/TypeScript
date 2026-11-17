//// [tests/cases/conformance/lint/rules/no-unsafe-finally/lintNoUnsafeFinallyCoreDTryFinallyLabelWhileTrueContinueLabel.ts] ////

//// [input.ts]
try {} finally { label: while (true) { continue label; } }

//// [input.ts]
try {} finally { label: while (true) { continue label; } }
