// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-useless-rename": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
import { foo as foo, "bar" as bar, type Shape as Shape } from "module";
export { foo as "foo", bar as bar, type Shape as Shape };
const { value: value = (other), "key": key } = object;
({ value: (value) } = object);
({ value: (value) = other } = object);
({ value: /* keep */ value } = object);
const { [key]: key } = object;