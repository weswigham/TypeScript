// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutBindingsRules/exports_default (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-restricted-exports": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
export const value = 1; export default value;