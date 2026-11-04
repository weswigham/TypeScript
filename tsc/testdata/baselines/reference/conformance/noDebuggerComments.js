//// [tests/cases/conformance/lint/rules/no-debugger/noDebuggerComments.ts] ////

//// [input.ts]
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

//// [input.ts]
{
    // Keep this leading comment.
    ;
}
{
    ; // Keep this trailing comment.
}
{
    /* Keep this leading block comment. */ ;
}
{
    ; /* Keep this internal comment. */
}
{
    ; /* Keep this trailing block comment. */
}
{
    ; // Keep this internal line comment.
}
; // Keep this top-level comment.

if (true) /* Keep this body comment. */ ;
