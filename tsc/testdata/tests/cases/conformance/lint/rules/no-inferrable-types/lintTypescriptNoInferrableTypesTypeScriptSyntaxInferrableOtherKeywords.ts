// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInferrableTypes/inferrable_other_keywords (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-inferrable-types": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const a: bigint = -10n; const b: null = null; const c: undefined = void 0; const d: symbol = Symbol?.();