// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-nested-ternary": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
foo ? bar : baz === qux ? quxx : foobar;
foo ? baz === qux ? quxx : foobar : bar;
foo ? (bar ? baz : qux) : quux;
(foo ? bar : baz) ? qux : quux;
foo ? bar : baz;