// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-unsafe-optional-chaining": ["error", { "disallowArithmeticOperators": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
obj?.value + other;
value += obj?.value;
+obj?.value;
async function foo() { (await obj?.value) * other; }
(obj?.value ?? fallback) + other;
value |= obj?.value;