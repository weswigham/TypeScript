// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesStrictVoidReturnOptionsAndRanges/strict_class_property (invocation 1).
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
interface Base { fn(): void } class Derived implements Base { fn = () => 1; }