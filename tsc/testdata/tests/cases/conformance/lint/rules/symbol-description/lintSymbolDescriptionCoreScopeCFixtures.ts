// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeCFixtures/symbol-description (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "symbol-description": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
Symbol();
Symbol?.();
Symbol("description");
Symbol(undefined);
function shadowed(Symbol: (...args: unknown[]) => symbol) {
    Symbol();
}
{
    const Symbol = () => 0;
    Symbol();
}