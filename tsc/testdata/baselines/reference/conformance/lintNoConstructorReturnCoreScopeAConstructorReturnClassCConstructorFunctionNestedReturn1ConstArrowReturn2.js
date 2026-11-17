//// [tests/cases/conformance/lint/rules/no-constructor-return/lintNoConstructorReturnCoreScopeAConstructorReturnClassCConstructorFunctionNestedReturn1ConstArrowReturn2.ts] ////

//// [input.ts]
class C { constructor() { function nested() { return 1; } const arrow = () => { return 2; }; } }

//// [input.ts]
class C { constructor() { function nested() { return 1; } const arrow = () => { return 2; }; } }
