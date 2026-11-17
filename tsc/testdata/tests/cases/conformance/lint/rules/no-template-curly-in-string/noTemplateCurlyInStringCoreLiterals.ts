// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-template-curly-in-string": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
'Hello, ${name}';
'${greeting}, ${name}';
'Hello, ${{foo: "bar"}.foo}';
'\u0024{name}';
'${}';
'${';
`Hello, ${name}`;
tag`Hello, ${name}`;