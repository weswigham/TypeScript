//// [tests/cases/conformance/lint/rules/no-cond-assign/noCondAssignDefault.ts] ////

//// [input.ts]
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

//// [input.ts]
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
