// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesOnlyThrowErrorOptionsAndRanges/throw_generic_class_error (invocation 1).
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
            "@typescript-eslint/only-throw-error": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
class Custom<T> extends Error { value!: T } declare const value: Custom<number>; throw value;