
// TODO(jwwishart) move into print.ts
// TODO(jwwishart) move commands into own folder... i.e builtin-procedures/print.ts for example
// TODO(jwwishart) I'm not sure the general idea of 
function print(expressions) {
    var result = "";

    // Array of Expressions: print each one
    //

    if (expressions.Type == null && expressions.length > 0) {
        for (let i = 0; i < expressions.length; i++) {
            result += print(expressions[i]);
        }
    }

    let exp = expressions;

    if (exp.Type === AtomType.Unspecified) {
        return "** Unspecified **";
    }


    // Primitives
    //

    if ((exp.Type === AtomType.Boolean 
         || exp.Type === AtomType.Number
         || exp.Type === AtomType.String
         || exp.Type === AtomType.Symbol)) 
    {
        if (exp.IsQuoted) result += "'";

        if (exp.Type === AtomType.String) {
            result += '"'
        }

        result += exp.Data.toString();

        if (exp.Type === AtomType.String) {
            result += '"'
        }

        return result;
    }

    // TODO(jwwishart) functions... output... and location info???


    // Lists etc.
    //

    if (exp.Type === AtomType.List) {
        if (exp.IsQuoted) result += "'";

        result += '(';

        for (var i = 0; i < exp.length; i++) {
            if (i >= 1) result += ' ';
            result += print(exp[i]);
        }

        result += ')';
    }

    return result;
}