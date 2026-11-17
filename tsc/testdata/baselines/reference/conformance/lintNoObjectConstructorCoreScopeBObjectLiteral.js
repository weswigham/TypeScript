//// [tests/cases/conformance/lint/rules/no-object-constructor/lintNoObjectConstructorCoreScopeBObjectLiteral.ts] ////

//// [input.ts]
Object(); new Object; Object(1); new globalThis.Object(); function run(Object) { Object(); }

//// [input.ts]
Object(); new Object; Object(1); new globalThis.Object(); function run(Object) { Object(); }
