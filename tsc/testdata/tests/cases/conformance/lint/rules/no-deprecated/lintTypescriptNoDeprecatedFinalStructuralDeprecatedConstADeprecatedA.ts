// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralDeprecated/const_a_=_'/**_@deprecated_*/';_a; (invocation 1).
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
            "@typescript-eslint/no-deprecated": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
const a = '/** @deprecated */'; a;