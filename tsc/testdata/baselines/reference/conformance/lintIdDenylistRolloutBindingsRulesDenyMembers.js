//// [tests/cases/conformance/lint/rules/id-denylist/lintIdDenylistRolloutBindingsRulesDenyMembers.ts] ////

//// [input.ts]
obj.bad; obj.bad(); obj.bad = 1; obj.bad++; for (obj.bad of values) {}

//// [input.ts]
obj.bad; obj.bad(); obj.bad = 1; obj.bad++; for (obj.bad of values) {}
