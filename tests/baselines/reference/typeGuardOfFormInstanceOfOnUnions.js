//// [typeGuardOfFormInstanceOfOnUnions.ts]
class Cube {
    private __cube: void;
    sides = 6;
    constructor(public length: number) {}
}

class Polygon {
    private __polygon: void;
    sides: number;
}

class Square extends Polygon {
    private __square: void;
    sides = 4;
    constructor(public length: number) { super(); }
}

class Rectangle extends Polygon {
    private __rectangle: void;
    sides = 4;
    constructor(public length: number, public width: number) { super(); }
}

class Triangle extends Polygon {
    private __triangle: void;
    sides = 3;
    constructor(public base: number, public height: number) { super(); }
}


function calculateArea1(shape: (Square | Rectangle | Triangle)) : number {
    if(shape instanceof Square) {
        return shape.length * shape.length;
    }
    else if(shape instanceof Rectangle) {
        return shape.length * shape.width;
    }
    else if(shape instanceof Triangle) {
        return (shape.base * shape.height) / 2;
    }
}

function calculateArea2(shape: (Square | Rectangle | Triangle)) : number {
    if(shape instanceof Square) {
        return shape.length * shape.length;
    }
    else if(shape instanceof Rectangle) {
        return shape.length * shape.width;
    }
    else {
        return (shape.base * shape.height) / 2;
    }
}

function calculateArea3(shape: (Square | Rectangle | Triangle | Cube)) : number {
    if (shape instanceof Polygon) {
        if (shape instanceof Square) {
            return shape.length * shape.length;
        }
        else if (shape instanceof Rectangle) {
            return shape.length * shape.width;
        }
        else {
            return (shape.base * shape.height) / 2;
        }
    }
    else {
        return shape.length * shape.length * 6;
    }
}

function calculateArea4(shape: (Square | Rectangle | Triangle | Cube)) : number {
    if (!(shape instanceof Polygon)) {
        return shape.length * shape.length * 6;
    }
    else {
        if (shape instanceof Square) {
            return shape.length * shape.length;
        }
        else if (shape instanceof Rectangle) {
            return shape.length * shape.width;
        }
        else {
            return (shape.base * shape.height) / 2;
        }
    }
}

function calculateArea5(shape: (Polygon | Cube)) : number {
    if (shape instanceof Polygon) {
        if (shape instanceof Square) {
            return shape.length * shape.length;
        }
        else if (shape instanceof Rectangle) {
            return shape.length * shape.width;
        }
        else if (shape instanceof Triangle) {
            return (shape.base * shape.height) / 2;
        }
    }
    else {
        return shape.length * shape.length * 6;
    }
}


//// [typeGuardOfFormInstanceOfOnUnions.js]
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Cube = (function () {
    function Cube(length) {
        this.length = length;
        this.sides = 6;
    }
    return Cube;
})();
var Polygon = (function () {
    function Polygon() {
    }
    return Polygon;
})();
var Square = (function (_super) {
    __extends(Square, _super);
    function Square(length) {
        _super.call(this);
        this.length = length;
        this.sides = 4;
    }
    return Square;
})(Polygon);
var Rectangle = (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle(length, width) {
        _super.call(this);
        this.length = length;
        this.width = width;
        this.sides = 4;
    }
    return Rectangle;
})(Polygon);
var Triangle = (function (_super) {
    __extends(Triangle, _super);
    function Triangle(base, height) {
        _super.call(this);
        this.base = base;
        this.height = height;
        this.sides = 3;
    }
    return Triangle;
})(Polygon);
function calculateArea1(shape) {
    if (shape instanceof Square) {
        return shape.length * shape.length;
    }
    else if (shape instanceof Rectangle) {
        return shape.length * shape.width;
    }
    else if (shape instanceof Triangle) {
        return (shape.base * shape.height) / 2;
    }
}
function calculateArea2(shape) {
    if (shape instanceof Square) {
        return shape.length * shape.length;
    }
    else if (shape instanceof Rectangle) {
        return shape.length * shape.width;
    }
    else {
        return (shape.base * shape.height) / 2;
    }
}
function calculateArea3(shape) {
    if (shape instanceof Polygon) {
        if (shape instanceof Square) {
            return shape.length * shape.length;
        }
        else if (shape instanceof Rectangle) {
            return shape.length * shape.width;
        }
        else {
            return (shape.base * shape.height) / 2;
        }
    }
    else {
        return shape.length * shape.length * 6;
    }
}
function calculateArea4(shape) {
    if (!(shape instanceof Polygon)) {
        return shape.length * shape.length * 6;
    }
    else {
        if (shape instanceof Square) {
            return shape.length * shape.length;
        }
        else if (shape instanceof Rectangle) {
            return shape.length * shape.width;
        }
        else {
            return (shape.base * shape.height) / 2;
        }
    }
}
function calculateArea5(shape) {
    if (shape instanceof Polygon) {
        if (shape instanceof Square) {
            return shape.length * shape.length;
        }
        else if (shape instanceof Rectangle) {
            return shape.length * shape.width;
        }
        else if (shape instanceof Triangle) {
            return (shape.base * shape.height) / 2;
        }
    }
    else {
        return shape.length * shape.length * 6;
    }
}
