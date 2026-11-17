// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalOwnershipOptionsAndEdges/class_override (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/unbound-method": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C extends Number { static parseInt = function(value: string) { return 1; } } const method = C.parseInt;