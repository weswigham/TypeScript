// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "declaration": true },
    "lint": { "rules": { "no-debugger": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
const value = { debugger: 1 };
value.debugger;
value["debugger"];
const text = "debugger;";
const template = `debugger;`;
const pattern = /debugger/;
// debugger;
/* debugger; */