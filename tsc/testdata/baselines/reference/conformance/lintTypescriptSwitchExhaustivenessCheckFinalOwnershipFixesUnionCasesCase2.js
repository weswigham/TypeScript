//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesUnionCasesCase2.ts] ////

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { case 'a': break;
case "b": {
    throw new Error('Not implemented yet: "b" case');
}
 }

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { case 'a': break;
case "b": {
    throw new Error('Not implemented yet: "b" case');
}
 }
