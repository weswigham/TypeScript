//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnClassBoxConstructorFlagBooleanIfFlagReturn.ts] ////

//// [input.ts]
class Box { constructor(flag: boolean) { if (flag) return {}; } }

//// [input.ts]
class Box { constructor(flag: boolean) { if (flag) return {}; } }
