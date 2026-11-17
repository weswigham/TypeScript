// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityComputedAccessorNames/regexp_literal (invocation 1).
// @filename: /project/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/related-getter-setter-pairs": "error"
        }
    },
    "files": [
        "src/input.ts"
    ]
}
// @filename: /project/src/input.ts
interface C { get [/a/ig](): number; set ['/a/gi'](v: string); }
export {};