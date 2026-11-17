// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-warning-comments": ["error", { "terms": ["todo", "fixme", "[litera|$]"], "location": "anywhere", "decoration": ["*"] }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
// any fixme or todo
/** TODO: work */
// regex [litera|$]
// TODO: something really longer than 40 characters
// https://github.com/eslint/eslint/pull/13522#discussion_r470293411 TODO