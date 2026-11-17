// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralUpstream/no-misused-spread/valid/31 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-misused-spread": [
                "error",
                {
                    "allow": [
                        "string"
                    ]
                }
            ]
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx

const str: string = 'test';
const a = [...str];
      