// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-div-regex": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const ambiguous = /=foo/;
const flags = /=foo/giu;
const comment = /* keep */ /=/;
const escaped = /\=foo/;
const normal = /foo/;
const characterClass = /[=]foo/;
const constructor = new RegExp("=foo");