//// [tests/cases/conformance/lint/rules/no-unused-expressions/noUnusedExpressionsCoreOptions.ts] ////

//// [input.tsx]
"directive";
value && call();
value ? call() : other();
value && obj?.key;
value ? call() : obj.key;
tag`template`;
`template`;
<div />;
<></>;

//// [input.tsx]
"directive";
value && call();
value ? call() : other();
value && obj?.key;
value ? call() : obj.key;
tag`template`;
`template`;
<div />;
<></>;
