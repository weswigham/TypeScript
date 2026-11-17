// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralDeprecated//**_@deprecated_*/_const_a_=_1;_a; (invocation 1).
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
/** @deprecated */ const a = 1; a;