// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-non-null-asserted-nullish-coalescing/let_a:_string;_a!_??_'';_let_b_=_'';_b!_??_'';_obj.x!_??_''; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let a: string; a! ?? ''; let b = ''; b! ?? ''; obj.x! ?? '';