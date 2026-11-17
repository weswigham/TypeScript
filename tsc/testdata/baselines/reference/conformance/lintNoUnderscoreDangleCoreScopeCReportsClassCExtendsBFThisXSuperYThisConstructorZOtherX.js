//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCReportsClassCExtendsBFThisXSuperYThisConstructorZOtherX.ts] ////

//// [input.ts]
class C extends B { f() { this._x; super._y; this.constructor._z; other._x; } }

//// [input.ts]
class C extends B { f() { this._x; super._y; this.constructor._z; other._x; } }
