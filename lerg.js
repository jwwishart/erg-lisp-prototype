//let expression = "1"; // Atom: Int, Evaluate: return the value!
//let expression = "(+ 1 2)";
//let expression = "(print 1234)";
//let expression = "(var junk 15)";
// let expression = `
//     (var junk 15)
//     (print junk)
//     (set junk 12)
//     (print junk)
//     (print 123)`;
// TODO below errors... allocation failed: out of mem??? :oO
var expression = "(print (+ 4 5))";
//let expression = "(print (+ 4 5 6 7 8 9))";
var DEBUG = false;
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
var AtomType;
(function (AtomType) {
    AtomType[AtomType["None"] = 0] = "None";
    AtomType[AtomType["Symbol"] = 1] = "Symbol";
    AtomType[AtomType["Integer"] = 2] = "Integer";
    AtomType[AtomType["Decimal"] = 3] = "Decimal";
    AtomType[AtomType["Boolean"] = 4] = "Boolean";
    AtomType[AtomType["String"] = 5] = "String";
    AtomType[AtomType["List"] = 6] = "List";
    AtomType[AtomType["Code"] = 7] = "Code";
})(AtomType || (AtomType = {}));
var Atom = (function () {
    function Atom() {
        this.IsData = false;
    }
    return Atom;
}());
var isObj = function (o) { return Object.prototype.toString.call(o) === "[object Object]"; };
function parse(expression) {
    var i = 0;
    var next = function () { return expression[i++]; };
    var it = []; //{ Type: AtomType.None, Data: null};
    var top = it;
    var parentStack = [it];
    var c = null;
    var hasDataIndicator = false;
    var parseInteger = function () {
        i--; // Keeps while loop consistent...
        var wholeNumber = '';
        while ((c = next()) !== undefined) {
            var asN = parseInt(c, 10);
            if (isNaN(asN))
                break;
            wholeNumber += c;
        }
        i--; // Move back a char so next sections next() call will be on current char
        return wholeNumber;
    };
    var parseSymobol = function () {
        i--;
        var wholeWord = '';
        // TODO check the ranges!!! esp the numbers :o)
        while ((c = next()) !== undefined && ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))) {
            wholeWord += c;
        }
        i--;
        return wholeWord;
    };
    while ((c = next()) !== undefined) {
        // TODO this needs to be ignored if in a string literal
        if (c === ' ' || c === '\t' || c === '\n')
            continue;
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
        // List/Code
        //
        if (c == "'") {
            hasDataIndicator = true;
            continue;
        }
        if (c === '(') {
            it.push({
                Type: hasDataIndicator ? AtomType.List : AtomType.Code,
                Data: []
            });
            if (hasDataIndicator)
                it[it.length - 1].IsData = true;
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
        // TODO must be a-zA-Z then a-zA-Z0-9...
        it.push({
            Type: AtomType.Symbol,
            Data: parseSymobol()
        });
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
var globalScopeSymbols = {
    // Native Code for Execution
    //
    '+': function (a, b) { return a + b; },
    '-': function (a, b) { return a - b; },
    '/': function (a, b) { return a / b; },
    '*': function (a, b) { return a * b; },
    'print': function (text) {
        if (Object.prototype.hasOwnProperty.call(text, 'Type') &&
            Object.prototype.hasOwnProperty.call(text, 'Data') &&
            text.Type === AtomType.Symbol) {
            var val = findInScope(text.Data);
            if (val != null) {
                console.log(val);
                return;
            }
        }
        // TODO handle error situations from above
        // TOOD handle other types passed in...?
        // Else consider the text to be ... well text!
        console.log(text);
    },
    'var': function (name, value) {
        // If we were passed a symbol Atom for name then we need to
        // just get the symbol name, we have the value as 2nd arg
        if (Object.prototype.hasOwnProperty.call(name, 'Type') &&
            Object.prototype.hasOwnProperty.call(name, 'Data') &&
            name.Type === AtomType.Symbol) {
            name = name.Data;
        }
        // TODO what if value is an Atom? should throw?
        scope()[name] = value;
    },
    'set': function (name, value) { globalScopeSymbols.var(name, value); }
};
var _scopes = [
    globalScopeSymbols
];
var scope = function () { return _scopes[_scopes.length - 1]; };
var findInScope = function (symbol) {
    for (var i = _scopes.length - 1; i >= 0; i--) {
        var val = _scopes[i][symbol];
        if (val != null)
            return val;
    }
    return null;
};
var dumpScope = function () {
    console.log(_scopes);
};
function evaluate(parsed) {
    DEBUG && console.log(JSON.stringify(parsed));
    function internalEvaluate(parsed) {
        // Symbol ???
        if (parsed.Type === AtomType.Symbol) {
            var val = findInScope(parsed.Data);
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
            var args = [];
            // parsed.Data.length - 1;
            // TODO we ought to validate that the first thing is a symbol?
            // NOTE we don't parse the first symbol
            for (var i_1 = 1; i_1 < parsed.Data.length; i_1++) {
                // Have to let the function evaluate the symbol if it
                // needs to... the function might need to create the 
                // symbol in scope (var,set) or evaluate it (print)
                if (parsed.Data[i_1].Type == AtomType.Symbol) {
                    args.push(parsed.Data[i_1]);
                    continue;
                }
                args.push(internalEvaluate(parsed.Data[i_1]));
            }
            //console.log("Symbol: " + JSON.stringify(parsed.Data[0]));
            var method = globalScopeSymbols[parsed.Data[0].Data]; // symbol! .. .?
            return method.apply(globalScopeSymbols, args);
        }
    }
    for (var i = 0; i < parsed.length; i++) {
        // Raw Integer
        var val = internalEvaluate(parsed[i]);
        if (val === undefined)
            continue;
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
evaluate(parse(expression));
//  );
DEBUG && dumpScope();
//# sourceMappingURL=lerg.js.map