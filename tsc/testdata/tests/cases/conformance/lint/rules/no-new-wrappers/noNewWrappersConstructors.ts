// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-new-wrappers": "error" } },
    "files": ["input.ts", "shadowed.ts", "imported.ts", "custom.ts"]
}

// @filename: input.ts
new String("value");
new Number(42);
new Boolean(false);
new (String)("value");
new Boolean;
String("value");
Number(42);
Boolean(false);
new Object();
new window.String("value");
String.fromCharCode(32);
function local(String, Number, Boolean) {
    new String();
    new Number();
    new Boolean();
}
{
    const String = Custom;
    new String();
}

// @filename: shadowed.ts
export {};
if (condition) {
    new Boolean();
} else {
    var Boolean = Custom;
}

// @filename: imported.ts
import String from "./custom";
new String();

// @filename: custom.ts
export default class Custom {}