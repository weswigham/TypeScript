//// [tests/cases/conformance/lint/rules/no-useless-catch/lintNoUselessCatchCoreDTryCallCatchErrorKeepThrowError.ts] ////

//// [input.ts]
try { call(); } catch (error) { /* keep */ throw error; }

//// [input.ts]
try { call(); } catch (error) { /* keep */ throw error; }
