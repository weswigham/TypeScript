// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/native_constructors (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-new-native-nonconstructor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
new Symbol(); new BigInt(1); function run(Symbol) { new Symbol(); }