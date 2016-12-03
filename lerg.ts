
//let expression = "1"; // Atom: Int, Evaluate: return the value!
//let expression = "(+ 1 2)";
//let expression = "(print 1234)";
//let expression = "(var junk 15)";

let expression = `
    (print "Erg-List Version \\"0.0.1\\"")
    (var junk 15)
    (print junk)
    (set junk 12)
    (print junk)
    (print 123)`;

// let expression = `(print (+ 4 5))`
//let expression = `(print "Hello World!")`

//let expression = "(print (+ 4 5 6 7 8 9))";

let DEBUG = false;

/*
    Notes
    - Parsing essentially needs to generate a list of lists of lists ad infinitum
      and those lists are then "evaluatable"
      This would be the same with evaluated stuff like func (of def for definition
      of a function... anything that is contained in the rest of the list 
      will have been parsed but will need to be evaluated AT THE TIME
      of execution... So should all top level code in the file..
    
    TODO
        - var/let/set style setting of a value...

 */
enum AtomType {
    None,

    Symbol,
    
    Integer,
    Decimal,
    Boolean,
    String, // TOOD symbol?
    List,
    Code
}

class Atom {
    Type: AtomType;
    // TODO try and make this type restricted?
    Data: any; // int, deimal, boolean, string, list, code etc...
    IsData?: Boolean = false;
}

class TokenInfo {
    index: number;
    line: number;
    col: number;
}

let isObj = (o) => { return Object.prototype.toString.call(o) === "[object Object]";};

function parse(expression: string) {
    let i = 0;
    let next = () => { return expression[i++]; };
    let it : Atom[] = []; //{ Type: AtomType.None, Data: null};
    let top = it;
    let parentStack = [it];

    let c = null;
    let hasDataIndicator = false;

    let parseInteger = () => {
        i--; // Keeps while loop consistent...

        let wholeNumber = '';
        while ((c = next()) !== undefined) {        
            let asN = parseInt(c, 10);
            if (isNaN(asN)) break;
            wholeNumber += c;
        }

        i--; // Move back a char so next sections next() call will be on current char
        return wholeNumber;
    }

    let parseSymobol = () => {
        i--;

        let wholeWord = '';
        // TODO check the ranges!!! esp the numbers :o)
        while ((c = next()) !== undefined && 
               ((c >= '0' && c <= '9') || 
                (c >= 'a' && c <= 'z') || 
                (c >= 'A' && c <= 'Z'))) 
        {
            wholeWord += c;
        }

        i--;
        return wholeWord;
    };

    let parseString = () => {
        //i--; skip the first "

        let wholeWord = '';
        // TODO check the ranges!!! esp the numbers :o)
        let isEscaping = false;
        while ((c = next()) !== undefined && (isEscaping || !isEscaping && c !== '"')) {
            if (c == '\\') {
                isEscaping = true;
                continue;
            } else if(isEscaping === true) {
                isEscaping = false; // we ought to be adding our escaped char this iteration. So reset ...
            }

            wholeWord += c;
        }

        // i--; skip the final quote
        return wholeWord;
    };

    let tokenInfo = () => {
        let result = new TokenInfo();
        result.index = i;
        result.line = 1;
        result.col = i;

        return result;
    };

    while ((c = next()) !== undefined) {
// TODO this needs to be ignored if in a string literal
        if (c === ' ' || c === '\t' || c === '\n') continue;

        switch (c) {
            // Integer
            // TODO decimal/float... 
            //

            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8': 
            case '9':
            {
                it.push({
                    Type: AtomType.Integer,
                    Data: parseInteger(),
                    IsData: true
                });

                continue;
            }
        }

        // String literal
        //

        if (c === '\"') {
            it.push({
                Type: AtomType.String,
                Data: parseString(),
                IsData: true
            });

            continue;
        }

        // List/Code
        //

        // TODO test this list literal stuff?
        if (c == "'") {
            hasDataIndicator = true;
            continue;
        }

        if (c === '(') {
            it.push({
                Type: hasDataIndicator ? AtomType.List : AtomType.Code,
                Data: [],
            });

            if (hasDataIndicator) it[it.length -1].IsData = true;

            parentStack.push(it);
            it = it[it.length - 1].Data;

            hasDataIndicator = false;
            continue;
        }

        if (c === ')') {
            it = parentStack.pop();
            continue;
        }

        // Special Symbols
        // 

        switch (c) {
            // TODO need to validate that the parent has no entries? otherwise
            //  it is really invalid structure isn't it? unless the 
            //  special char is a function, being passed to another function?
            case '+':
            case '-':
            case '/':
            case '*': 
            {
                // TODO need to find the symbol... what is it? a 
                //  function? if so then it needs to have the subsequent
                //  items parsed to it...
                it.push({
                    Type: AtomType.Symbol,
                    Data: c
                });

                continue;
            }
        }

        // Symbols
        // 

        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')){
            it.push({
                Type: AtomType.Symbol,
                Data: parseSymobol()
            });
            continue;
        }

        throw new Error("Unexpected Token " + c + "::: " + JSON.stringify(tokenInfo()));
        // TODO hasDataIndicator must be turned off!
    }

    return it;
}

// TODO functions either should take 1 argument or two? how 
//  do we tell the calling code of the below list that the
//  functions below can take 1 or two arguments? just because
//  the user gives 3 arguments to print? what should happen?

/*
    This stuff must either be JavaScript functions or atoms containing
    code or data.... so we can distinguish between atoms and functions
    and anything else is likely data???
 */
let globalScopeSymbols = {
    // Native Code for Execution
    //
    '+': (a, b) => { return a + b},
    '-': (a, b) => a - b,
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