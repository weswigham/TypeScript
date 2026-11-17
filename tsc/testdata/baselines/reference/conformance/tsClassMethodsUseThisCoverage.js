//// [tests/cases/conformance/lint/rules/class-methods-use-this/tsClassMethodsUseThisCoverage.ts] ////

//// [input.ts]
class InstanceMethods {
    value = 1;
    unusedInstance() { return 2; }
    unusedArrow = () => 3;
    usedInstance() { return this.value; }
    lexicalInstance() { return () => this.value; }
    usedArrow = () => this.value;
    static validStatic() { return 4; }
}
export {};

//// [input.ts]
class InstanceMethods {
    value = 1;
    unusedInstance() { return 2; }
    unusedArrow = () => 3;
    usedInstance() { return this.value; }
    lexicalInstance() { return () => this.value; }
    usedArrow = () => this.value;
    static validStatic() { return 4; }
}
export {};
