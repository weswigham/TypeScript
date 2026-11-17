// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypeScriptScopeDefaults/no-unused-private-class-members/class_C_{_private_a;_set_#b(value)_{}_m()_{_const_{_a_}_=_this;_this.#b_=_1;_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-unused-private-class-members": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
class C { private a; set #b(value) {} m() { const { a } = this; this.#b = 1; } }