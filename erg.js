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
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AtomType;
(function (AtomType) {
    AtomType[AtomType["Unspecified"] = 0] = "Unspecified";
    AtomType[AtomType["Symbol"] = 1] = "Symbol";
    AtomType[AtomType["Number"] = 2] = "Number";
    AtomType[AtomType["Decimal"] = 3] = "Decimal";
    AtomType[AtomType["Boolean"] = 4] = "Boolean";
    AtomType[AtomType["String"] = 5] = "String";
    AtomType[AtomType["List"] = 6] = "List";
    AtomType[AtomType["Map"] = 7] = "Map";
})(AtomType || (AtomType = {}));
var Atom = (function () {
    function Atom(type, data, isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        this.Type = type;
        this.Data = data;
        this.IsQuoted = isQuoted;
    }
    Atom.prototype.getdata = function () {
        if (this.Type == AtomType.List || this.Type == AtomType.Map) {
            return this;
        }
        return this.Data;
    };
    return Atom;
}());
var AtomSymbol = (function (_super) {
    __extends(AtomSymbol, _super);
    function AtomSymbol(name, isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        _super.call(this, AtomType.Symbol, name, isQuoted);
    }
    return AtomSymbol;
}(Atom));
var AtomString = (function (_super) {
    __extends(AtomString, _super);
    function AtomString(data, isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        _super.call(this, AtomType.String, data, isQuoted);
        this.Type = AtomType.String;
        this.IsQuoted = isQuoted;
    }
    return AtomString;
}(Atom));
var AtomList = (function (_super) {
    __extends(AtomList, _super);
    function AtomList(isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        _super.call(this);
        this.Type = AtomType.List;
        this.IsQuoted = isQuoted;
    }
    return AtomList;
}(Array));
var AtomMap = (function (_super) {
    __extends(AtomMap, _super);
    function AtomMap(data, isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        _super.call(this);
        this.Type = AtomType.Map;
        this.IsQuoted = isQuoted;
    }
    return AtomMap;
}(Object));
var AtomNumber = (function (_super) {
    __extends(AtomNumber, _super);
    function AtomNumber(data, isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        _super.call(this, AtomType.Number, data, isQuoted);
    }
    return AtomNumber;
}(Atom));
var AtomBoolean = (function (_super) {
    __extends(AtomBoolean, _super);
    function AtomBoolean(data, isQuoted) {
        if (isQuoted === void 0) { isQuoted = false; }
        _super.call(this, AtomType.Boolean, data, isQuoted);
    }
    return AtomBoolean;
}(Atom));
var TokenInfo = (function () {
    function TokenInfo() {
    }
    return TokenInfo;
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
        if (it instanceof AtomList) {
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
    var parserNumber = function (isQuoted) {
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
            return new AtomNumber(parseFloat(wholeNumber), isQuoted);
        }
        else {
            return new AtomNumber(parseInt(wholeNumber, 10), isQuoted);
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
        var result = new AtomString(wholeWord, hasDataIndicator);
        hasDataIndicator = false;
        return result;
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
        var result = new AtomSymbol(wholeWord, hasDataIndicator);
        hasDataIndicator = false;
        return result;
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
                    push(parserNumber(hasDataIndicator));
                    hasDataIndicator = false;
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
            var toPush = new AtomList(hasDataIndicator);
            hasDataIndicator = false;
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
                    push(new AtomSymbol(c, hasDataIndicator));
                    hasDataIndicator = false;
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
function print(expressions) {
    if (typeof expressions === 'string'
        || typeof expressions === 'number') {
        console.log(expressions);
        return "** Unspecified **";
    }
    var result = "";
    if (expressions.Type == null && expressions.length > 0) {
        for (var i_1 = 0; i_1 < expressions.length; i_1++) {
            result += print(expressions[i_1]);
        }
    }
    var exp = expressions;
    if (exp.Type === AtomType.Unspecified) {
        return "** Unspecified **";
    }
    if ((exp.Type === AtomType.Boolean
        || exp.Type === AtomType.Number
        || exp.Type === AtomType.String
        || exp.Type === AtomType.Symbol)) {
        if (exp.Type === AtomType.String) {
            result += '"';
        }
        result += exp.Data.toString();
        if (exp.Type === AtomType.String) {
            result += '"';
        }
        return result;
    }
    if (exp.Type === AtomType.List) {
        result += '(';
        for (var i = 0; i < exp.length; i++) {
            if (i >= 1)
                result += ' ';
            result += print(exp[i]);
        }
        result += ')';
    }
    return result;
}
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["Function"] = 0] = "Function";
    SymbolType[SymbolType["Data"] = 1] = "Data";
})(SymbolType || (SymbolType = {}));
var write = print;
var GlobalScope = {
    '+': function (a, b) {
        return new AtomNumber(a.Data + b.Data);
    },
    'print': print,
    'write': print
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
var UnspecifiedAtom = (function (_super) {
    __extends(UnspecifiedAtom, _super);
    function UnspecifiedAtom() {
        _super.call(this, AtomType.Unspecified, null, false);
    }
    return UnspecifiedAtom;
}(Atom));
function eval(toEval) {
    var last = new UnspecifiedAtom();
    if (toEval.Type == null && toEval.length > 0) {
        for (var i_2 = 0; i_2 < toEval.length; i_2++) {
            last = eval(toEval[i_2]);
        }
    }
    if ((toEval.Type === AtomType.Boolean
        || toEval.Type === AtomType.Number
        || toEval.Type === AtomType.String
        || toEval.Type === AtomType.Symbol)) {
        return toEval;
    }
    if (toEval.Type === AtomType.List && toEval.IsQuoted) {
        return toEval;
    }
    if (toEval.Type === AtomType.List) {
        if (toEval.length === 0) {
            return toEval;
        }
        var operator = toEval[0];
        var args = [];
        var func = findInScope(operator.Data);
        if (func == null) {
            last = handleSpecialForms(toEval);
            console.error("ERROR: Unable to find procedure: '" + operator.Data + "'");
        }
        if (toEval.length > 1) {
            args = toEval.slice(1);
            for (var j = 0; j < args.length; j++) {
                args[j] = eval(args[j]);
            }
        }
        last = func.apply(scope(), args);
        if (last == null)
            last = new UnspecifiedAtom();
    }
    return last;
}
function handleSpecialForms(toEval) {
    if (toEval[0].Data === 'if') {
        if (toEval.length == 2) {
            if (eval(toEval(1))) {
                if (toEval.length === 3) {
                    console.log("TRUE EXPRESSION EXECUTED");
                }
                else {
                    console.log("THROW: must have something here yes???");
                }
            }
            else {
                if (toEval.length === 3) {
                    console.log("ALTERNATE EXECUTED");
                }
                else {
                    console.log("THROW: no alternate... no problems?");
                }
            }
        }
        return new UnspecifiedAtom();
    }
    if (toEval[0].Data === 'or') {
        console.error('or procedure');
        return new UnspecifiedAtom();
    }
    if (toEval[0].Data === 'and') {
        console.error('and procedure');
        return new UnspecifiedAtom();
    }
}
var expression = "(println 5)";
DEBUG = true;
var expressions = [
    "(if (+ 1 2) (print \"Hello\"))",
    "(or a b)",
];
for (var i = 0; i < expressions.length; i++) {
    write("p> " + print(read(expressions[i])[0]));
    write("=> " + print(eval(read(expressions[i]))));
}
//# sourceMappingURL=erg.js.map