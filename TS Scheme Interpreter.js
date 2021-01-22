var GE = {};
var binaryops = ["+", "-", "*", "/", ">", "<", ">=", "<="].forEach(function (op) {
    GE[op] = function (x, y) { return eval(x + " " + op + " " + y); };
});
GE["remainder"] = function (x, y) { return x % y; };
GE["append"] = function (x, y) { return x.concat(y); };
GE["="] = function (x, y) { return JSON.stringify(x) === JSON.stringify(y); };
GE["equal?"] = GE["="];
GE["eq?"] = GE["="];
GE["list"] = function () {
    var x = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        x[_i] = arguments[_i];
    }
    return x;
};
GE["list?"] = function (potList) { return Array.isArray(potList); };
GE["length"] = function (list) { return list.length; };
GE["car"] = function (list) { return (list.length !== 0 ? list[0] : null); };
GE["cdr"] = function (list) { return (list.length > 1 ? list.slice(1) : null); };
GE["cons"] = function (x, y) { return [x].concat(y); };
GE["map"] = function (callfunc, list) { return list.map(callfunc); };
GE["apply"] = function (callfunc, args) { return callfunc.apply(null, args); };
GE["display"] = function (x) { return console.log(x); };
GE["not"] = function (x) { return (typeof x === "boolean" ? !x : null); };
var tokenize = function (input) {
    return input
        .replace(/(\()|(\))/g, function (_, a, b) {
        if (a) {
            return " " + a + " ";
        }
        else {
            return " " + b + " ";
        }
    })
        .replace(/\s+/g, " ")
        .replace(/^\s+|\s+$/g, "")
        .split(" ");
};
//regex tests////
// const ex1 = "     (   +     10  15  ) ".replace(/\s+/g, " ");
// console.log(ex1);
// const ex2 = ex1.replace(/^\s+|\s+$/g, "");
// console.log(ex2);
// const ex3 = ex2.split(" ");
// console.log(ex3);
var atomize = function (token) {
    var atom = Number(token);
    return isNaN(atom) ? token : atom;
};
var parse = function (tokens) {
    if (tokens.length === 0)
        throw Error("Error: Unexpected EOF. (missing a right paren?)");
    //caches first token, if left paren, continue to push all atomized tokens onto list until right paren is hit.
    var tok1 = tokens.shift();
    if (tok1 === "(") {
        var list = [];
        while (tokens[0] !== ")") {
            list.push(parse(tokens));
        }
        //discards last ")"
        tokens.shift();
        return list;
    }
    else if (tok1 === ")") {
        throw Error("Error: Unexpected )");
    }
    else {
        //returns all expressions to their most boiled down form. Should hit for all exps between parens.
        return atomize(tok1);
    }
};
// returns a new environment that will contain all key value pairs from the two environments being combined.
function updateEnv(enva, envb) {
    var newEnv = {};
    for (var key in enva) {
        newEnv[key] = enva[key];
    }
    for (var key in envb) {
        newEnv[key] = envb[key];
    }
    return newEnv;
}
//const matchString = /(^"(.*)"$) | (^'(.*)'$)/;
function evaluate(s, env) {
    if (env === void 0) { env = GE; }
    //variable reference
    if (typeof s === "string") {
        if (env[s] === undefined)
            throw Error("Error: Unbound variable: " + s);
        return env[s];
        //if number, just return it.
    }
    else if (typeof s === "number") {
        return s;
        //similar to number, just return what should be quoted
    }
    else if (s[0] === "quote") {
        return s[1];
    }
    else if (s[0] === "if") {
        var _ = s[0], test = s[1], conseq = s[2], altern = s[3];
        var exp = evaluate(test, env) ? conseq : altern;
        return evaluate(exp, env);
    }
    else if (s[0] === "define") {
        var _ = s[0], name_1 = s[1], exp = s[2];
        env[name_1] = evaluate(exp, env);
    }
    else if (s[0] === "set!") {
        var _ = s[0], name_2 = s[1], exp = s[2];
        if (env[name_2]) {
            env[name_2] = evaluate(exp, env);
        }
        else {
            throw Error("Error: " + name_2 + " is not bound.");
        }
        //proc creation
    }
    else if (s[0] === "lambda") {
        var _ = s[0], params_1 = s[1], func_1 = s[2];
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var tmpEnv = {};
            args.forEach(function (val, key) { return (tmpEnv[params_1[key]] = val); }); //creates a new frame within tmpEnv for params->args
            return evaluate(func_1, updateEnv(env, tmpEnv));
        };
    }
    else if (s[0] === "begin") {
        var _ = s[0], exps = s.slice(1);
        return exps.map(function (exp) { return evaluate(exp, env); }).pop();
    }
    else {
        //procedure call
        var _a = s.map(function (exp) { return evaluate(exp, env); }), op = _a[0], args = _a.slice(1);
        if (typeof op !== "function")
            throw Error("Error: " + s[0] + " is not a function");
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
