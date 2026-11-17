//// [tests/cases/conformance/lint/rules/dot-notation/tsDotNotationFinalOwnership.ts] ////

//// [input.ts]
class Owner {
    private value = 1;
    protected count = 2;
    read() { return this['value'] + this['count']; }
}
declare const object: { value: number } | null;
object?.['value'];
declare const record: Record<string, number>;
record['other'];
record['not an identifier'];

//// [input.ts]
class Owner {
    private value = 1;
    protected count = 2;
    read() { return this.value + this.count; }
}
declare const object: { value: number } | null;
object?.value;
declare const record: Record<string, number>;
record.other;
record['not an identifier'];
