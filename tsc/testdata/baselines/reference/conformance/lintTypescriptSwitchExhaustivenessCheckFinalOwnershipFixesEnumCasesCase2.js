//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesEnumCasesCase2.ts] ////

//// [input.ts]
enum E { A, B } declare const value: E; switch (value) { case E.A: break;
case E.B: {
    throw new Error('Not implemented yet: E.B case');
}
 }

//// [input.ts]
enum E { A, B } declare const value: E; switch (value) { case E.A: break;
case E.B: {
    throw new Error('Not implemented yet: E.B case');
}
 }
