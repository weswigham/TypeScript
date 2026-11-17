//// [tests/cases/conformance/lint/rules/no-implicit-coercion/lintNoImplicitCoercionCoreScopeBCoercionDefaults.ts] ////

//// [input.ts]
!!value; +value; - -value; value * 1; value - 0; '' + value; value += ''; ~items.indexOf(value); `${value}`;

//// [input.ts]
Boolean(value); +value; - -value; value * 1; value - 0; '' + value; value += ''; ~items.indexOf(value); `${value}`;
