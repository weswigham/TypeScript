// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "allowJs": true },
    "lint": { "rules": { "no-octal": "error" } },
    "files": ["input.js"]
}

// @filename: input.js
01234;
00;
08;
09.1;
019e1;
0x1234;
0o777;
0;
0.1;