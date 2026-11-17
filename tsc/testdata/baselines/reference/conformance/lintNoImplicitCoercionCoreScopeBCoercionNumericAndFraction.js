//// [tests/cases/conformance/lint/rules/no-implicit-coercion/lintNoImplicitCoercionCoreScopeBCoercionNumericAndFraction.ts] ////

//// [input.ts]
+42; +Number(value); 1 * parseFloat(value); 4 * value * 1; value * 1 / 4; (value * 1) / 4; 1 * value / 4;

//// [input.ts]
+42; +Number(value); 1 * parseFloat(value); 4 * value * 1; value * 1 / 4; (value * 1) / 4; 1 * value / 4;
