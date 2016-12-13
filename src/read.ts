
/*
  read()

  The read method takes s-expressions and converts them into internal
  structures which can then be evaluated by eval() or printed

  There are a variety of things we need to cover when converting from
  s-expressions to these internal structures

  - Unspecified: object indicating Unspecified result
  - Null ?
  
  - Integer 
  - Decimal/Float/BigNumber?
  - Boolean
  - String
  - Characater
  
  - Symbol

  - List
    - Procedure and arguments
    - Lists (quoted i.e. not evaluated)

  - Any of the above quoted(?)
  - Map (i.e. dictionary with key/values)

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

class Symbol {
    constructor(name: string) {
        this.name = name;
    }

    name: string;
    _type: string = "symbol";
}


// Code
//

/*
    Parse the string that is given into the relevant type ready for evaluation
    1 = should generate 1 as a literal value (evalutes to itself
    (+ 1 2) = should generate a simple list with  + as a symbol, 1 and 2 as literals
        the parser
 */
function read(code: string) {
    let i = 0;
    let results = []; // Array of expressions
    let next = () => { return code[i++]; };
    let c = null;
    let expression = null; // current list expression we are parsing goes in here till done?
    let listStack = null;
    let hasDataIndicator = false;

    let push = (it) => {
        // If we pushed a list then append to the list
        if (isArray(it)) {
            if (listStack == null) {
                listStack = [it];
            } else {
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
    }

    let completeList = () => {
        if (listStack !== null) {
            // TODO This ought not happen... ? why do we need this?
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
    }

    let parserNumber = () => {
        i--; // Keeps while loop consistent...

        let wholeNumber = '';
        let doneDecimal = false;
        while ((c = next()) !== undefined) {
            if (c === '.' && doneDecimal === false) {
                doneDecimal = true;
                wholeNumber += c;
                continue;
            }

            let asN = parseInt(c, 10);
            if (isNaN(asN)) break;
            wholeNumber += c;
        }

        i--; // Move back a char so next sections next() call will be on current char

        if (doneDecimal) {
            return parseFloat(wholeNumber);
        } else {
            return parseInt(wholeNumber, 10);
        }
    }

    let parseString = () => {
        //i--; skip the first "

        let wholeWord = '';
        // TODO check the ranges!!! esp the numbers :o)
        let isEscaping = false;
        while ((c = next()) !== undefined && (isEscaping || !isEscaping && c !== '"')) {
            if (c == '\\') {
                isEscaping = true;
                continue;
            } else if (isEscaping === true) {
                isEscaping = false; // we ought to be adding our escaped char this iteration. So reset ...
            }

            wholeWord += c;
        }

        // i--; skip the final quote
        return wholeWord;
    }

    let parseSymbol = () => {
        i--;

        let wholeWord = '';
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
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue;

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
            let toPush = [];
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

        let tokenInfo = () => {
            let result = new TokenInfo();
            result.index = i;
            result.line = 1;
            result.col = i;

            return result;
        };

        throw new Error("Unexpected Token " + c + "::: " + JSON.stringify(tokenInfo()));
        // TODO hasDataIndicator must be turned off!
    }

    return results;
}
