// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "jsx": "preserve" },
    "lint": { "rules": { "no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true, "allowTaggedTemplates": true, "enforceForJSX": true, "ignoreDirectives": true }] } },
    "files": ["input.tsx"]
}

// @filename: input.tsx
"directive";
value && call();
value ? call() : other();
value && obj?.key;
value ? call() : obj.key;
tag`template`;
`template`;
<div />;
<></>;