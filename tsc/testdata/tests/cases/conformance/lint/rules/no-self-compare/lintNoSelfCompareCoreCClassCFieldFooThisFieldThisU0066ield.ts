// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoSelfCompare/class_C_{_#field;_foo()_{_this.#field_===_this.#\u0066ield;_}_} (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-self-compare": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C { #field; foo() { this.#field === this.#\u0066ield; } }