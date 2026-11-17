// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarations/shorthand-constructor (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "object-shorthand": [
                "error",
                "always",
                {
                    "ignoreConstructors": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const o = {_0Ctor: function() {}};