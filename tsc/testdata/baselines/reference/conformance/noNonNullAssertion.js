//// [tests/cases/conformance/lint/rules/no-non-null-assertion/noNonNullAssertion.ts] ////

//// [input.ts]
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

//// [input.ts]
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
