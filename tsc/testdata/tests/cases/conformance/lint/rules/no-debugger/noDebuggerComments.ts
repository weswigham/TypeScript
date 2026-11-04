// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "lint": { "rules": { "no-debugger": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
{
    // Keep this leading comment.
    debugger;
}
{
    debugger; // Keep this trailing comment.
}
{
    /* Keep this leading block comment. */ debugger;
}
{
    debugger /* Keep this internal comment. */;
}
{
    debugger; /* Keep this trailing block comment. */
}
{
    debugger // Keep this internal line comment.
    ;
}
debugger; // Keep this top-level comment.

if (true) /* Keep this body comment. */ debugger;