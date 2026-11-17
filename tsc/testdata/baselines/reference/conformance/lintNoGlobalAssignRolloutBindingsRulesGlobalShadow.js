//// [tests/cases/conformance/lint/rules/no-global-assign/lintNoGlobalAssignRolloutBindingsRulesGlobalShadow.ts] ////

//// [input.ts]
function task(Array) { Array = 1; } { let String; String++; } unknown = 1;

//// [input.ts]
function task(Array) { Array = 1; } { let String; String++; } unknown = 1;
