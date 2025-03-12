// Инициализация сцены
const scene = new THREE.Scene();

// Настройка камеры
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(200, 100, 150);// Начальная позиция камеры
camera.lookAt(0, -40, 0); // Направление камеры на центр сцены

// Рендерер
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Орбиты камерой
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Источник света (имитируем Солнце как источник света)
const sunLight = new THREE.PointLight(0xffffff, 1, 1000);
sunLight.position.set(0, 0, 0); // Солнце в центре
scene.add(sunLight);

// Добавляем мягкий свет
const ambientLight = new THREE.AmbientLight(0x404040); // мягкий белый свет
scene.add(ambientLight);

// Загрузчик текстур
const textureLoader = new THREE.TextureLoader();

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(25, 256, 256);
    const sunTexture = textureLoader.load('../static/img/sun.jpg');
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.rotation.x = Math.PI / 2;
    scene.add(sun);

    return sun;
}

// Вызов функции создания Солнца
const sun = createSun();

// Загрузка текстуры фона
const backgroundTexture = textureLoader.load('../static/img/background_stars.jpg', function(texture) {
    scene.background = texture; // Установка текстуры как фон
});

// Класс для орбитального пропагатора
class OrbitalTrajectory {
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

// Массив планетных данных: название, полуось, наклонение, аргумент перигея, эксцентриситет, восходящий узел, истинная аномалия, период
const orbitalData = [
    { name: "Mercury",
       semiMajorAxis: 0.38709893 * 190,
       inclination: 7.00487,
       argPerigee: 77.46,
       eccentricity: 0.20563069,
       raan: 48.33167,
       meanAnomaly: 252.25,
       period: 0.240846,
       size: 2.40350877193 },
    { name: "Venus",
       semiMajorAxis: 0.72333199 * 170,
       inclination: 3.39471,
       argPerigee: 131.77,
       eccentricity: 0.00677323,
       raan: 76.68069,
       meanAnomaly: 181.98,
       period: 0.615,
       size: 5.47634776115 },
    { name: "Earth",
       semiMajorAxis: 1.00000011 * 200,
       inclination: 0.00005,
       argPerigee: 100.47,
       eccentricity: 0.01671022,
       raan: -11.26064,
       meanAnomaly: 100.47,
       period: 0.2,
       size: 5.65970646524 },
    { name: "Mars",
       semiMajorAxis: 1.5236623 * 200,
       inclination: 1.85061,
       argPerigee: 336.04084084,
       eccentricity: 0.09341233,
       raan: 49.57854,
       meanAnomaly: 355.43,
       period: 1.880847,
       size: 4.94703736681 },
    { name: "Jupiter",
       semiMajorAxis: 5.2044 * 160,
       inclination: 1.303,
       argPerigee: 34.7,
       eccentricity: 0.0484,
       raan: 100.5,
       meanAnomaly: 49.5,
       period: 11.862,
       size: 25.9468 },
    { name: "Saturn",
       semiMajorAxis: 9.5826 * 140,
       inclination: 2.489,
       argPerigee: 339.5,
       eccentricity: 0.0565,
       raan: 113.7,
       meanAnomaly: 316.9,
       period: 29.457, 
       size: 20.4286967195 },
    { name: "Uranus",
       semiMajorAxis: 19.2184 * 110,
       inclination: 0.769,
       argPerigee: 96.6,
       eccentricity: 0.0457,
       raan: 74.0,
       meanAnomaly: 142.8,
       period: 84.02,
       size: 14.5687451532 },
    { name: "Neptune",
       semiMajorAxis: 30.0583 * 90,
       inclination: 1.769,
       argPerigee: 253.2,
       eccentricity: 0.0086,
       raan: 131.8,
       meanAnomaly: 256.2,
       period: 164.8,
       size: 14.1436654508 }
];

// Массив для хранения траекторий
const trajectories = orbitalData.map(data => new OrbitalTrajectory(
    data.name,
    data.semiMajorAxis,
    data.inclination,
    data.argPerigee,
    data.eccentricity,
    data.raan,
    data.meanAnomaly,
    data.period,
    data.size));

async function loadChatHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;  // Если токена нет, пропускаем загрузку

