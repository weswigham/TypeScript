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
            "@typescript-eslint/no-dynamic-delete": "error"
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const record: Record<string, unknown>;
declare const key: string;

delete record[key];
delete record[`key`];

delete record.key;
delete record["key"];
delete record[0];
delete record[-1];