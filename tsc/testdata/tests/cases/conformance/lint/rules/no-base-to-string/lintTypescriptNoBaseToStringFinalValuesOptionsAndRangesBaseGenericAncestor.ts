// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalValuesNoBaseToStringOptionsAndRanges/base_generic_ancestor (invocation 1).
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
            "@typescript-eslint/no-base-to-string": [
                "error",
                {
                    "ignoredTypeNames": [
                        "Base"
                    ]
                }
            ]
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
class Base {} class Derived<T> extends Base { value!: T } declare const value: Derived<number>; String(value);