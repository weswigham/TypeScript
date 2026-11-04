// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-debugger": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
if (true) debugger
if (true) debugger; else void 0;
while (false) debugger;
do debugger; while (false);
for (; false;) debugger;
label: debugger;
switch (1) {
    case 1:
        debugger;
        break;
    default:
        debugger;
}
if (true) {
    debugger;
}