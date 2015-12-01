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
