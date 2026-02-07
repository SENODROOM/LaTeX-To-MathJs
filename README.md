# LaTeX to Math.js Converter

A robust JavaScript utility that converts LaTeX mathematical expressions into Math.js compatible syntax. This converter handles a wide range of mathematical notation including fractions, roots, trigonometric functions, logarithms, and complex nested expressions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Supported LaTeX Commands](#-supported-latex-commands)
- [How It Works](#-how-it-works)
- [Examples](#-examples)
- [Contributing](#-contributing)
- [License](#-license)
- [Star the Repository](#-star-the-repository)

## ✨ Features

- **Comprehensive LaTeX Support**: Handles fractions, roots, exponents, trigonometric functions, logarithms, and more
- **Nested Expression Handling**: Properly processes deeply nested mathematical expressions
- **Implicit Multiplication**: Automatically adds multiplication operators where needed (e.g., `2x` → `2*x`)
- **Smart Function Recognition**: Distinguishes between mathematical functions and variable names
- **Absolute Value Support**: Converts both `\left| \right|` and simple `| |` notation
- **Reciprocal Trig Functions**: Handles `\sec`, `\csc`, `\cot` by converting to their reciprocal forms

## 📦 Installation

Simply import the function into your JavaScript project:

```javascript
import { latexToMathJs } from './LatexToMathJs.js';
```

Or if using CommonJS:

```javascript
const { latexToMathJs } = require('./LatexToMathJs.js');
```

## 🚀 Usage

```javascript
import { latexToMathJs } from './LatexToMathJs.js';

// Basic usage
const latex = '\\frac{x^2 + 1}{2}';
const mathJs = latexToMathJs(latex);
console.log(mathJs); // Output: ((x^(2))+1)/(2))

// With Math.js evaluation
import { evaluate } from 'mathjs';

const result = evaluate(mathJs, { x: 3 });
console.log(result); // Output: 5
```

## 📚 Supported LaTeX Commands

### Fractions
- `\frac{numerator}{denominator}` → `((numerator)/(denominator))`

### Roots
- `\sqrt{x}` → `sqrt(x)`
- `\sqrt[n]{x}` → `(x^(1/n))`

### Trigonometric Functions
- **Standard**: `\sin`, `\cos`, `\tan`
- **Inverse**: `\arcsin`, `\arccos`, `\arctan`, `\sin^{-1}`, `\cos^{-1}`, `\tan^{-1}`
- **Reciprocal**: `\sec`, `\csc`, `\cot` (converted to `1/cos`, `1/sin`, `1/tan`)

### Logarithms
- `\ln{x}` → `log(x)` (natural logarithm)
- `\log{x}` → `log10(x)` (base 10)

### Exponentials and Powers
- `\exp{x}` → `exp(x)`
- `e^{x}` → `exp(x)`
- `x^{n}` → `(x^(n))`
- `x^2` → `(x^2)`

### Absolute Value
- `\left| x \right|` → `abs(x)`
- `|x|` → `abs(x)`

### Constants
- `\pi` → `pi`
- `\e` → `e`
- `\infty` → `Infinity`

### Operators
- `\cdot` → `*`
- `\times` → `*`
- `\div` → `/`
- `\pm` → `+` (plus-minus treated as plus)

### Brackets
- `\left(`, `\right)`, `\left[`, `\right]`, `\left\{`, `\right\}` → `()`

## 🔧 How It Works

The converter processes LaTeX expressions through several carefully ordered stages:

### 1. **Absolute Value Conversion** (First Priority)
```javascript
// Handles \left| ... \right| and | ... |
expr = expr.replace(/\\left\|([^|]+)\\right\|/g, 'abs($1)');
```
Absolute values are processed first to prevent interference with other operators.

### 2. **Fraction Handling** (Recursive)
```javascript
// Recursively handles nested fractions
do {
    prevExpr = expr;
    expr = expr.replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
        '(($1)/($2))');
} while (expr !== prevExpr);
```
Uses a loop to handle deeply nested fractions like `\frac{\frac{a}{b}}{c}`.

### 3. **Root Conversion**
```javascript
// nth roots and square roots
expr = expr.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '(($2)^(1/($1)))');
expr = expr.replace(/\\sqrt\{([^}]+)\}/g, '(sqrt($1))');
```

### 4. **Trigonometric Functions** (Order Matters!)
Inverse functions are processed **before** regular ones to prevent incorrect conversions:
```javascript
// Inverse trig first
expr = expr.replace(/\\arctan/g, 'atan');
// Then regular trig
expr = expr.replace(/\\tan/g, 'tan');
```

### 5. **Function Arguments**
Handles functions with explicit arguments and space-separated notation:
```javascript
// sin x → sin(x)
expr = expr.replace(/sin\s+([a-zA-Z])/g, 'sin($1)');
```

### 6. **Power and Exponent Handling**
```javascript
// Special case: e^{...} → exp(...)
expr = expr.replace(/e\^\{([^}]+)\}/g, 'exp($1)');
// General powers: x^{n} → (x^(n))
expr = expr.replace(/([a-zA-Z0-9]+)\^\{([^}]+)\}/g, '($1^($2))');
```

### 7. **Implicit Multiplication** (Smart Detection)
This is the most complex part, using a state machine approach:

```javascript
const knownFuncs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', ...];

while (i < expr.length) {
    // Check if current position starts a known function
    if (matchedFunc) {
        // Don't add multiplication within function names
    } else if (isVariable) {
        // Add * between consecutive variables (xy → x*y)
        // But NOT between variable and function (xsin → x*sin, not xs*in)
    }
}
```

The algorithm handles:
- Number + variable: `2x` → `2*x`
- Variable + variable: `xy` → `x*y` (but preserves function names like `sin`)
- Number + parenthesis: `2(x)` → `2*(x)`
- Closing + opening parens: `)(` → `)*(`
- Variable + parenthesis: `x(y)` → `x*(y)` (except for functions)

### 8. **Cleanup**
Final step removes remaining LaTeX backslashes and extra spaces.

## 📖 Examples

### Basic Expressions
```javascript
latexToMathJs('x^2 + 2x + 1');
// Output: (x^2)+2*x+1

latexToMathJs('\\frac{1}{2}x');
// Output: ((1)/(2))*x
```

### Trigonometric
```javascript
latexToMathJs('\\sin(x) + \\cos(x)');
// Output: sin(x)+cos(x)

latexToMathJs('\\sec(x)');
// Output: (1/cos(x))

latexToMathJs('\\arctan(y)');
// Output: atan(y)
```

### Complex Nested Expressions
```javascript
latexToMathJs('\\frac{\\sin(x)}{\\cos(x)}');
// Output: ((sin(x))/(cos(x)))

latexToMathJs('\\sqrt{\\frac{a^2 + b^2}{c}}');
// Output: (sqrt(((a^(2))+(b^(2)))/(c)))

latexToMathJs('e^{-\\frac{x^2}{2}}');
// Output: exp(-((x^(2))/(2)))
```

### Absolute Values
```javascript
latexToMathJs('\\left| x - 1 \\right|');
// Output: abs(x-1)

latexToMathJs('|x| + |y|');
// Output: abs(x)+abs(y)
```

### Implicit Multiplication
```javascript
latexToMathJs('2xy');
// Output: 2*x*y

latexToMathJs('(x+1)(x-1)');
// Output: (x+1)*(x-1)

latexToMathJs('\\pi r^2');
// Output: pi*r^(2)
```

## 🤝 Contributing

We welcome contributions! If you find any bugs or have suggestions for improvements, please:

### Reporting Bugs
1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear description of the bug
   - Input LaTeX expression
   - Expected output
   - Actual output
   - Steps to reproduce

### Submitting Pull Requests
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

### Development Guidelines
- Maintain the existing code style
- Add comments for complex logic
- Update the README if adding new features
- Test with various LaTeX expressions

### Areas for Contribution
- Additional LaTeX command support
- Performance optimizations
- Better error handling
- More comprehensive test coverage
- Documentation improvements

## 📄 License

**MIT License**

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

**THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**

### Educational Use
This software is free for everyone to use, including for **educational purposes**. Teachers, students, researchers, and educational institutions are encouraged to use, modify, and distribute this software in accordance with the MIT License.

## ⭐ Star the Repository

If you find this project useful, please consider giving it a star on GitHub! It helps others discover the project and motivates continued development.

**[⭐ Star this repository](https://github.com/yourusername/latex-to-mathjs)** _(Replace with your actual repository URL)_

---

## 🔗 Related Projects

- [Math.js](https://mathjs.org/) - Extensive math library for JavaScript
- [KaTeX](https://katex.org/) - Fast math typesetting library
- [MathJax](https://www.mathjax.org/) - Beautiful math in all browsers

## 📞 Support

If you need help or have questions:
- Open an issue on GitHub
- Check existing documentation
- Review the examples above

---

**Made with ❤️ for the mathematical community**