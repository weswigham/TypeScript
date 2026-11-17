//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipRulesBrandedSwitch.ts] ////

//// [input.ts]
declare const value: ('a' & { tag: true }) | 1; switch (value) { case 'a': break; case 1: break; }

//// [input.ts]
declare const value: ('a' & { tag: true }) | 1; switch (value) { case 'a': break; case 1: break; }
