// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxNoInferrableTypes/inferrable_exemptions (invocation 1).
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
let a: number; let b: any = 1; let c: 1 = 1; let d: number = new Number(1); let e: bigint = +10n;