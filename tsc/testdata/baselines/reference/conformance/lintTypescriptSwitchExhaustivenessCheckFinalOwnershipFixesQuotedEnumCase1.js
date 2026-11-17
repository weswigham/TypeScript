//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesQuotedEnumCase1.ts] ////

//// [input.ts]
enum E { 'a-b', C } declare const value: E; switch (value) { case E.C: break; }

//// [input.ts]
enum E { 'a-b', C } declare const value: E; switch (value) { case E.C: break; }
