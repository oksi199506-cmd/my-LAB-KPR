function myFunction(x) {
    return 4 * x - x ** 2;
}

function midpoint(f, a, b, n) {
    if (n <= 0) {
        throw new Error("n должно быть больше 0");
    }
    const pS = (b - a) / n;
    let totalArea = 0;
    for (let i = 0; i < n; i++) {
        const xMid = a + i * pS + pS / 2;
        const height = f(xMid);
        totalArea += height * pS;
    }
    return totalArea;
}

const a = parseFloat(prompt("Введите a:"));
const b = parseFloat(prompt("Введите b:"));
const n = parseInt(prompt("Введите количество шагов n:"));

if (isNaN(a) || isNaN(b) || isNaN(n) || n <= 0) {
    alert("Ошибка: заполни все (n > 0)!");
} else if (a >= b) {
    alert("Ошибка: нижняя граница a < b!");
} else {
    const result = midpoint(myFunction, a, b, n);

    alert(
        "Результаты\n" +
        "Функция: F(x) = 4x - x²\n" +
        "Диапазон: [" + a + ", " + b + "]\n" +
        "Шагов: " + n + "\n" +
        "Приближенный интеграл: " + result.toFixed(3)
    );
}