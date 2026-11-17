// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutReturnsLocations/const_object_=_{_run:_async_function()_{_return_1;_}_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "require-await": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const object = { run: async function() { return 1; } };