// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-warning-comments": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
// TODO: work
/* fixme */
// xxx
// TodoMVC
// any TODO
/** TODO */
const string = "// TODO";
const regex = /[/* TODO */]/;
/* eslint no-warning-comments: [2, { terms: ["todo"] }] */