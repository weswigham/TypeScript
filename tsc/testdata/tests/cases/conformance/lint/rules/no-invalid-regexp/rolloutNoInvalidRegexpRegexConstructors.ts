// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-invalid-regexp": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
RegExp("[");
new RegExp(".", "gg");
RegExp(".", "uv");
RegExp("\\1", "u");
RegExp("\\1");
RegExp("[[a-z]--[aeiou]]", "v");
RegExp("/");