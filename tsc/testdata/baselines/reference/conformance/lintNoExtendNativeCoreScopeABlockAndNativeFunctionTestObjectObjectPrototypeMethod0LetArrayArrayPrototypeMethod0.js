//// [tests/cases/conformance/lint/rules/no-extend-native/lintNoExtendNativeCoreScopeABlockAndNativeFunctionTestObjectObjectPrototypeMethod0LetArrayArrayPrototypeMethod0.ts] ////

//// [input.ts]
function test(Object) { Object.prototype.method = 0; } { let Array; Array.prototype.method = 0; }

//// [input.ts]
function test(Object) { Object.prototype.method = 0; } { let Array; Array.prototype.method = 0; }
