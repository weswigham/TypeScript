// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestTypedCMembers/related-getter-setter-pairs/type_Example_=_{_get_value():_number;_set_value();_}; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/related-getter-setter-pairs": "error"
        }
    },
    "files": [
        "input.ts"
    ]
}
// @filename: /input.ts
type Example = { get value(): number; set value(); };