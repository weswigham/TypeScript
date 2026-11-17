// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-cond-assign": "error" } },
    "files": ["input.ts"]
}

// @filename: input.ts
let value, other, result;
if (value = other) {}
while (value += 1) {}
do {} while (value = other);
for (; value = other;) {}
result = (value = other) ? 1 : 0;
if ((value = other)) {}
while ((value = other)) {}
do {} while ((value = other));
for (; (value = other);) {}
result = ((value = other)) ? 1 : 0;
if ((value) = (other)) {}
if (value || (value = other)) {}
if ((() => value = other)()) {}
switch (value) { case value = other: break; }
for (;;) { break; }