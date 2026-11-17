// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "preserve", "strict": true },
    "lint": { "rules": { "@typescript-eslint/ban-ts-comment": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
// @ts-ignore
const ignored: string = 1;
// @ts-expect-error
const unexplained: string = 2;
// @ts-expect-error: numeric input intentionally tests the string boundary
const explained: string = 3;
// @ts-check
const checked = 4;
const directiveLiteral = "// @ts-ignore";
export {};