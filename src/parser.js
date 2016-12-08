// Types
//
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
var TokenInfo = (function () {
    function TokenInfo() {
    }
    return TokenInfo;
}());
var Symbol = (function () {
    function Symbol(name) {
        this._type = "symbol";
        this.name = name;
    }
    return Symbol;
}());
// Code
//
/*
    Parse the string that is given into the relevant type ready for evaluation
    1 = should generate 1 as a literal value (evalutes to itself
    (+ 1 2) = should generate a simple list with  + as a symbol, 1 and 2 as literals
        the parser
 */
function parse(code) {
    var i = 0;
    var results = []; // Array of expressions
    var next = function () { return code[i++]; };
    var c = null;
    var expression = null; // current list expression we are parsing goes in here till done?
    var listStack = null;
    var hasDataIndicator = false;
    var push = function (it) {
        // If we pushed a list then append to the list
        if (isArray(it)) {
            if (listStack == null) {
                listStack = [it];
            }
            else {
                listStack.push(it);
            }
            return;
        }
        // if we are in a list push the expression onto the end of the bottom most stack 
        if (listStack !== null) {
            listStack[listStack.length - 1].push(it);
            return;
        }
        results.push(it);
    };
    var completeList = function () {
        if (listStack !== null) {
            // TODO This ought not happen... ? why d owe need this?
            if (listStack.length === 0) {
                return;
            }
            // If at top of stack push list onto the results... expression done
            if (listStack.length === 1) {
                results.push(listStack[0]);
                listStack = null; // no more lists
                return;
            }
            // otherwise move the last list into it's parent list as it is done
            listStack[listStack.length - 2].push(listStack[listStack.length - 1]);
            listStack.splice(listStack.length - 1, 1);
            return;
        }
        throw new Error("we ought not get here... where is this list expected...?");
    };
    var parserNumber = function () {
        i--; // Keeps while loop consistent...
        var wholeNumber = '';
        var doneDecimal = false;
        while ((c = next()) !== undefined) {
            if (c === '.' && doneDecimal === false) {
                doneDecimal = true;
                wholeNumber += c;
                continue;
            }
            var asN = parseInt(c, 10);
            if (isNaN(asN))
                break;
            wholeNumber += c;
        }
        i--; // Move back a char so next sections next() call will be on current char
        if (doneDecimal) {
            return parseFloat(wholeNumber);
        }
        else {
            return parseInt(wholeNumber, 10);
        }
    };
    var parseString = function () {
        //i--; skip the first "
        var wholeWord = '';
        // TODO check the ranges!!! esp the numbers :o)
        var isEscaping = false;
        while ((c = next()) !== undefined && (isEscaping || !isEscaping && c !== '"')) {
            if (c == '\\') {
                isEscaping = true;
                continue;
            }
            else if (isEscaping === true) {
                isEscaping = false; // we ought to be adding our escaped char this iteration. So reset ...
            }
            wholeWord += c;
        }
        // i--; skip the final quote
        return wholeWord;
    };
    var parseSymbol = function () {
        i--;
        var wholeWord = '';
        // TODO check the ranges!!! esp the numbers :o)
        while ((c = next()) !== undefined &&
            ((c >= '0' && c <= '9') ||
                (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z'))) {
            wholeWord += c;
        }
        i--;
        return new Symbol(wholeWord);
    };
    while ((c = next()) !== undefined) {
        // TODO(jwwishart) ignore these characters if in a string literal?
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r')
            continue;
        switch (c) {
            // Integer
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
                    // TODO(jwwishart) decimal, bignumber, ratio
                    push(parserNumber());
                    continue;
                }
        }
        // String literal
        //
        if (c === '\"') {
            // TODO(jwwishart) escape characters
            push(parseString());
            continue;
        }
        // List/Code
        //
        // TODO(jwwishart) Quote...  convert to quoted expression without need for
        //  this stuff...
        if (c == "'") {
            hasDataIndicator = true;
            continue;
        }
        if (c === '(') {
            var toPush = [];
            if (hasDataIndicator) {
                toPush["isQuoted"] = true;
                hasDataIndicator = false;
            }
            push(toPush);
            continue;
        }
        if (c === ')') {
            completeList();
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
                    push(new Symbol(c));
                    continue;
                }
        }
        // Symbols
        // 
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            push(parseSymbol());
            continue;
        }
        var tokenInfo = function () {
            var result = new TokenInfo();
            result.index = i;
            result.line = 1;
            result.col = i;
            return result;
        };
        throw new Error("Unexpected Token " + c + "::: " + JSON.stringify(tokenInfo()));
    }
    return results;
}
