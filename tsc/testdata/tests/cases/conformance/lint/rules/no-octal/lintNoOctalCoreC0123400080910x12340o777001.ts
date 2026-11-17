// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestCoreCNoOctal/01234;_00;_08;_09.1;_0x1234;_0o777;_0;_0.1; (invocation 2).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-octal": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
01234; 00; 08; 09.1; 0x1234; 0o777; 0; 0.1;