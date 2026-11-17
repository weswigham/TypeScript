// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxBNoMagicNumbers/magic_defaults (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-magic-numbers": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
let declared = 3; const object = { value: 4 }; object.value = 5; declared = 6; call(7); parseInt(text, 10);