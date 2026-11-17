// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesStrictVoidReturnOptionsAndRanges/strict_union_expected (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/strict-void-return": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
const fn: (() => void) | (() => number) = () => 1;