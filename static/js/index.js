document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");
    
    if (token) {
        document.getElementById("registerBtn").style.display = "none";
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "inline-block";
    }
});
function redirectToClassic() {
    window.location.href = '/classic';
}

// Функции переходов
function redirectToRegister() {
    window.location.href = "/auth/register";
}

function redirectToLogin() {
    window.location.href = "/auth/login";
}

// Функция выхода
function logout() {
    localStorage.removeItem("token"); // Удаляем токен из localStorage
    window.location.href = "/"; // Перенаправляем на главную страницу
}
