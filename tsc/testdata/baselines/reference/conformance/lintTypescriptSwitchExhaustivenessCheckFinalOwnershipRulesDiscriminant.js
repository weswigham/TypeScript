//// [tests/cases/conformance/lint/rules/switch-exhaustiveness-check/lintTypescriptSwitchExhaustivenessCheckFinalOwnershipRulesDiscriminant.ts] ////

//// [input.ts]
declare const value: {kind: 'a'} | {kind: 'b'}; switch (value.kind) { case 'a': break; }

//// [input.ts]
declare const value: {kind: 'a'} | {kind: 'b'}; switch (value.kind) { case 'a': break; }