    try {
        const response = await fetch("/chat/history", {
            method: "GET",
            headers: { "Authorization": token }
        });

        const history = await response.json();

        if (history.error) return; // Если ошибка, не загружаем

        // Добавляем загруженные сообщения в чат
        history.forEach(({ message, response }) => {
            addMessage("user", message);
            addMessage("bot", response);
        });
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

// Переключение чата
function toggleChat() {
    const chatBox = document.getElementById("chatBox");
    const isOpening = !chatBox.classList.contains("open");

    if (isOpening) {
        loadChatHistory(); // Загружаем историю только при открытии
    }

    chatBox.classList.toggle("open");
}

// Обработчик отправки сообщений
async function sendMessage() {
    const inputField = document.getElementById("chatInput");
    const message = inputField.value.trim();
    
    if (message === "") return;

    // Добавляем сообщение пользователя в чат
    addMessage("user", message);
    inputField.value = "";

    // Получаем токен из localStorage
    const token = localStorage.getItem("token");

    // Отправляем запрос на сервер
    try {
        const response = await fetch("/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": token }) // Добавляем токен, если он есть
            },
            body: JSON.stringify({ message })
        });

        const result = await response.json();
        addMessage("bot", result.response);
    } catch (error) {
        addMessage("bot", "Error contacting AI.");
    }
}


// Обработка клавиши Enter
function handleChatKeypress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// Функция добавления сообщений
// Функция добавления сообщений с поддержкой Markdown
function addMessage(sender, text) {
    const chatMessages = document.getElementById("chatMessages");
    const messageElement = document.createElement("p");

    // Рендеринг Markdown
    messageElement.innerHTML = marked.parse(text);
    messageElement.classList.add(sender === "user" ? "user-message" : "bot-message");

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Прокрутка вниз
}


// Создание планеты с текстурой
function createPlanetWithTexture(name, radius, texturePath, distance) {
    const geometry = new THREE.SphereGeometry(radius+4, 128, 128);
    const texture = textureLoader.load(texturePath);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const planet = new THREE.Mesh(geometry, material);
    planet.name = name;

    planet.renderOrder = 2; // Задать приоритет рендеринга планет выше, чем у орбит
    planet.rotation.x = Math.PI / 2;
    planet.userData = { distance };
    scene.add(planet);

    return planet;
}

// Создание орбитальной линии для планеты
function createOrbit(trajectory) {
    const points = [];
    for (let i = 0; i <= 100; i++) {
        const trueAnomaly = (i / 100) * 2 * Math.PI; // Угловое положение на орбите
        const sLR = trajectory.semiMajorAxis * (1 - trajectory.eccentricity * trajectory.eccentricity);
        const r = sLR / (1 + trajectory.eccentricity * Math.cos(trueAnomaly));

        const x = r * (Math.cos(trajectory.argPerigee + trueAnomaly) * Math.cos(trajectory.raan) - Math.cos(trajectory.inclination) * Math.sin(trajectory.argPerigee + trueAnomaly) * Math.sin(trajectory.raan));
        const y = r * (Math.cos(trajectory.argPerigee + trueAnomaly) * Math.sin(trajectory.raan) + Math.cos(trajectory.inclination) * Math.sin(trajectory.argPerigee + trueAnomaly) * Math.cos(trajectory.raan));
        const z = r * (Math.sin(trajectory.argPerigee + trueAnomaly) * Math.sin(trajectory.inclination));

        points.push(new THREE.Vector3(x, y, z));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

    scene.add(orbitLine);
}

// Создание всех планет
const planetTextures = [
    '../static/img/mercury.jpg',
    '../static/img/venus.jpg',
    '../static/img/earth.jpg',
    '../static/img/mars.jpg',
    '../static/img/jupiter.jpg',
    '../static/img/saturn.jpg',
    '../static/img/uranus.jpg',
    '../static/img/neptune.jpg'
];

// Создание планет и их орбит
const planets = trajectories.map((trajectory, index) => {
    const planet = createPlanetWithTexture(trajectory.name, trajectory.size, planetTextures[index], trajectory.semiMajorAxis);
    createOrbit(trajectory);
    return planet;
});

function createAsteroidBelt() {
    const asteroidBelt = new THREE.Group();
    const asteroidCount = 3000; // Увеличено количество астероидов
    const minDistance = 6.2 * 100; // Минимальное расстояние от Солнца (в районе орбиты Марса)
    const maxDistance = 6.4 * 100; // Суженный диапазон расстояний для большей плотности

    for (let i = 0; i < asteroidCount; i++) {
        const radius = Math.random() * 1.5 + 0.1; // Слегка уменьшен средний размер астероидов
        const distance = THREE.MathUtils.randFloat(minDistance, maxDistance); // Случайное расстояние от Солнца
        const inclination = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-5, 5)); // Меньший разброс наклона

        // Позиция астероида по углу орбиты
        const angle = Math.random() * Math.PI * 2;
        const x = distance * Math.cos(angle);
        const y = distance * Math.sin(angle);
        const z = distance * Math.sin(inclination); // Небольшой разброс по высоте

        // Геометрия и материал для астероидов
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // Создание астероида
        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.position.set(x, y, z);

        asteroidBelt.add(asteroid);
    }

    scene.add(asteroidBelt);
}

// Вызов функции создания астероидного пояса
createAsteroidBelt();

