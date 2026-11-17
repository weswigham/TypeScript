//// [tests/cases/conformance/lint/rules/no-extend-native/lintNoExtendNativeCoreScopeABlockAndNativeConstObjectCustomFunctionNestedObjectPrototypeMethod0.ts] ////

//// [input.ts]
const Object = custom; function nested() { Object.prototype.method = 0; }

//// [input.ts]
const Object = custom; function nested() { Object.prototype.method = 0; }
