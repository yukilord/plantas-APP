const USERS_KEY = "herbanario_users";
const SESSION_KEY = "herbanario_session";

function lerUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function gravarUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessao() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

export function registar({ nome, email, password, nivel }) {
    const users = lerUsers();
    if (users.some((u) => u.email === email.toLowerCase())) {
        throw new Error("Já existe uma conta com este email.");
    }
    const user = {
        id: email.toLowerCase(),
        nome: nome.trim(),
        email: email.toLowerCase(),
        password,
        nivel
    };
    users.push(user);
    gravarUsers(users);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
}

export function login(email, password) {
    const user = lerUsers().find(
        (u) => u.email === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error("Email ou palavra-passe incorretos.");
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
}

export function atualizarNivel(nivel) {
    const sessao = getSessao();
    if (!sessao) return null;
    const users = lerUsers().map((u) =>
        u.email === sessao.email ? { ...u, nivel } : u
    );
    gravarUsers(users);
    const atualizado = { ...sessao, nivel };
    localStorage.setItem(SESSION_KEY, JSON.stringify(atualizado));
    return atualizado;
}
