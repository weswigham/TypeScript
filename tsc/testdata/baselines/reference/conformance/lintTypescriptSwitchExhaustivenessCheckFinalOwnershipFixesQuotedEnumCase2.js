//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesQuotedEnumCase2.ts] ////

//// [input.ts]
enum E { 'a-b', C } declare const value: E; switch (value) { case E.C: break;
case E['a-b']: {
    throw new Error('Not implemented yet: (typeof E)["a-b"] case');
}
 }

//// [input.ts]
enum E { 'a-b', C } declare const value: E; switch (value) { case E.C: break;
case E['a-b']: {
    throw new Error('Not implemented yet: (typeof E)["a-b"] case');
}
 }
