// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeB/coercion_numeric_and_fraction (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-implicit-coercion": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
+42; +Number(value); 1 * parseFloat(value); 4 * value * 1; value * 1 / 4; (value * 1) / 4; 1 * value / 4;