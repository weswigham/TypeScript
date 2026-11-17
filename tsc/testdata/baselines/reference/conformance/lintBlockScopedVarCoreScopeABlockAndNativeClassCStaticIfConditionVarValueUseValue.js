//// [tests/cases/conformance/lint/rules/block-scoped-var/lintBlockScopedVarCoreScopeABlockAndNativeClassCStaticIfConditionVarValueUseValue.ts] ////

//// [input.ts]
class C { static { if (condition) { var value; } use(value); } }

//// [input.ts]
class C { static { if (condition) { var value; } use(value); } }
