// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/prefer-for-of": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const items = [1, 2, 3];
declare function use(value: number): void;

for (let index = 0; index < items.length; index++) {
    use(items[index]);
}

for (const item of items) {
    use(item);
}

for (let index = 0; index < items.length; index++) {
    items[index] = index;
}