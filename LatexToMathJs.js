// Convert LaTeX to math.js expression
export const latexToMathJs = (latex) => {
    let expr = latex.trim();

    // Handle absolute values FIRST (before other conversions)
    // Match \left| ... \right| or just | ... |
    expr = expr.replace(/\\left\|([^|]+)\\right\|/g, 'abs($1)');
    // Handle simple | ... | patterns (non-greedy)
    let absCount = 0;
    expr = expr.replace(/\|/g, () => {
        absCount++;
        return absCount % 2 === 1 ? '(abs(' : '))';
    });

    // Handle fractions recursively for nested cases
    let prevExpr;
    do {
        prevExpr = expr;
        expr = expr.replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
            '(($1)/($2))');
    } while (expr !== prevExpr);

    // Handle roots
    expr = expr.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '(($2)^(1/($1)))');
    expr = expr.replace(/\\sqrt\{([^}]+)\}/g, '(sqrt($1))');

    // **CRITICAL: Handle inverse trig with arguments BEFORE converting to short forms**
    // Handle patterns like \tan^{-1}xyz or \sin^{-1}abc
    expr = expr.replace(/\\tan\^\{-1\}\s*([a-zA-Z]+)/g, (match, vars) => {
        return 'atan(' + vars.split('').join('*') + ')';
    });
    expr = expr.replace(/\\sin\^\{-1\}\s*([a-zA-Z]+)/g, (match, vars) => {
        return 'asin(' + vars.split('').join('*') + ')';
    });
    expr = expr.replace(/\\cos\^\{-1\}\s*([a-zA-Z]+)/g, (match, vars) => {
        return 'acos(' + vars.split('').join('*') + ')';
    });

    // Handle inverse trig with explicit arguments in braces
    expr = expr.replace(/\\tan\^\{-1\}\{([^}]+)\}/g, 'atan($1)');
    expr = expr.replace(/\\sin\^\{-1\}\{([^}]+)\}/g, 'asin($1)');
    expr = expr.replace(/\\cos\^\{-1\}\{([^}]+)\}/g, 'acos($1)');

    // Handle inverse trig BEFORE regular trig (order matters!)
    expr = expr.replace(/\\arctan/g, 'atan');
    expr = expr.replace(/\\arcsin/g, 'asin');
    expr = expr.replace(/\\arccos/g, 'acos');
    expr = expr.replace(/\\tan\^\{-1\}/g, 'atan');
    expr = expr.replace(/\\sin\^\{-1\}/g, 'asin');
    expr = expr.replace(/\\cos\^\{-1\}/g, 'acos');

    // Handle regular trig functions (but NOT reciprocal trig yet!)
    expr = expr.replace(/\\tan/g, 'tan');
    expr = expr.replace(/\\sin/g, 'sin');
    expr = expr.replace(/\\cos/g, 'cos');

    // Replace \sec, \csc, \cot with temporary placeholders
    expr = expr.replace(/\\sec/g, 'SEC');
    expr = expr.replace(/\\csc/g, 'CSC');
    expr = expr.replace(/\\cot/g, 'COT');

    // IMPORTANT: Handle trig functions with space and variable BEFORE removing spaces
    expr = expr.replace(/tan\s+([a-zA-Z])/g, 'tan($1)');
    expr = expr.replace(/sin\s+([a-zA-Z])/g, 'sin($1)');
    expr = expr.replace(/cos\s+([a-zA-Z])/g, 'cos($1)');
    expr = expr.replace(/atan\s+([a-zA-Z])/g, 'atan($1)');
    expr = expr.replace(/asin\s+([a-zA-Z])/g, 'asin($1)');
    expr = expr.replace(/acos\s+([a-zA-Z])/g, 'acos($1)');
    expr = expr.replace(/SEC\s+([a-zA-Z])/g, 'SEC($1)');
    expr = expr.replace(/CSC\s+([a-zA-Z])/g, 'CSC($1)');
    expr = expr.replace(/COT\s+([a-zA-Z])/g, 'COT($1)');
    expr = expr.replace(/log\s+([a-zA-Z])/g, 'log($1)');
    expr = expr.replace(/log10\s+([a-zA-Z])/g, 'log10($1)');
    expr = expr.replace(/sqrt\s+([a-zA-Z])/g, 'sqrt($1)');
    expr = expr.replace(/exp\s+([a-zA-Z])/g, 'exp($1)');
    expr = expr.replace(/abs\s+([a-zA-Z])/g, 'abs($1)');

    // **NEW: Handle trig functions followed by numbers and variables (e.g., cos2x, sin3y)**
    expr = expr.replace(/(sin|cos|tan|asin|acos|atan|SEC|CSC|COT)([0-9]+)([a-zA-Z]+)/g, '$1($2*$3)');
    expr = expr.replace(/(sin|cos|tan|asin|acos|atan|SEC|CSC|COT)([0-9]+)/g, '$1($2)');

    // Handle logarithms
    expr = expr.replace(/\\ln/g, 'log');
    expr = expr.replace(/\\log/g, 'log10');

    // Handle constants
    expr = expr.replace(/\\pi/g, 'pi');
    expr = expr.replace(/\\e(?![a-zA-Z])/g, 'e');
    expr = expr.replace(/\\infty/g, 'Infinity');

    // **CRITICAL: Handle function^power variable patterns BEFORE general power handling**
    // This catches patterns like sin^2 x, cos^2 y, SEC^2 z, etc.
    expr = expr.replace(/(sin|cos|tan|asin|acos|atan|SEC|CSC|COT)\^([0-9]+)\s*([a-zA-Z])/g, '($1($3)^$2)');
    expr = expr.replace(/(sin|cos|tan|asin|acos|atan|SEC|CSC|COT)\^\{([^}]+)\}\s*([a-zA-Z])/g, '($1($3)^($2))');

    // NOW convert SEC, CSC, COT to their reciprocal forms
    expr = expr.replace(/SEC\(([^)]+)\)/g, '(1/cos($1))');
    expr = expr.replace(/CSC\(([^)]+)\)/g, '(1/sin($1))');
    expr = expr.replace(/COT\(([^)]+)\)/g, '(1/tan($1))');

    // Handle brackets and braces
    expr = expr.replace(/\\left\(/g, '(');
    expr = expr.replace(/\\right\)/g, ')');
    expr = expr.replace(/\\left\[/g, '(');
    expr = expr.replace(/\\right\]/g, ')');
    expr = expr.replace(/\\left\\{/g, '(');
    expr = expr.replace(/\\right\\}/g, ')');

    // Handle operators
    expr = expr.replace(/\\cdot/g, '*');
    expr = expr.replace(/\\times/g, '*');
    expr = expr.replace(/\\div/g, '/');
    expr = expr.replace(/\\pm/g, '+');

    // Handle exponentials and powers
    expr = expr.replace(/\\exp\{([^}]+)\}/g, 'exp($1)');
    // Handle e^{...} before general powers
    expr = expr.replace(/e\^\{([^}]+)\}/g, 'exp($1)');
    // Handle general powers with braces
    expr = expr.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, '($1^($2))');
    // Handle simple powers without braces (e.g., x^2)
    expr = expr.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9])/g, '($1^$2)');

    // IMPORTANT: Handle implicit multiplication BEFORE converting braces to parens
    // This preserves the structure and prevents )(  patterns

    // Handle {expr1}{expr2} -> convert to (expr1)*(expr2) before general brace conversion
    expr = expr.replace(/\}\s*\{/g, ')*(');

    // Clean up remaining braces (convert to parentheses)
    expr = expr.replace(/\{/g, '(');
    expr = expr.replace(/\}/g, ')');

    // Remove extra spaces BEFORE processing implicit multiplication
    expr = expr.replace(/\s+/g, '');

    // SMARTER APPROACH: Add multiplication between adjacent variables, but NOT within function names
    const knownFuncs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'sqrt', 'exp', 'abs', 'pi'];

    // Step 1: Add implicit multiplication between consecutive single-letter variables
    let newExpr = '';
    let i = 0;

    while (i < expr.length) {
        // Check if current position starts a known function
        let matchedFunc = null;
        for (let func of knownFuncs) {
            if (expr.substr(i, func.length) === func) {
                // Verify it's actually the function (check what comes after)
                const nextIdx = i + func.length;
                const nextChar = expr[nextIdx];
                // Function if followed by '(' or operator or end
                if (!nextChar || nextChar === '(' || '+-*/^),'.includes(nextChar)) {
                    matchedFunc = func;
                    break;
                }
            }
        }

        if (matchedFunc) {
            // Copy the entire function name
            newExpr += matchedFunc;
            i += matchedFunc.length;
        } else if (/[a-z]/i.test(expr[i])) {
            // Single letter variable
            newExpr += expr[i];
            // Check if next char is also a single letter (not start of function)
            if (i + 1 < expr.length && /[a-z]/i.test(expr[i + 1])) {
                // Check if next position starts a function
                let nextIsFunc = false;
                for (let func of knownFuncs) {
                    if (expr.substr(i + 1, func.length) === func) {
                        const afterIdx = i + 1 + func.length;
                        const afterChar = expr[afterIdx];
                        if (!afterChar || afterChar === '(' || '+-*/^),'.includes(afterChar)) {
                            nextIsFunc = true;
                            break;
                        }
                    }
                }
                // If next is NOT a function, add multiplication
                if (!nextIsFunc) {
                    newExpr += '*';
                }
            }
            i++;
        } else {
            // Not a letter, just copy
            newExpr += expr[i];
            i++;
        }
    }

    expr = newExpr;

    // Now handle other implicit multiplication cases
    // 1. Number followed by letter
    expr = expr.replace(/(\d+\.?\d*)([a-zA-Z])/g, '$1*$2');
    // 2. Closing paren followed by number
    expr = expr.replace(/\)(\d)/g, ')*$1');
    // 3. Number followed by opening paren
    expr = expr.replace(/(\d)\(/g, '$1*(');
    // 4. Closing paren followed by opening paren (but not for functions)
    expr = expr.replace(/\)\s*\(/g, (match, offset) => {
        const before = expr.substring(Math.max(0, offset - 15), offset);
        for (let func of knownFuncs) {
            if (before.endsWith(func)) {
                return match;
            }
        }
        return ')*(';
    });
    // 5. Closing paren followed by letter (variable, not function)
    expr = expr.replace(/\)([a-zA-Z])/g, (match, letter, offset) => {
        const afterMatch = expr.substring(offset + match.length);
        if (afterMatch.startsWith('(')) {
            const potentialFunc = expr.substring(offset + 1).match(/^[a-zA-Z]+/);
            if (potentialFunc && knownFuncs.includes(potentialFunc[0])) {
                return match;
            }
        }
        return ')*' + letter;
    });
    // 6. Letter followed by opening paren (only for variables, not functions)
    expr = expr.replace(/([a-zA-Z])(\()/g, (match, letter, paren, offset) => {
        const before = expr.substring(Math.max(0, offset - 15), offset + 1);
        for (let func of knownFuncs) {
            if (before.endsWith(func)) {
                return match;
            }
        }
        return letter + '*' + paren;
    });

    // Clean up any remaining LaTeX backslashes
    expr = expr.replace(/\\/g, '');

    return expr;
};