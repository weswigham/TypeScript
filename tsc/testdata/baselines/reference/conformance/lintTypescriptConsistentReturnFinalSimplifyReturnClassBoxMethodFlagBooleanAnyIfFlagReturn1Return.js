//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnClassBoxMethodFlagBooleanAnyIfFlagReturn1Return.ts] ////

//// [input.ts]
class Box { method(flag: boolean): any { if (flag) return 1; return; } }

//// [input.ts]
class Box { method(flag: boolean): any { if (flag) return 1; return; } }
