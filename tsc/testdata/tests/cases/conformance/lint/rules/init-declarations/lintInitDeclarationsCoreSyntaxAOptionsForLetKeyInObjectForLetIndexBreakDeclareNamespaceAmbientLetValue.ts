// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreSyntaxAOptions/init-declarations/for_(let_key_in_object)_{}_for_(let_index;;)_break;_declare_namespace_Ambient_{_let_value;_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "init-declarations": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
for (let key in object) {} for (let index;;) break; declare namespace Ambient { let value; }