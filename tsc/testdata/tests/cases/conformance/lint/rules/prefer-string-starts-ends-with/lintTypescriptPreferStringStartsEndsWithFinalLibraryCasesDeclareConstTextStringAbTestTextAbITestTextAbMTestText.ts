// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalLibraryCases/prefer-string-starts-ends-with/declare_const_text:_string;_/^ab$/.test(text);_/^ab/i.test(text);_/^ab/m.test(text);_/^a|b/.test(text); (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-string-starts-ends-with": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const text: string; /^ab$/.test(text); /^ab/i.test(text); /^ab/m.test(text); /^a|b/.test(text);