// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext", "allowJs": true },
    "lint": { "rules": { "no-nonoctal-decimal-escape": "error" } },
    "files": ["input.js"]
}

// @filename: input.js
'\8\9';
'\0\8';
'\0\9';
'\08';
'\\8';
'\\\9';
'\
\8';