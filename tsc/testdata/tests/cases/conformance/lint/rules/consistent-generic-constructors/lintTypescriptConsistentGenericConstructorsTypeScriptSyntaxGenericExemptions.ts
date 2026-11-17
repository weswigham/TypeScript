// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptSyntaxConsistentGenericConstructors/generic_exemptions (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/consistent-generic-constructors": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const a: Other<string> = new Box(); const b: Box<string> = new Box<string>(); const c: Box = new Box(); const d: Box<string> = Box();