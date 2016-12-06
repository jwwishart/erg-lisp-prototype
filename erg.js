var DEBUG = false;
function isObject(thing) {
    return Object.prototype.toString.call(thing) === "[object Object]";
}
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
function parse(code) {
    var i = 0;
    var results = [];
    var next = function () { return code[i++]; };
    var c = null;
    var expression = null;
    var push = function (it) {
        if (Object.prototype.toString.call(expression) === '[object Array]') {
            expression.push(it);
            return;
        }
        if (expression == null) {
            results.push(it);
            expression = it;
            return;
        }
        else {
            results.push(it);
        }
    };
    var completeList = function () {
        expression = null;
    };
    var parseInteger = function () {
        i--;
        var wholeNumber = '';
        while ((c = next()) !== undefined) {
            var asN = parseInt(c, 10);
            if (isNaN(asN))
                break;
            wholeNumber += c;
        }
        i--;
        return wholeNumber;
    };
    var parseString = function () {
        var wholeWord = '';
        var isEscaping = false;
        while ((c = next()) !== undefined && (isEscaping || !isEscaping && c !== '"')) {
            if (c == '\\') {
                isEscaping = true;
                continue;
            }
            else if (isEscaping === true) {
                isEscaping = false;
            }
            wholeWord += c;
        }
        return wholeWord;
    };
    var parseSymobol = function () {
        i--;
        var wholeWord = '';
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
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r')
            continue;
        switch (c) {
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
                    push(parseInteger());
                    continue;
                }
        }
        if (c === '\"') {
            push(parseString());
            continue;
        }
        if (c === '(') {
            push([]);
            continue;
        }
        if (c === ')') {
            completeList();
            continue;
        }
        switch (c) {
            case '+':
            case '-':
            case '/':
            case '*':
                {
                    push(c);
                    continue;
                }
        }
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            push(parseSymobol());
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
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["Function"] = 0] = "Function";
    SymbolType[SymbolType["Data"] = 1] = "Data";
})(SymbolType || (SymbolType = {}));
var globalScopeSymbols = {
    '-': {
        Type: SymbolType.Function,
        Arguments: [{
                Name: 'a',
                Type: AtomType.Integer
            }, {
                Name: 'b',
                Type: AtomType.Integer
            },],
        ReturnType: AtomType.Integer,
        Data: function (a, b) { return a + b; }
    },
    'printf': {
        Type: SymbolType.Function,
        Arguments: [{
                Name: 'a',
                Type: AtomType.String
            }],
        ReturnType: AtomType.Integer,
        Data: function (a) { console.log(a); }
    },
    '+': function (a, b) { return a + b; },
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
        console.log(text);
    },
    'println': function (it) {
        if (it instanceof String) {
            console.log(it);
            return;
        }
        if (it instanceof Number) {
            console.log(it);
            return;
        }
        console.error("NOOOO! What is this!: ");
        console.error(it);
    },
    'var': function (name, value) {
        if (Object.prototype.hasOwnProperty.call(name, 'Type') &&
            Object.prototype.hasOwnProperty.call(name, 'Data') &&
            name.Type === AtomType.Symbol) {
            name = name.Data;
        }
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
        if (parsed.Type === AtomType.Symbol) {
            var val = findInScope(parsed.Data);
            if (val == null) {
                return parsed.Data;
            }
            return val;
        }
        if (parsed.IsData) {
            if (parsed.Type == AtomType.Integer) {
                return parseInt(parsed.Data, 10);
            }
            return parsed.Data;
        }
        if (parsed.Type == AtomType.Code) {
            var args = [];
            for (var i_1 = 1; i_1 < parsed.Data.length; i_1++) {
                if (parsed.Data[i_1].Type == AtomType.Symbol) {
                    args.push(parsed.Data[i_1]);
                    continue;
                }
                args.push(internalEvaluate(parsed.Data[i_1]));
            }
            var method = globalScopeSymbols[parsed.Data[0].Data];
            return method.apply(globalScopeSymbols, args);
        }
    }
    for (var i = 0; i < parsed.length; i++) {
        var val = internalEvaluate(parsed[i]);
        if (val === undefined)
            continue;
        console.log(val);
    }
    return parsed;
}
var expression = "(println 5)";
DEBUG = true;
console.log(parse("1"));
console.log(parse("()"));
console.log(parse("(+ 1 2)"));
console.log(parse("(print \"Hello World\")"));
console.log(parse("(print (+ 1 2))"));
DEBUG && dumpScope();
//# sourceMappingURL=erg.js.map