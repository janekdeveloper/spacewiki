export class OrbitalTrajectory {
    constructor(name, semiMajorAxis, inclination, argPerigee, eccentricity, raan, meanAnomaly, period, size) {
        this.name = name; // Название планеты
        this.semiMajorAxis = semiMajorAxis; // Полуось орбиты
        this.inclination = THREE.MathUtils.degToRad(inclination); // Наклонение в радианах
        this.argPerigee = THREE.MathUtils.degToRad(argPerigee); // Аргумент перигея в радианах
        this.eccentricity = eccentricity; // Эксцентриситет орбиты
        this.raan = THREE.MathUtils.degToRad(raan); // Восходящий узел в радианах
        this.period = period; // Период обращения
        this.trueAnomaly = THREE.MathUtils.degToRad(meanAnomaly); // Истинная аномалия в радианах
        this.time = 0; // Начальное время
        this.size = size; // Размер планеты
    }

    // Функция для обновления положения планеты
    propagate(deltaTime) {
        // Вычисляем среднюю угловую скорость
        const n = (2 * Math.PI) / (this.period * 365.25); // Обратите внимание, что 365.25 - это количество дней в году
        this.time += deltaTime; // Увеличиваем время на deltaTime

        // Средняя аномалия (M) - угловая позиция планеты на орбите
        const mA = (n * this.time) % (2 * Math.PI); // Обеспечиваем, чтобы M всегда оставалась в пределах 0 - 2π
        const eA = this.meanToEccentricAnomaly(mA); // Преобразуем среднюю аномалию в эксцентрическую
        this.trueAnomaly = this.eccentricToTrueAnomaly(eA); // Преобразуем эксцентрическую аномалию в истинную

        return this.calculatePosition(); // Возвращаем текущее положение планеты
    }

    // Вычисление позиции планеты в пространстве
    calculatePosition() {
        // Вычисляем расстояние до фокуса орбиты
        const sLR = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity); // Длина малой оси
        // Вычисляем расстояние до планеты (r)
        const r = sLR / (1 + this.eccentricity * Math.cos(this.trueAnomaly));

        // Вычисляем координаты (x, y, z) в зависимости от параметров орбиты
        const x = r * (
            Math.cos(this.argPerigee + this.trueAnomaly) * Math.cos(this.raan) - 
            Math.cos(this.inclination) * Math.sin(this.argPerigee + this.trueAnomaly) * Math.sin(this.raan)
        );
        const y = r * (
            Math.cos(this.argPerigee + this.trueAnomaly) * Math.sin(this.raan) + 
            Math.cos(this.inclination) * Math.sin(this.argPerigee + this.trueAnomaly) * Math.cos(this.raan)
        );
        const z = r * (Math.sin(this.argPerigee + this.trueAnomaly) * Math.sin(this.inclination)); // Высота над плоскостью

        return { x, y, z }; // Возвращаем координаты
    }

    // Преобразование средней аномалии в эксцентрическую аномалию
    meanToEccentricAnomaly(M) {
        let E = M; // Начальное значение эксцентрической аномалии
        const tol = 1e-6; // Задаем допустимую погрешность
        let delta; // Переменная для хранения разности

        // Итеративный метод Ньютона для вычисления эксцентрической аномалии
        do {
            const f_E = E - this.eccentricity * Math.sin(E) - M; // Функция, которая равна нулю
            const f_Eprime = 1 - this.eccentricity * Math.cos(E); // Производная функции
            delta = f_E / f_Eprime; // Вычисляем изменение
            E -= delta; // Обновляем значение эксцентрической аномалии
        } while (Math.abs(delta) > tol); // Продолжаем до достижения допустимой погрешности

        return E; // Возвращаем эксцентрическую аномалию
    }

    // Преобразование эксцентрической аномалии в истинную аномалию
    eccentricToTrueAnomaly(E) {
        // Формула для преобразования
        return 2 * Math.atan2(
            Math.sqrt(1 + this.eccentricity) * Math.sin(E / 2), 
            Math.sqrt(1 - this.eccentricity) * Math.cos(E / 2)
        );
    }
}