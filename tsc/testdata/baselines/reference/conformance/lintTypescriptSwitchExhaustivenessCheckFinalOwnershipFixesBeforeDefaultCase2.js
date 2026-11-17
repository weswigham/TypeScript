//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipFixesBeforeDefaultCase2.ts] ////

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { case "a": {
    throw new Error('Not implemented yet: "a" case');
}
case "b": {
    throw new Error('Not implemented yet: "b" case');
}
default: break; }

//// [input.ts]
declare const value: 'a' | 'b'; switch (value) { case "a": {
    throw new Error('Not implemented yet: "a" case');
}
case "b": {
    throw new Error('Not implemented yet: "b" case');
}
default: break; }
