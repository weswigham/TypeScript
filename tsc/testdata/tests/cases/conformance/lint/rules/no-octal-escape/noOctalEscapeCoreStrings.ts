// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "allowJs": true },
    "lint": { "rules": { "no-octal-escape": "error" } },
    "files": ["input.js"]
}

// @filename: input.js
'\01\02';
'\377';
'\378';
'\400';
'\08';
'\0';
'\8';
'\\01';
/([abc]) \1/g;