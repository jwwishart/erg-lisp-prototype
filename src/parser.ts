

// Types
//

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


// Code
//

/*
    Parse the string that is given into the relevant type ready for evaluation
    1 = should generate 1 as a literal value (evalutes to itself
    (+ 1 2) = should generate a simple list with  + as a symbol, 1 and 2 as literals
        the parser
 */
function parse(code: string) {
    let i = 0;
    let results = []; // Array of expressions
    let next = () => { return code[i++]; };
    let c = null;
    let expression = null; // current list expression we are parsing goes in here till done?

    let push = (it) => {
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        // UPTO(jwwishart) need to do nested lists ... :o) so expression must contain
        //  the current list maybe, and a stack of parents need to be available for handling
        //  in ALL cases where we start a list I suppose???
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        // UPTO(jwwishart)
        
        // If we pushed a list then append to the list
        if (Object.prototype.toString.call(expression) === '[object Array]') {
            expression.push(it);
            return;
        }

        // if anything else it is an expression so just push it as it is... 
        if (expression == null) {
            results.push(it) 
            expression = it;
            return;
        } else {
            results.push(it);
        }
    }

    let completeList = () => {
        //results.push(expression);
        expression = null;
    }

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

    let parseSymobol = () => {
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
        return wholeWord;
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
                push(parseInteger());

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
        // if (c == "'") {
        //     hasDataIndicator = true;
        //     continue;
        // }

        if (c === '(') {
            push([]);
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
                    push(c);

                    continue;
                }
        }

        // Symbols
        // 

        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            push(parseSymobol());

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
