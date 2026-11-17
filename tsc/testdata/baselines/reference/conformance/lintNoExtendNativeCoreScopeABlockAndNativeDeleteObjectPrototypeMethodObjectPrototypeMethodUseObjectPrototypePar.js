//// [tests/cases/conformance/lint/rules/no-extend-native/lintNoExtendNativeCoreScopeABlockAndNativeDeleteObjectPrototypeMethodObjectPrototypeMethodUseObjectPrototypePar.ts] ////

//// [input.ts]
delete Object.prototype.method; Object.prototype.method++; use(Object.prototype); parseFloat.prototype.method = 0;

//// [input.ts]
delete Object.prototype.method; Object.prototype.method++; use(Object.prototype); parseFloat.prototype.method = 0;
