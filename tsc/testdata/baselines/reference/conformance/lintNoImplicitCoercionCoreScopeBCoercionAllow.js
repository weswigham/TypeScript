//// [tests/cases/conformance/lint/rules/no-implicit-coercion/lintNoImplicitCoercionCoreScopeBCoercionAllow.ts] ////

//// [input.ts]
!!value; +value; - -value; value * 1; value - 0; '' + value; value += ''; ~items.indexOf(value);

//// [input.ts]
!!value; +value; - -value; value * 1; value - 0; '' + value; value += ''; ~items.indexOf(value);
