// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "@typescript-eslint/no-non-null-assertion": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
declare const value: any;
value!;
value!.property;
value!["property"];
value!();
value!?.property;
value!?.["property"];
value!?.();
value!!!;
value!!.property;
(value!).property;
(value!)["property"];
(value!)();
value!.property = 1;
value!.property++;
delete value!.property;
({ property: value!.property } = value);
[value!.property] = value;
(value!.property as number)++;
value!
    // comment between the assertion and property access
    .property;
!value;
class Definite { property!: number }