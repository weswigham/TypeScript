type function StringConcat(a: ts.StringLiteralType, b: ts.StringLiteralType) {
    this;
    return this.createLiteralType(a.value + b.value);
}
  
type Res = StringConcat<"hello", "world">;

const x = [].push;