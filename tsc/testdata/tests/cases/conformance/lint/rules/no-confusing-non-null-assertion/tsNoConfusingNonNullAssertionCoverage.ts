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
            "@typescript-eslint/no-confusing-non-null-assertion": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: string | undefined;
declare const other: string;
declare const record: Record<string, unknown>;

value! === other;
value! in record;

(value!) === other;
(value!) in record;
value === other;