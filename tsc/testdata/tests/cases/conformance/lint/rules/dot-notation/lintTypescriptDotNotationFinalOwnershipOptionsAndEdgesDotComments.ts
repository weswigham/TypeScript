// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipOptionsAndEdges/dot_comments (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/dot-notation": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const object: any; object[/* keep */ 'value'];