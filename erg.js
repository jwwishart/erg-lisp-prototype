var DEBUG = false;
function isObject(thing) {
    return Object.prototype.toString.call(thing) === "[object Object]";
}
function isArray(it) {
    return Object.prototype.toString.call(it) === '[object Array]';
}
function isFunction(it) {
    return Object.prototype.toString.call(it) === '[object Function]';
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
var Symbol = (function () {
    function Symbol(name) {
        this._type = "symbol";
        this.name = name;
    }
    return Symbol;
}());
function read(code) {
    var i = 0;
    var results = [];
    var next = function () { return code[i++]; };
    var c = null;
    var expression = null;
    var listStack = null;
    var hasDataIndicator = false;
    var push = function (it) {
        if (isArray(it)) {
            if (listStack == null) {
                listStack = [it];
            }
            else {
                listStack.push(it);
            }
            return;
        }
        if (listStack !== null) {
            listStack[listStack.length - 1].push(it);
            return;
        }
        results.push(it);
    };
    var completeList = function () {
        if (listStack !== null) {
            if (listStack.length === 0) {
                return;
            }
            if (listStack.length === 1) {
                results.push(listStack[0]);
                listStack = null;
                return;
            }
            listStack[listStack.length - 2].push(listStack[listStack.length - 1]);
            listStack.splice(listStack.length - 1, 1);
            return;
        }
        throw new Error("we ought not get here... where is this list expected...?");
    };
    var parserNumber = function () {
        i--;
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
        i--;
        if (doneDecimal) {
            return parseFloat(wholeNumber);
        }
        else {
            return parseInt(wholeNumber, 10);
        }
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
    var parseSymbol = function () {
        i--;
        var wholeWord = '';
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
                    push(parserNumber());
                    continue;
                }
        }
        if (c === '\"') {
            push(parseString());
            continue;
        }
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
        switch (c) {
            case '+':
            case '-':
            case '/':
            case '*':
                {
                    push(new Symbol(c));
                    continue;
                }
        }
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
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["Function"] = 0] = "Function";
    SymbolType[SymbolType["Data"] = 1] = "Data";
})(SymbolType || (SymbolType = {}));
var GlobalScope = {
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
    'set': function (name, value) { GlobalScope.var(name, value); }
};
var _scopes = [
    GlobalScope
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
function print(expressions) {
    var result = "";
    if (typeof expressions === 'function')
        return expressions.toString();
    if (typeof expressions === 'number')
        return expressions.toString();
    if (typeof expressions === 'string')
        return '"' + expressions.toString() + '"';
    if (expressions._type === "symbol")
        return expressions.name;
    result += '(';
    for (var i = 0; i < expressions.length; i++) {
        if (i >= 1)
            result += ' ';
        var expression_1 = expressions[i];
        var item = findInScope(expression_1);
        if (typeof expression_1 === 'string') {
            result += '"' + expression_1.toString() + '"';
        }
        else if (expression_1._type === "symbol") {
            result += expression_1.name;
        }
        else if (isArray(expression_1)) {
            result += print(expression_1);
        }
        else if (isArray(expression_1) && expression_1.isQuoted === true) {
            result += "'(" + print(expression_1) + ")";
        }
        else {
            result += expression_1.toString();
        }
    }
    result += ')';
    return result;
}
function evaluate(parsed) {
    var last = undefined;
    for (var i = 0; i < parsed.length; i++) {
        last = evaluateExpression(parsed[i]);
    }
    return last;
}
function evaluateExpression(expression) {
    if (typeof expression === 'number')
        return expression;
    if (expression._type === "symbol") {
        var foundSymbol = findInScope(expression.name);
        if (typeof foundSymbol === 'function')
            return foundSymbol;
        return expression.name;
    }
    if (typeof expression === 'string')
        return expression;
    if (isArray(expression)) {
        var toExecute = findInScope(expression[0].name);
        if (toExecute) {
            var args = [];
            for (var i_1 = 1; i_1 < expression.length; i_1++) {
                if (expression[i_1].Type == AtomType.Symbol) {
                    args.push(expression[i_1]);
                    continue;
                }
                args.push(evaluateExpression(expression[i_1]));
            }
            return toExecute.apply(null, args);
        }
        return expression;
    }
    return expression;
}
function _evaluate(parsed) {
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
            for (var i_2 = 1; i_2 < parsed.Data.length; i_2++) {
                if (parsed.Data[i_2].Type == AtomType.Symbol) {
                    args.push(parsed.Data[i_2]);
                    continue;
                }
                args.push(internalEvaluate(parsed.Data[i_2]));
            }
            var method = GlobalScope[parsed.Data[0].Data];
            return method.apply(GlobalScope, args);
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
var expressions = [];
for (var i = 0; i < expressions.length; i++) {
    console.log("p> " + print(read(expressions[i])[0]));
    console.log("=> " + print(evaluate(read(expressions[i]))));
}
//# sourceMappingURL=erg.js.map