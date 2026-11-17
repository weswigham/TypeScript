//// [tests/cases/conformance/lint/rules/no-implicit-coercion/lintNoImplicitCoercionCoreScopeBFixesShadowedBoolean.ts] ////

//// [input.ts]
function run(Boolean) { return !!value; }

//// [input.ts]
function run(Boolean) { return !!value; }
