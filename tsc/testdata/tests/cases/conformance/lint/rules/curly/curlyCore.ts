// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "curly": "error" } },
    "files": ["input.ts"]
}
// @filename: input.ts
if (value) work(); else other();
while (value) work();
do work(); while (value);
for (let index = 0; index < 3; index++) work();
for (const key in object) work(key);
for (const item of array) work(item);
if (value) /* Keep */ work();