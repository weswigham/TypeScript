// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-void": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
void 0;
void(0);
const value = void work();
const nested = void (void 0);
(void 0);
const object = { void() {}, value: 0 };
object.void();
object.value = 1;
type Callback = () => void;
function work(): void {}