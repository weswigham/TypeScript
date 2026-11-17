//// [tests/cases/conformance/lint/rules/no-dupe-class-members/lintNoDupeClassMembersCoreSyntaxBClassDuplicates.ts] ////

//// [input.ts]
class Item { value; value() {} static value() {} get pair() {} set pair(value) {} get pair() {} #value; }

//// [input.ts]
class Item { value; value() {} static value() {} get pair() {} set pair(value) {} get pair() {} #value; }
