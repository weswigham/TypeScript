//// [tests/cases/conformance/lint/rules/no-implicit-coercion/noImplicitCoercionScopeBOptions.ts] ////

//// [input.ts]
!!value;
+value;
"" + value;
`${value}`;
tag`${value}`;
`${String(value)}`;
`${value}suffix`;

//// [input.ts]
!!value;
+value;
"" + value;
`${value}`;
tag`${value}`;
`${String(value)}`;
`${value}suffix`;
