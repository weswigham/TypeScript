// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralDeprecated/class_A_{_/**_@deprecated_*/_constructor()_{}_}_class_B_extends_A_{_constructor()_{_super();_}_} (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-deprecated": "error"
        }
    },
    "files": [
        "/input.ts"
    ]
}
// @filename: /input.ts
class A { /** @deprecated */ constructor() {} } class B extends A { constructor() { super(); } }