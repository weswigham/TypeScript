// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityComputedAccessorNames/exponent_string (invocation 3).
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
declare class C { get [1e21](): number; set ['1e+21'](v: string); }
export {};