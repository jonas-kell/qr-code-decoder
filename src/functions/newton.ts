type Coefficients = [number, number, number, number, number]; // [a4, a3, a2, a1, a0]

function polynomial(x: number, coeffs: Coefficients): number {
    const [a4, a3, a2, a1, a0] = coeffs;
    return a4 * x ** 4 + a3 * x ** 3 + a2 * x ** 2 + a1 * x + a0;
}

function derivative(x: number, coeffs: Coefficients): number {
    const [a4, a3, a2, a1] = coeffs.slice(0, -1); // Exclude a0 for the derivative
    return 4 * a4 * x ** 3 + 3 * a3 * x ** 2 + 2 * a2 * x + a1;
}

function newtonMethod(
    coefficients: Coefficients,
    initialGuess: number,
    tol: number,
    minDerivationValue: number,
    maxIter: number
): number | null {
    let x = initialGuess;

    for (let i = 0; i < maxIter; i++) {
        const f_x = polynomial(x, coefficients);
        const f_prime_x = derivative(x, coefficients);

        if (Math.abs(f_prime_x) < minDerivationValue) {
            return x;
        }

        const xNew = x - f_x / f_prime_x;

        if (Math.abs(xNew - x) < tol) {
            return xNew;
        }

        x = xNew;
    }

    return null;
}

export function newtonMethodRange(
    coefficients: Coefficients,
    rangeMin: number,
    rangeMax: number,
    samples: number,
    tol: number = 1e-8,
    minDerivationValue: number = 1e-12,
    maxIter: number = 1000
): number[] {
    const res: number[] = [];

    const step = (rangeMax - rangeMin) / samples;
    for (let index = 0; index < samples; index++) {
        const start = rangeMin + index * step;

        const test = newtonMethod(coefficients, start, tol, minDerivationValue, maxIter);
        if (test != null) {
            if (
                res.length == 0 ||
                !res.some((foundRoot) => {
                    return Math.abs(foundRoot - test) < tol * 2;
                })
            ) {
                res.push(test);
            }
        }
    }

    return res;
}
