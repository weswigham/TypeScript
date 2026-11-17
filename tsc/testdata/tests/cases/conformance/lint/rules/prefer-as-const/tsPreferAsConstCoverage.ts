// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-as-const": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const asserted = "a" as "a";
const angleAsserted = <1>1;
let annotated: 1 = 1;

const constant = "a" as const;
const differentRawLiteral = 0x10 as 16;
const widened = "a" as string;