// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-caller": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
function inspect() {
    arguments.callee;
    arguments.caller;
    arguments?.callee;
    (arguments).caller;
    arguments["callee"];
    arguments[`caller`];
    arguments[caller];
    arguments.length;
    arguments[0];
    other.caller;
}
function syntactic(arguments) {
    arguments.callee;
}