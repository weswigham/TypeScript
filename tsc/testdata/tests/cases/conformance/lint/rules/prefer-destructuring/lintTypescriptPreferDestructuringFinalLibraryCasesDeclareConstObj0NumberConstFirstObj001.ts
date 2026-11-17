// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalLibraryCases/prefer-destructuring/declare_const_obj:_{_0:_number_};_const_first_=_obj[0];#01 (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/prefer-destructuring": [
                "error",
                {
                    "object": true
                },
                {
                    "enforceForRenamedProperties": true
                }
            ]
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
declare const obj: { 0: number }; const first = obj[0];