// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "prefer-rest-params": "error" } }
}
// @filename: input.ts
function implicit() {
    use(arguments);
    use(arguments[0]);
    use(arguments.length);
    return () => arguments[1];
}
function explicit(arguments: unknown[]) {
    return arguments[0];
}
class Example {
    method() {
        return arguments[0];
    }
}