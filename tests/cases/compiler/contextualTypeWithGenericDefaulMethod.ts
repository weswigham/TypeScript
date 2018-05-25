interface IProcess<X, Y> {
  start(): X;
  process(opt: [X]): Y;
  finish(opt: [Y]): void;
}

function foo<X, Y>(desc: IProcess<X, Y>): void {
  const x = desc.start();
  const y = desc.process([x]);
  desc.finish([y]);
}

foo({
  start() {
    return {
      name: "Joe"
    };
  },
  process([x]) {
    return x.name;
  },
  finish([x]) {
    console.log(x);
  }
});