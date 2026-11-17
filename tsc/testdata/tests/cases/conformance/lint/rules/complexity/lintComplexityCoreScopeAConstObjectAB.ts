// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreScopeAComplexity/const_object_=_{_[a_||_b]()_{}_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "complexity": [
                "error",
                1
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
const object = { [a || b]() {} };