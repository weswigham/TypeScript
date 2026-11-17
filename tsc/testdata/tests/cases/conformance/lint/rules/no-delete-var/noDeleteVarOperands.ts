// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-delete-var": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
var value;
delete value;
delete (value);
delete ((value));
delete missing;
delete value.property;
delete value["property"];
delete value?.property;
delete (0, value);
delete this;