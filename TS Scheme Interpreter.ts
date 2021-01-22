const GE = {};

const binaryops = ["+", "-", "*", "/", ">", "<", ">=", "<="].forEach((op) => {
  GE[op] = (x, y) => eval(`${x} ${op} ${y}`);
});
GE["remainder"] = (x, y) => x % y;
GE["append"] = (x, y) => x.concat(y);
GE["="] = (x, y) => JSON.stringify(x) === JSON.stringify(y);
GE["equal?"] = GE["="];
GE["eq?"] = GE["="];
GE["list"] = (...x) => x;
GE["list?"] = (potList) => Array.isArray(potList);
GE["length"] = (list) => list.length;
GE["car"] = (list) => (list.length !== 0 ? list[0] : null);
GE["cdr"] = (list) => (list.length > 1 ? list.slice(1) : null);
GE["cons"] = (x, y) => [x].concat(y);
GE["map"] = (callfunc, list) => list.map(callfunc);
GE["apply"] = (callfunc, args) => callfunc.apply(null, args);
GE["display"] = (x) => console.log(x);
GE["not"] = (x) => (typeof x === "boolean" ? !x : null);

const tokenize = (input: string) =>
  input
    .replace(/(\()|(\))/g, (_, a, b) => {
      if (a) {
        return ` ${a} `;
      } else {
        return ` ${b} `;
      }
    })
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .split(" ");

//regex tests////
// const ex1 = "     (   +     10  15  ) ".replace(/\s+/g, " ");
// console.log(ex1);

// const ex2 = ex1.replace(/^\s+|\s+$/g, "");
// console.log(ex2);

// const ex3 = ex2.split(" ");
// console.log(ex3);

const atomize = (token) => {
  const atom = Number(token);
  return isNaN(atom) ? token : atom;
};

const parse = (tokens: Array<string>) => {
  if (tokens.length === 0)
    throw Error("Error: Unexpected EOF. (missing a right paren?)");

  //caches first token, if left paren, continue to push all atomized tokens onto list until right paren is hit.
  const tok1 = tokens.shift();
  if (tok1 === "(") {
    let list = [];
    while (tokens[0] !== ")") {
      list.push(parse(tokens));
    }
    //discards last ")"
    tokens.shift();
    return list;

  } else if (tok1 === ")") {
    throw Error("Error: Unexpected )");

  } else {
    //returns all expressions to their most boiled down form. Should hit for all exps between parens.
    return atomize(tok1);
  }
};

// returns a new environment that will contain all key value pairs from the two environments being combined.
function updateEnv(enva, envb) {

  const newEnv = {};
  for (let key in enva) {
    newEnv[key] = enva[key];
  }

  for (let key in envb) {
    newEnv[key] = envb[key];
  }

  return newEnv;
}

//const matchString = /(^"(.*)"$) | (^'(.*)'$)/;

function evaluate(s: string | number | Array<string>, env = GE) {
  //variable reference
  if (typeof s === "string") {
    if (env[s] === undefined) throw Error(`Error: Unbound variable: ${s}`);
    return env[s];

    //if number, just return it.
  } else if (typeof s === "number") {
    return s;

    //similar to number, just return what should be quoted
  } else if (s[0] === "quote") {
    return s[1];

  } else if (s[0] === "if") {
    const [_, test, conseq, altern] = s;
    const exp = evaluate(test, env) ? conseq : altern;
    return evaluate(exp, env);

  } else if (s[0] === "define") {
    const [_, name, exp] = s;
    env[name] = evaluate(exp, env);

  } else if (s[0] === "set!") {
    const [_, name, exp] = s;
    if (env[name]) {
      env[name] = evaluate(exp, env);
    } else {
      throw Error(`Error: ${name} is not bound.`);
    }

    //proc creation
  } else if (s[0] === "lambda") {
    const [_, params, func] = s;
    return (...args) => {
      const tmpEnv = {};
      args.forEach((val, key) => (tmpEnv[params[key]] = val)); //creates a new frame within tmpEnv for params->args
      return evaluate(func, updateEnv(env, tmpEnv));
    };

  } else if (s[0] === "begin") {
    const [_, ...exps] = s;
    return exps.map((exp) => evaluate(exp, env)).pop();

  } else {
    //procedure call
    const [op, ...args] = s.map((exp) => evaluate(exp, env));
    if (typeof op !== "function")
      throw Error(`Error: ${s[0]} is not a function`);

    return op.apply(null, args);
  }
}

////nested binary operators test
// console.log(evaluate(parse(tokenize('(+ 5 (- 3 (* 3 (/ 4 2))))'))))
// console.log(evaluate(parse(tokenize('(remainder 16 3)'))))

////define variable, cons and append test
// evaluate(parse(tokenize("(define L1 (cons 5 1))")));
// evaluate(parse(tokenize("(define k 37)")));
// evaluate(parse(tokenize('(define newList (append L1 k))')))
// console.log(evaluate(parse(tokenize('L1'))))
// console.log(evaluate(parse(tokenize('k'))))
// console.log(evaluate(parse(tokenize('newList'))))
// console.log(evaluate(parse(tokenize('(car newList)'))))
// console.log(evaluate(parse(tokenize('(cdr newList)'))))

// ////boolean tests
// console.log(evaluate(parse(tokenize('(list? (list 3 4 5))'))))             //true
// console.log(evaluate(parse(tokenize('(list? 12)'))))                       //false

// console.log(evaluate(parse(tokenize('(eq? (list 3 4 5) (list 3 4 5))')))) //true
// console.log(evaluate(parse(tokenize('(eq? (list 3 4 5) (list 3 5 5))')))) //false

// console.log(evaluate(parse(tokenize('(equal? (+ 99 1)(+ 54 46))'))))      //true
// console.log(evaluate(parse(tokenize('(equal? (+ 99 1)(+ 54 9810))'))))    //false

// console.log(evaluate(parse(tokenize('(= 15 (- 18 3))'))))                 //true
// console.log(evaluate(parse(tokenize('(= 15000 (* 13 6))'))))              //false

// ////map, apply tests
// console.log(evaluate(parse(tokenize('(map (lambda(x)(* x 3)) (list 1 2 3))'))))
// console.log(evaluate(parse(tokenize('(apply * (list 5 10))'))))

////procedure creation
// console.log(evaluate(parse(tokenize('(define double (lambda(x) (* x 2 )))'))))
// console.log(evaluate(parse(tokenize('(double 9)'))))

// ////if test
// console.log(evaluate(parse(tokenize('(if (= 5 (+ 3 2)) 0 1)'))))

// ////set! and begin test
// console.log(evaluate(parse(tokenize('(begin(define x 12) (display x))'))))
// console.log(evaluate(parse(tokenize('(begin (set! x 2) (display x))'))))

// ////quote test
// console.log(evaluate(parse(tokenize('(quote 15)'))))
