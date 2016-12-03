

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

let expression = `
    (var a 235)
    (print (+ 4 a))`; // UPTO need to get a's value AS it's type!!!

//let expression = `(print "Hello World!")`
//let expression = "(print (+ 4 5 6 7 8 9))";


// TODO define code atoms (functions) that take arguments
// TODO define 'add' as (+ a b)
// TODO comments...

let DEBUG = false;


// TODO functions either should take 1 argument or two? how 
//  do we tell the calling code of the below list that the
//  functions below can take 1 or two arguments? just because
//  the user gives 3 arguments to print? what should happen?

/*
    This stuff must either be JavaScript functions or atoms containing
    code or data.... so we can distinguish between atoms and functions
    and anything else is likely data???
 */
/*
    print requires the argumets to be evaluated... the code 
    calling the print function ought to know what to send it...

    val/set requires the first argument to be an atom? so
    the calling code needs to know that it must pass an atom...
    in the case of this it is a symbol so it needs to send the symbol
    name?
 */
/*
    Esssentially we have here identifiers? which are considered to be of 
    various types possibly?
    
    - functions to be executed...
        - need arguments list
        - need statements for the body... ?
            - javascript function?
            - lisp code list?
        - need to designate the return type...
            - null?
            - Atom of some type? why?
            - value: string, int, object etc..
        - needs to have the actual implementation if necessary
    - data: simple identifier(symbol) and value... i.e. memory locations
        - need the data type of it currently...
        - indicator as to whether it is changeable or no?
    - 
 */

enum SymbolType {
    Function, // Actual JavaScript function...
    Data
}

let globalScopeSymbols = {
    // Native Code for Execution
    //
    '-': { 
        Type: SymbolType.Function,
        Arguments: [{
            Name: 'a',
            Type: AtomType.Integer
        },{
            Name: 'b',
            Type: AtomType.Integer
        },],
        ReturnType: AtomType.Integer,
        Data: (a, b) => { return a + b}
    },

    'printf': { 
        Type: SymbolType.Function,
        Arguments: [{
            Name: 'a',
            Type: AtomType.String
        }],
        ReturnType: AtomType.Integer,
        Data: (a) => {  console.log(a) }
    },

    '+': (a, b) => a + b,
    '/': (a, b) => a / b,
    '*': (a, b) => a * b,
    'print' : (text) => {
        if (Object.prototype.hasOwnProperty.call(text, 'Type') && 
            Object.prototype.hasOwnProperty.call(text, 'Data') &&
            text.Type === AtomType.Symbol) 
        {
            let val = findInScope(text.Data);
            if (val != null) {
                console.log(val);
                return;
            }
        }

        // TODO handle error situations from above
        // TOOD handle other types passed in...?
        // Else consider the text to be ... well text!
        console.log(text) 
    },
    'var': function(name: any, value) {
        // If we were passed a symbol Atom for name then we need to
        // just get the symbol name, we have the value as 2nd arg
        if (Object.prototype.hasOwnProperty.call(name, 'Type') && 
            Object.prototype.hasOwnProperty.call(name, 'Data') &&
            name.Type === AtomType.Symbol) 
        {
            name = name.Data;
        }

        // TODO what if value is an Atom? should throw?
        scope()[name] = value; 
    },
    'set': function(name, value) { globalScopeSymbols.var(name, value); }
};

let _scopes = [
    globalScopeSymbols
]

let scope = () => _scopes[_scopes.length - 1]; 
let findInScope = (symbol) => {
    for (var i = _scopes.length - 1; i >= 0; i--) {
        let val = _scopes[i][symbol];
        if (val != null) return val;
    }

    return null;
}

let dumpScope = () => {
    console.log(_scopes);
}

function evaluate(parsed: Atom[]) {
    DEBUG && console.log(JSON.stringify(parsed));

    function internalEvaluate(parsed: Atom) {
        // Symbol ???
        if (parsed.Type === AtomType.Symbol) {
            let val = findInScope(parsed.Data);
            if (val == null) {
                // TODO this is wrong for evaluation.... 
                // TODO parsing should consider this...
                return parsed.Data; // Can't find the symbol so just return the symbol
            }
            return val;
        }
        
        if (parsed.IsData) {
             if (parsed.Type == AtomType.Integer) {
                 return parseInt(parsed.Data, 10);
             }
             // TODO other types of data need to be cast propertly
             return parsed.Data;
        }
        
        if (parsed.Type == AtomType.Code) {
            let args = [];
            // parsed.Data.length - 1;

            // TODO we ought to validate that the first thing is a symbol?

            // NOTE we don't parse the first symbol
            for (let i = 1; i < parsed.Data.length; i++) {
                // Have to let the function evaluate the symbol if it
                // needs to... the function might need to create the 
                // symbol in scope (var,set) or evaluate it (print)
                if (parsed.Data[i].Type == AtomType.Symbol) {
                    args.push(parsed.Data[i]);
                    continue;
                }

                args.push(internalEvaluate(parsed.Data[i]));
            }
//console.log("Symbol: " + JSON.stringify(parsed.Data[0]));
            let method = globalScopeSymbols[parsed.Data[0].Data]; // symbol! .. .?
            return method.apply(globalScopeSymbols, args); 
            // Evaluate from right to left...
        }
    }

    for (var i = 0; i < parsed.length; i++) {
        // Raw Integer
        let val = internalEvaluate(parsed[i]);
        if (val === undefined) continue;

        console.log(val);
    }

    //console.log("TODO write evaluate()");
    return parsed;
}

// function print(results) {
//     if (results === null) {
//         console.log("null");
//         return;
//     }

//     if (results === undefined) {
//         console.log("undefined");
//         return;
//     }

//     if (results.length) {
//         console.log('[');
//         for (var i = 0; i < results.length; i++) {
//             print(results[i]);
//             console.log(',');
//         }
//         console.log(']');
//         return;
//     }

//     if (isObj(results)) {
//         console.log('{');
//         for (var p in results) {
//             if (Object.prototype.hasOwnProperty.call(results, p)) {
//                 console.log('"' + p + '": ');
//                 print(results[p]);
//                 console.log(',');
//             }
//         }
//         console.log('}');   
//         return;
//     }
// }

//print(
    evaluate(parse(expression))
  //  );

  DEBUG && dumpScope();