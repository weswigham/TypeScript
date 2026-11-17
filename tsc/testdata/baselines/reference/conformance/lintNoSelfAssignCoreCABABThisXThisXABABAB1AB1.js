//// [tests/cases/conformance/lint/rules/no-self-assign/lintNoSelfAssignCoreCABABThisXThisXABABAB1AB1.ts] ////

//// [input.ts]
a.b = a['b']; this.x = this.x; a.b = a?.b; a[b + 1] = a[b + 1];

//// [input.ts]
a.b = a['b']; this.x = this.x; a.b = a?.b; a[b + 1] = a[b + 1];
