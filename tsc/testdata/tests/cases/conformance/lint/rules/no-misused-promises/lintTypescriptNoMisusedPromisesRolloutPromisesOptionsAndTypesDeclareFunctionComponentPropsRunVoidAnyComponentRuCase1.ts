// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutPromisesOptionsAndTypes/no-misused-promises/declare_function_Component(props:_{_run:_()_=>_void_}):_any;_<Component_run={async_()_=>_{}}_/>; (invocation 1).
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "lib": [
            "esnext",
            "dom"
        ],
        "module": "esnext",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-misused-promises": "error"
        }
    },
    "files": [
        "input.tsx"
    ]
}
// @filename: /input.tsx
declare function Component(props: { run: () => void }): any; <Component run={async () => {}} />;
export {};