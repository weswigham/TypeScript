// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "strict": true, "target": "esnext", "module": "preserve" },
    "lint": { "rules": { "@typescript-eslint/no-use-before-define": ["error", { "functions": true, "ignoreTypeReferences": true }] } },
    "files": ["input.ts"]
}

// @filename: input.ts
run();
function run(): number {
    return 1;
}

export function readLater(): number {
    return later;
}
const later = 2;

export type Earlier = Later;
type Later = number;

const ready = 3;
export function readReady(): number {
    return ready;
}
run();