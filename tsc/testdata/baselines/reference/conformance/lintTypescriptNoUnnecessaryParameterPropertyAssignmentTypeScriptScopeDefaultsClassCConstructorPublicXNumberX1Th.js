//// [tests/cases/conformance/lint/rules/no-unnecessary-parameter-property-assignment/lintTypescriptNoUnnecessaryParameterPropertyAssignmentTypeScriptScopeDefaultsClassCConstructorPublicXNumberX1Th.ts] ////

//// [input.ts]
class C { constructor(public x: number) { x = 1; this.x = x; } }

//// [input.ts]
class C { constructor(public x: number) { x = 1; this.x = x; } }
