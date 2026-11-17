// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalLibraryCases/prefer-includes/declare_const_text:_string;_/a|b/.test(text);_/a/i.test(text);_/a/g.test(text);_/[a]/.test(text);_/a+/.test(text); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-includes": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const text: string; /a|b/.test(text); /a/i.test(text); /a/g.test(text); /[a]/.test(text); /a+/.test(text);