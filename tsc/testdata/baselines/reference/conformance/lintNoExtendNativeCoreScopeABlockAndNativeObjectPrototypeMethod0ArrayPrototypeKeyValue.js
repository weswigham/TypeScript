//// [tests/cases/conformance/lint/rules/no-extend-native/lintNoExtendNativeCoreScopeABlockAndNativeObjectPrototypeMethod0ArrayPrototypeKeyValue.ts] ////

//// [input.ts]
Object.prototype.method = 0; Array['prototype'][key] ||= value;

//// [input.ts]
Object.prototype.method = 0; Array['prototype'][key] ||= value;
