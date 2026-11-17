//// [tests/cases/conformance/lint/rules/no-useless-catch/lintNoUselessCatchCoreDTryCatchErrorThrowErrorTryCatchErrorWorkThrowError.ts] ////

//// [input.ts]
try {} catch ({ error }) { throw error; } try {} catch (error) { work(); throw error; }

//// [input.ts]
try {} catch ({ error }) { throw error; } try {} catch (error) { work(); throw error; }
