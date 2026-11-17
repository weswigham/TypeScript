// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /project
// Migrated from TestTypedParityBrandedStringTemplates/generic_constraint (invocation 1).
// @filename: /project/tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unnecessary-template-expression": "error"
        }
    },
    "files": [
        "src/input.ts"
    ]
}
// @filename: /project/src/input.ts
function f<T extends string & { brand: true }>(s: T) { return `${s}`; }
export {};