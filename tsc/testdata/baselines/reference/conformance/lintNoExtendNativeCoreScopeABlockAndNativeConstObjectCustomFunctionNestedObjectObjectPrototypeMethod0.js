//// [tests/cases/conformance/lint/rules/no-extend-native/lintNoExtendNativeCoreScopeABlockAndNativeConstObjectCustomFunctionNestedObjectObjectPrototypeMethod0.ts] ////

//// [input.ts]
const Object = custom; function nested(Object) { Object.prototype.method = 0; }

//// [input.ts]
const Object = custom; function nested(Object) { Object.prototype.method = 0; }
