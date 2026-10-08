class Term {
  constructor(coef = 0, sym = "", exp = 0) {
    this.coef = coef;
    this.sym = sym;
    this.exp = exp;
  }

  diff(variable) {
    if (!this.sym || this.sym !== variable || this.exp === 0) {
      return new Term(0, "", 0);
    }
    const newCoef = this.coef * this.exp;
    const newExp = this.exp - 1;
    if (newExp === 0) return new Term(newCoef, "", 0);
    return new Term(newCoef, this.sym, newExp);
  }

  toString() {
    if (this.coef === 0 || isNaN(this.coef)) return "";
    let result = "";
    const absCoef = Math.abs(this.coef);
    if (absCoef !== 1 || !this.sym || this.exp === 0) result += absCoef;
    if (this.sym && this.exp > 0) {
      if (absCoef !== 1) result += "*";
      result += this.sym;
      if (this.exp > 1) result += "^" + this.exp;
    }
    return result;
  }
}

// Парсер строки в массив Term
function parsePolynomial(exprStr) {
  // Добавили круглые скобки `()` в разрешенные символы
  if (!/^[0-9a-zA-Z\+\-\*\^\(\)\s]+$/.test(exprStr)) {
    throw new Error("Разрешены только операции +, -, *, ^, скобки и полиномы!");
  }

  // Очищаем от лишних пробелов и убираем скобки, если они просто оборачивают выражение
  let cleanStr = exprStr.replace(/\s+/g, "");
  if (cleanStr.startsWith("(") && cleanStr.endsWith(")")) {
    cleanStr = cleanStr.substring(1, cleanStr.length - 1);
  }

  if (!cleanStr) return [];

  const normalized = cleanStr.replace(/-/g, "+-");
  const parts = normalized.split("+").filter((p) => p.length > 0);
  const terms = [];

  for (const part of parts) {
    let coef = 1,
      sym = "",
      exp = 0;

    // Если это просто число
    if (!part.includes("^") && !/[a-zA-Z]/.test(part)) {
      let num = parseFloat(part);
      if (isNaN(num)) throw new Error(`Некорректное число: ${part}`);
      terms.push(new Term(num, "", 0));
      continue;
    }

    let basePart = part;
    let parsedExp = 1;

    // 1. Обработка степени (^)
    if (part.includes("^")) {
      const splitExp = part.split("^");
      if (splitExp.length !== 2)
        throw new Error(`Некорректная степень: ${part}`);

      basePart = splitExp[0];
      parsedExp = parseInt(splitExp[1], 10);

      if (isNaN(parsedExp)) throw new Error(`Некорректная степень: ${part}`);
    }

    // 2. Обработка умножения (*)
    if (basePart.includes("*")) {
      const splitMult = basePart.split("*");
      if (splitMult.length !== 2)
        throw new Error(`Некорректное умножение: ${part}`);

      coef = splitMult[0] === "-" ? -1 : parseFloat(splitMult[0]);
      sym = splitMult[1];

      if (isNaN(coef)) throw new Error(`Некорректный коэффициент: ${part}`);
      if (sym.length > 1) throw new Error(`Некорректная переменная: ${sym}`);
    } else {
      if (basePart.startsWith("-")) {
        if (basePart.length === 1 || /[a-zA-Z]/.test(basePart[1])) {
          coef = -1;
          sym = basePart.replace("-", "");
        } else {
          coef = parseFloat(basePart);
          parsedExp = 0;
        }
      } else if (/[a-zA-Z]/.test(basePart)) {
        coef = 1;
        sym = basePart;
      } else {
        coef = parseFloat(basePart);
        parsedExp = 0;
      }

      if (isNaN(coef)) throw new Error(`Некорректный коэффициент: ${part}`);
      if (sym.length > 1) throw new Error(`Некорректная переменная: ${sym}`);
    }

    terms.push(new Term(coef, sym, parsedExp));
  }
  return terms;
}

// Функция дифференцирования
function diff(exprList, variable) {
  let r = [];
  for (let t of exprList) {
    let diffTerm = t.diff(variable);
    if (diffTerm.coef !== 0) {
      r.push(diffTerm);
    }
  }
  return r;
}

