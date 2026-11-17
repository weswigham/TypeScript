//// [tests/cases/conformance/lint/rules/eqeqeq/lintEqeqeqCoreAFixOutputParenthesizedOperandsAndSurroundingCommentsCase1.ts] ////

//// [input.ts]
/* Leading */ ((typeof left) /* Left */ != /* Right */ ("string")); /* Trailing */

//// [input.ts]
/* Leading */ ((typeof left) /* Left */ !== /* Right */ ("string")); /* Trailing */
