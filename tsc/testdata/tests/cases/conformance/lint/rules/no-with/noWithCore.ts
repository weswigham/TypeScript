// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-with": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
with (object) { work(); }
with /* keep */ (object) work();
object.work();