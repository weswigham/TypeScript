declare namespace ts {
    export interface FunctionContext {
        createLiteralType(value: string): StringLiteralType;
        createLiteralType(value: number): NumberLiteralType;
        createLiteralType(value: string | number): StringLiteralType | NumberLiteralType;
    }
    export type Type = StringLiteralType | NumberLiteralType;
    export interface TypeBase {
        readonly kind: Type["kind"];
    }
    export interface StringLiteralType extends TypeBase {
        readonly kind: "stringliteral";
        readonly value: string;
    }
    export interface NumberLiteralType extends TypeBase {
        readonly kind: "numberliteral";
        readonly value: number;
    }
}