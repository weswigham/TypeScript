//// [tests/cases/conformance/lint/rules/no-template-curly-in-string/noTemplateCurlyInStringCoreLiterals.ts] ////

//// [input.ts]
'Hello, ${name}';
'${greeting}, ${name}';
'Hello, ${{foo: "bar"}.foo}';
'\u0024{name}';
'${}';
'${';
`Hello, ${name}`;
tag`Hello, ${name}`;

//// [input.ts]
'Hello, ${name}';
'${greeting}, ${name}';
'Hello, ${{foo: "bar"}.foo}';
'\u0024{name}';
'${}';
'${';
`Hello, ${name}`;
tag`Hello, ${name}`;
