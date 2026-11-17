//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentUsageFinallyOverridesCompletionThrowError.ts] ////

//// [globals.d.ts]

//// [input.ts]
function f() { let value = 0; try { work(); } finally { consume(value); value = 1; throw error; } }

//// [input.ts]
function f() { let value = 0; try { work(); } finally { consume(value); value = 1; throw error; } }
