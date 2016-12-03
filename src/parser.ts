
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