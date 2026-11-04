// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-debugger": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
debugger;
debugger
{
    debugger;
}

function inspect() {
    debugger;
    return 1;
}