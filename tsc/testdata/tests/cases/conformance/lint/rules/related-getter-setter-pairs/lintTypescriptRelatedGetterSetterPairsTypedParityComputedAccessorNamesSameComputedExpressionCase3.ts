// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityComputedAccessorNames/same_computed_expression (invocation 3).
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
declare class C { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); }
export {};