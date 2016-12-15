
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

let GlobalScope = {
    '+': (a, b) => {
        // TODO(jwwishart) is this right... take the atom and convert it to other atoms?
        //  this whole idea seems strange... more reasonable that this stuff has
        //  no knowledge of this and simple returns the type and the code figures it all out
        //  BUT this is simpler... and this stuff would be evaluated in lisp generally ?????

        // TODO(jwwishart) type restrictions? how to specify restriction of types?
        // TODO(jwwishart) assert a and b are numbers or strings or ??? 
        return new AtomNumber(a.Data + b.Data);
    },
    'print': (toPrint) => {
        if (toPrint.length) {
            console.error("ERROR: print() passed an array... can only print strings or primitives");
            return null;
        }

        // TODO(jwwishart) again Atom passed in... 
        // TODO(jwwishart) could be all sorts of things passed in... just strings???
        console.log(toPrint.Data)
    }
};

let _scopes = [
    GlobalScope
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

function write(it: any) {
    // TODO(jwwishart) this writes to standard output...
    console.log(it);
}

class UnspecifiedAtom extends Atom {
    constructor() {
        super(AtomType.Unspecified, null, false);
    }
}


function eval(toEval: any) {
    var last = new UnspecifiedAtom();

    // Array of Expressions: eval each one one after another
    //

    if (toEval.Type == null && toEval.length > 0) {
        for (let i = 0; i < toEval.length; i++) {
            last = eval(toEval[i]);
        }
    }

    // Primitives
    // Essentially we just return them... we only evaluate lists that are code essentially
    //

    if ((toEval.Type === AtomType.Boolean 
         || toEval.Type === AtomType.Number
         || toEval.Type === AtomType.String
         || toEval.Type === AtomType.Symbol)) 
    {
        return toEval;
    }

    // Lists (quoted) just return as data;
    //

    if (toEval.Type === AtomType.List && toEval.IsQuoted) {
        return toEval;
    }

    // Lists: evaluate as procedures
    //

    if (toEval.Type === AtomType.List) {
        // Empty list, just return it.
        if (toEval.length === 0) {
            return toEval;
        }

        let operator = toEval[0];
        let args = [];

        let func = findInScope(operator.Data);
        if (func == null) {
            // Special Forms
            last = handleSpecialForms(toEval);

            console.error("ERROR: Unable to find procedure: '" + operator.Data + "'");
        }

        if (toEval.length > 1) {
            args = toEval.slice(1);
            for (let j = 0; j < args.length; j++) {
                args[j] = eval(args[j]);
            }
        }

        last = func.apply(scope(), args);
        
        if (last == null) last = new UnspecifiedAtom();
        
        // TODO(jwwishart) convert to atom?
        //
        // - number
        // - string
        // - symbol????? can you return symbols???
        // - lists (data or quoted?)
        // 
    }

    return last;
}

function handleSpecialForms(toEval) {
    // define/let
    // or/and
    // if else
    
}


