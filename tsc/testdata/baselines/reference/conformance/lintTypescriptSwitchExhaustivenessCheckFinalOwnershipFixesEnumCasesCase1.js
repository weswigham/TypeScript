//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesEnumCasesCase1.ts] ////

//// [input.ts]
enum E { A, B } declare const value: E; switch (value) { case E.A: break; }

//// [input.ts]
enum E { A, B } declare const value: E; switch (value) { case E.A: break; }
