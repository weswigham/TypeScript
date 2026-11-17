// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralUpstream/no-misused-spread/invalid/55 (invocation 1).
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
            "@typescript-eslint/no-misused-spread": "error"
        }
    },
    "files": [
        "/input.tsx"
    ]
}
// @filename: /input.tsx

interface FunctionWithProps {
  (): string;
  prop: boolean;
}

type FunctionWithoutProps = () => string;

declare const obj: FunctionWithProps | FunctionWithoutProps | object;

const o = { ...obj };
      