function createMoon() {
    const moonGeometry = new THREE.SphereGeometry(1.737, 64, 64); // Радиус Луны (уменьшен в масштабах)
    const moonTexture = textureLoader.load('../static/img/moon.jpg');
    const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });

    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.renderOrder = 3; // Задаем приоритет рендеринга выше орбит

    scene.add(moon);
    return moon;
}

// Вызов функции создания Луны
const moon = createMoon();
let moonAngle = 0;


// Функция для обновления положения Луны на орбите вокруг Земли
function updateMoonPosition(deltaTime) {
    const earth = planets[2]; // Земля находится в индексе 2 в массиве планет
    const moonDistance = 15; // Условное расстояние от Земли до Луны в масштабах
    const moonSpeedMultiplier = 10; // Коэффициент ускорения вращения Луны
    moonAngle += deltaTime * moonSpeedMultiplier; // Увеличиваем угол вращения Луны

    const moonX = earth.position.x + moonDistance * Math.cos(moonAngle);
    const moonY = earth.position.y + moonDistance * Math.sin(moonAngle);
    const moonZ = earth.position.z;

    moon.position.set(moonX, moonY, moonZ);
}

// Переменная для хранения текущей планеты
let currentPlanetIndex = 0;
const planetNameText = document.createElement('div');
planetNameText.style.position = 'fixed';
planetNameText.style.bottom = '70px';
planetNameText.style.left = '50%';
planetNameText.style.transform = 'translateX(-50%)';
planetNameText.style.color = 'white';
planetNameText.style.fontSize = '24px';
planetNameText.style.zIndex = '1000';
document.body.appendChild(planetNameText);

// Функция обновления текста с названием планеты
function updatePlanetName() {
    planetNameText.innerHTML = trajectories[currentPlanetIndex].name; // Обновляем текст с названием планеты
}

// Начальная установка текста с названием планеты
updatePlanetName();

const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.backgroundColor = '#222';
buttonContainer.style.border = '1px solid #444';
buttonContainer.style.borderRadius = '8px';
buttonContainer.style.padding = '5px 10px';
buttonContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
buttonContainer.style.bottom = '20px';
buttonContainer.style.left = '50%';
buttonContainer.style.transform = 'translateX(-50%)';
buttonContainer.style.zIndex = '1000';
document.body.appendChild(buttonContainer);

const createStyledButton = (text, onClick) => {
    const button = document.createElement('button');
    button.innerHTML = text;
    button.style.margin = '0 5px';
    button.style.padding = '6px 10px';
    button.style.backgroundColor = '#476984';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.fontSize = '14px';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.3s ease';
    
    // Hover effects
    button.onmouseover = () => button.style.backgroundColor = '#5b8ea1';
    button.onmouseout = () => button.style.backgroundColor = '#476984';
    
    // Shadow effect
    button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    button.onclick = onClick;

    return button;
};

const leftButton = createStyledButton('←', () => {
    currentPlanetIndex = (currentPlanetIndex - 1 + planets.length) % planets.length;
    updatePlanetName();
    teleportToPlanet();
});

const rightButton = createStyledButton('→', () => {
    currentPlanetIndex = (currentPlanetIndex + 1) % planets.length;
    updatePlanetName();
    teleportToPlanet();
});

// Добавляем кнопки на контейнер
buttonContainer.appendChild(leftButton);
buttonContainer.appendChild(rightButton);


// Функция для телепортации камеры к планете
function teleportToPlanet() {
    const planet = planets[currentPlanetIndex];
    const distance = planet.userData.distance;

    // Устанавливаем позицию камеры близко к текущей планете
    camera.position.set(planet.position.x, planet.position.y, planet.position.z); // Задаем позицию выше и дальше от планеты
    camera.lookAt(planet.position.x, planet.position.y, planet.position.z); // Направление камеры на планету
}

function createSaturnRings(innerRadius, outerRadius, height, texturePath) {
    const geometry = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 64, 1, false);
    const ringTexture = textureLoader.load(texturePath);
    
    const material = new THREE.MeshStandardMaterial({
        map: ringTexture,
        side: THREE.DoubleSide // Делаем кольца видимыми с обеих сторон
    });
    
    const rings = new THREE.Mesh(geometry, material);
    rings.rotation.x = Math.PI / 2; // Поворачиваем кольца, чтобы они были горизонтально
    return rings;
}

// Создаем кольца Сатурна
const saturnRings = createSaturnRings(1.5, 35, 0.1, '../static/img/saturn_rings.png');
saturnRings.position.y = 0; // Позиция по оси Y
saturnRings.position.z = 0; // Позиция по оси Z

// Добавляем кольца к сцене и связываем их с Сатурном
const saturnIndex = 5; // Индекс Сатурна в массиве планет
scene.add(saturnRings);