function termsToString(terms) {
  if (terms.length === 0) return "0";
  let resultStr = "";
  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    const termStr = t.toString();
    if (i === 0) {
      resultStr += (t.coef < 0 ? "-" : "") + termStr;
    } else {
      resultStr += (t.coef < 0 ? " - " : " + ") + termStr;
    }
  }
  return resultStr;
}

// 2. LATEX И MATHJAX
function toLatex(str) {
  if (str === "0") return "0";
  let latex = str.replace(/\*/g, "");
  latex = latex.replace(/\^(\d+)/g, "^{$1}");
  return latex;
}

// 3. TDD ТЕСТЫ
function runTests() {
  const tests = [
    { expr: "4*x^3", sym: "x", expected: "12*x^2" },
    { expr: "4*x^3", sym: "y", expected: "0" },
    { expr: "4*x^3-x^2", sym: "x", expected: "12*x^2 - 2*x" },
    { expr: "2*x^2 - x - 2", sym: "x", expected: "4*x - 1" },
    { expr: "x", sym: "x", expected: "1" },
    { expr: "5", sym: "x", expected: "0" },
    { expr: "-x^2 + 4*x - 5", sym: "x", expected: "-2*x + 4" },
    { expr: "3*x^2 + 4*y^2", sym: "y", expected: "8*y" },
    { expr: "10*x^5 - 2*x^2", sym: "x", expected: "50*x^4 - 4*x" },
    // Новые тесты со скобками
    { expr: "(x^2)", sym: "x", expected: "2*x" },
    { expr: "(4*x^3 - x^2)", sym: "x", expected: "12*x^2 - 2*x" },

    // Тесты на ошибки
    { expr: "4/x^2", sym: "x", expectedError: "Разрешены только операции" },
    { expr: "x^", sym: "x", expectedError: "Некорректная степень" },
    { expr: "4*x*y", sym: "x", expectedError: "Некорректное умножение" },
  ];

  let passed = 0;
  let outputDiv = document.getElementById("test-output");
  if (!outputDiv) return;

  outputDiv.innerHTML = "<b>Результаты TDD тестов:</b><br>";

  tests.forEach((t, i) => {
    let isPass = false;
    let actualResult = "";

    try {
      let terms = parsePolynomial(t.expr);
      let resultTerms = diff(terms, t.sym);
      actualResult = termsToString(resultTerms);

      if (t.expectedError) {
        isPass = false;
        actualResult = "Ошибка не была вызвана!";
      } else {
        isPass = actualResult === t.expected;
      }
    } catch (e) {
      if (t.expectedError) {
        isPass = e.message.includes(t.expectedError);
        actualResult = e.message;
      } else {
        isPass = false;
        actualResult = "Неожиданная ошибка: " + e.message;
      }
    }

    if (isPass) passed++;

    outputDiv.innerHTML += `<span class="${isPass ? "test-pass" : "test-fail"}">
            (${t.expectedError ? "Ожидалась ошибка" : 'Ожидалось: "' + t.expected + '"'})<br>
            &nbsp;&nbsp;Результат: ${actualResult}
        </span><br>`;
  });

  let coverage = Math.round((passed / tests.length) * 100);
  outputDiv.innerHTML += `<hr><b>Пройдено: ${passed}/${tests.length} (Покрытие CoV: ${coverage}%)</b>`;
}

// 4. UI И ОБРАБОТКА СОБЫТИЙ
document.getElementById("runBtn").addEventListener("click", () => {
  const expr = document.getElementById("expression").value;
  const variable = document.getElementById("variable").value.trim();
  const resultDiv = document.getElementById("result");

  resultDiv.className = "result-box";
  try {
    if (!variable) throw new Error("Укажите переменную дифференцирования");

    const termsList = parsePolynomial(expr);
    const resultTerms = diff(termsList, variable);
    const resStr = termsToString(resultTerms);

    if (resStr === "0") {
      resultDiv.innerText = "0";
    } else {
      const latexRes = toLatex(resStr);
      resultDiv.innerHTML = `\\( ${latexRes} \\)`;
      if (window.MathJax) {
        MathJax.typesetPromise([resultDiv]);
      }
    }
  } catch (e) {
    resultDiv.className = "result-box error";
    resultDiv.innerText = "Ошибка: " + e.message;
  }
});

window.addEventListener("DOMContentLoaded", runTests);
