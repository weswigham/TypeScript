// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-extra-non-null-assertion": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: string | undefined;
declare const record: { value: string } | undefined;

value!!;
(record!)?.value;

value!;
record?.value;