// Анимация
function animate() {
    requestAnimationFrame(animate);

    // Обновление планет
    trajectories.forEach(trajectory => {
        const position = trajectory.propagate(0.01);
        const planetIndex = orbitalData.findIndex(data => data.name === trajectory.name);
        const planet = planets[planetIndex];
        planet.position.set(position.x, position.y, position.z);

        // Обновляем положение колец Сатурна
        if (trajectory.name === 'Saturn') {
            saturnRings.position.set(position.x, position.y, position.z); // Обновляем позицию колец
        }
    });

    updateMoonPosition(0.01);
    controls.update();
    renderer.render(scene, camera);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Запуск анимации
animate();

function togglePlanets() {
    planets.forEach(planet => planet.mesh.visible = !planet.mesh.visible);
}

// Адаптация к изменению размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.querySelector('.classic-btn').classList.add('active');

async function loadPlanetInfo() {
    const response = await fetch('/json');
    return await response.json();
}

let planetInfoData = {};

// Fetch the planet info when the script loads
loadPlanetInfo().then(data => {
    planetInfoDatas = data; // Store planet info in a variable
});

// Астероид Белт. Английская википедия
// Греки и Троянці. Анлийская википедия

function PlanetDataShow(name) {
    const overlay = document.getElementById('planetOverlay');
    const nameElement = document.getElementById('overlayPlanetName');
    const dataElement = document.getElementById('overlayPlanetData');
    const galleryElement = document.getElementById('overlayPlanetGallery');

    const planetInfo = planetInfoDatas[name];
    planetNameText.innerHTML = name

    if (planetInfo) {
        const characteristics = planetInfo.characteristics;

        // Заполняем текстовую информацию
        dataElement.innerHTML = `
            <strong>Діаметр:</strong> ${characteristics.diameter} <br>
            <strong>Маса:</strong> ${characteristics.mass} <br>
            <strong>Дистанція від Сонця:</strong> ${characteristics.average_distance_from_sun} <br>
            <strong>Довжина року:</strong> ${characteristics.year_length} <br>
            <strong>Температура:</strong> Мін.: ${characteristics.surface_temperature.min}, Макс.: ${characteristics.surface_temperature.max}, Середня: ${characteristics.surface_temperature.average} <br>
            <strong>Склад атмосфери:</strong> Нітроген: ${characteristics.atmosphere.nitrogen}, Оксиген: ${characteristics.atmosphere.oxygen}, Інше: ${characteristics.atmosphere.other_gases} <br>
        `;

        // Добавляем изображения
        galleryElement.innerHTML = "";
        for (let i = 1; i <= 3; i++) {
            const imgPath = `/static/photos/${name.toLowerCase()}_${i}.jpg`;
            const imgElement = document.createElement('img');
            imgElement.src = imgPath;
            imgElement.alt = `${name} Image ${i}`;
            imgElement.classList.add('planet-image');
            imgElement.onclick = function () {
                openFullScreen(imgPath);
            };
            galleryElement.appendChild(imgElement);
        }
    } else {
        dataElement.innerHTML = 'No data available.';
        galleryElement.innerHTML = '';
    }

    nameElement.textContent = name;
    overlay.style.display = 'flex';
}

// Открытие полноэкранного просмотра
function openFullScreen(imageSrc) {
    const fullScreenOverlay = document.getElementById('fullScreenOverlay');
    const fullScreenImg = document.getElementById('fullScreenImage');

    fullScreenImg.src = imageSrc;
    fullScreenOverlay.style.display = 'flex';
}

// Закрытие полноэкранного просмотра
function closeFullScreen() {
    document.getElementById('fullScreenOverlay').style.display = 'none';
}


function onDocumentMouseClick(event) {
    event.preventDefault();

    // Преобразуем координаты мыши в нормализованные значения для Raycaster (-1 до 1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Обновляем луч с текущей позицией камеры и направлением от мыши
    raycaster.setFromCamera(mouse, camera);

    // Проверяем пересечения с объектами (планетами)
    const intersects = raycaster.intersectObjects(planets);

    // Если есть пересечение, выводим в консоль название планеты
    if (intersects.length > 0) {
        const selectedPlanet = intersects[0].object
        PlanetDataShow(selectedPlanet.name)
        console.log(`Clicked on: ${selectedPlanet.name}`);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const chatToggle = document.getElementById("chatToggle");
    if (chatToggle) {
        chatToggle.addEventListener("click", toggleChat);
    }
    document.getElementById('planetOverlay').style.display = 'none';
});

document.getElementById('closeInfo').addEventListener('click', () => {
    document.getElementById('planetOverlay').style.display = 'none';
});
// Добавляем событие клика к документу
window.addEventListener('click', onDocumentMouseClick, false);
