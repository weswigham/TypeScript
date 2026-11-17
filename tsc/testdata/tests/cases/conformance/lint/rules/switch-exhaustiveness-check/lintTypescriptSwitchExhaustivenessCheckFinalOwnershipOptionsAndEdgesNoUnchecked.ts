// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipOptionsAndEdges/no_unchecked (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "noUncheckedIndexedAccess": true,
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/switch-exhaustiveness-check": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
function f(values: string[]) { switch (values[0]) { case 'a': break; } }