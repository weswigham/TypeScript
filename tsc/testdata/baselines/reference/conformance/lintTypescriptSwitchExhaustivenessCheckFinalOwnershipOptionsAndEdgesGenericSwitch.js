//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipOptionsAndEdgesGenericSwitch.ts] ////

//// [input.ts]
function f<T extends 'a' | 'b'>(value: T) { switch (value) { case 'a': break; } }

//// [input.ts]
function f<T extends 'a' | 'b'>(value: T) { switch (value) { case 'a': break; } }
