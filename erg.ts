/// <reference path="src/util.ts" />
/// <reference path="src/parser.ts" />
/// <reference path="src/evaluator.ts" />



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


//print(
    evaluate(parse(expression))
  //  );

  DEBUG && dumpScope();