"use strict";
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
        while ((c = next()) !== undefined &&
            ((c >= '0' && c <= '9') ||
                (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z'))) {
            wholeWord += c;
        }
        i--;
        return wholeWord;
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
    var tokenInfo = function () {
        var result = new TokenInfo();
        result.index = i;
        result.line = 1;
        result.col = i;
        return result;
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
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            it.push({
                Type: AtomType.Symbol,
                Data: parseSymobol()
            });
            continue;
        }
        throw new Error("Unexpected Token " + c + "::: " + JSON.stringify(tokenInfo()));
    }
    return it;
}
exports.parse = parse;
//# sourceMappingURL=parser.js.map