/// <reference path="src/util.ts" />
/// <reference path="src/read.ts" />
/// <reference path="src/print.ts" />
/// <reference path="src/eval.ts" />



//let expression = "1"; // Atom: Int, Eval
//let expression = "1"; // Atom: Int, Evaluate: return the value!
//let expression = "(+ 1 2)";
//let expression = "(print 1234)";
//let expression = "(var junk 15)";

// let expression = `
//     (print "Erg-List Version \\"0.0.1\\"")
//     (var junk 15)
//     (print junk)
//     (set junk 12)
//     (print junk)
//     (print 123)`;

//let expression = `(print (+ 4 5))`

let expression = `(println 5)`;

// let expression = `
//     (var a 235)
//     (println (+ 4 a))`; // UPTO need to get a's value AS it's type!!!

//let expression = `(print "Hello World!")`
//let expression = "(print (+ 4 5 6 7 8 9))";


// TODO define code atoms (functions) that take arguments
// TODO define 'add' as (+ a b)
// TODO comments...


DEBUG = true;


//var expList = read(expression);
//console.log(print(expList));

//for (var i in expList) {
//    print(expList[i]);
//    console.log(expList[i]);
//}


// Parsing Tests
//

var expressions = [
    // `1`,
    // `"Hello World"`,
    // `42`,
    // `3.14159`,
    // `+`,
    // `()`,
    // `'(a b c d)`,
    // `(+ 1 2)`,
    // `(print "Hello World")`,
    // `(print (+ 1 2))`,
    // `'(print (+ 1 2))`,
    `(print '(+ 1 2))`,
    //`(var duck "quack")`,
];

//write("=> " + print(eval(read(expressions[9]))));
//throw new Error("just stop would you");

for (var i = 0; i < expressions.length; i++) {
    // Print the Parsed Expression (first one only... remember parse() returns
    // a list... we don't want to parse the list to the print() method...
    
write("p> " + print(read(expressions[i])[0]));
write("=> " + print(eval(read(expressions[i]))));
    
    //console.log(parse(expressions[i]));
    //console.log(evaluate(parse(expressions[i])));
    //console.log(print(parse(expressions[i])));
}

// print(evaluate(parse(expression)));

// DEBUG && dumpScope();