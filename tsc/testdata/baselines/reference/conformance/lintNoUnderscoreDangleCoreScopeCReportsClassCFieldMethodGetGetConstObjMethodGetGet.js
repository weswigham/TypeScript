//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCReportsClassCFieldMethodGetGetConstObjMethodGetGet.ts] ////

//// [input.ts]
class C { #_field; _method() {} get _get() {} } const obj = { _method() {}, get _get() {} };

//// [input.ts]
class C { #_field; _method() {} get _get() {} } const obj = { _method() {}, get _get() {} };
