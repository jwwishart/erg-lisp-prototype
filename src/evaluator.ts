
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
    'println' :(it) => {
        if (it instanceof String) {
            console.log(it);
            return;
        }
        if (it instanceof Number) {
            console.log(it);
            return;
        }

        // TODO(jwwishart) We need to handle symbols specially... we need to handle
        //  lists specially... we need to handle code specially... ? what else.. otherwise
        //  it can just print it as raw thingy... (quoted lists? quoted anything? how
        //  is quoted identified?)
        console.error("NOOOO! What is this!: ");
        console.error(it);
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

function evaluate(parsed: any) {
    let last = undefined;

    // TODO this is final result printing NOT evaluation!!!!
    function printExpression(expression, isFirst) {
        let item = findInScope(expression);

        // Functions
        if (isFirst && item != null && isFunction(item)) {
            return "#<procedure:global." + expression + ">";
        }

        // Lists
        if (isArray(expression)) {
            // TODO need to recursively print the parsed form out not just
            //   JSON.stringify, and print () not []
            return "" + JSON.stringify(expression) + '';
        } else if (isArray(expression) && expression.isQuoted === true) {
            // TODO need to recursively print the parsed form out not just
            //   JSON.stringify, and print () not []
            return "'" + JSON.stringify(expression) + '';
        }
        return expression;
    }

    // Parse Each Top Level Expression
    for(var i = 0; i < parsed.length; i++) {
        let isFirst = i == 0;

        last = printExpression(parsed[i], isFirst);
    }

    // TODO printExpression() ought be called here on the last evaluated expression?
    //  OR should all expressions be evaluated and shown to the user in a REPL 
    //  situation?

    // Last thing evaluated is result? Sorta.
    return "=> " + (last === undefined ? "Unspecified" : last);
}

function _evaluate(parsed: Atom[]) {
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
