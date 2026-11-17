//// [tests/cases/conformance/lint/rules/no-useless-catch/lintNoUselessCatchCoreDTryCatchErrorThrowErrorUnreachableFinally.ts] ////

//// [input.ts]
try {} catch (error) { throw (error); unreachable(); } finally {}

//// [input.ts]
try {} catch (error) { throw (error); unreachable(); } finally {}
