// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutDeclarationsConstructors/class_A_extends_B_{_constructor()_{_super(...arguments);_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-constructor": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class A extends B { constructor() { super(...arguments); } }