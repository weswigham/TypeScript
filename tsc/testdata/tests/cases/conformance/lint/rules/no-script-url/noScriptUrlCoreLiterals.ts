// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-script-url": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
'javascript:void(0);';
'JavaScript:';
`javascript:`;
'\x6aavascript:';
tag`javascript:`;
`javascript:${foo}`;
'xjavascript:';