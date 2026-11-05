const USERS_KEY = "herbanario_users";
const SESSAO_KEY = "herbanario_sessao";

function lerUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch {
        return [];
    }
}

function gravarUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
}

export function getSessao() {
    try {
        const raw = localStorage.getItem(SESSAO_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function logout() {
    localStorage.removeItem(SESSAO_KEY);
}

export function registar({ nome, email, password, nivel }) {
    const emailNormalizado = normalizarEmail(email);
    const lista = lerUsers();
    if (lista.some((u) => u.email === emailNormalizado)) {
        throw new Error("Já existe uma conta com este email.");
    }
    const user = {
        id: emailNormalizado,
        nome: String(nome || "").trim() || emailNormalizado.split("@")[0],
        email: emailNormalizado,
        password,
        nivel
    };
    lista.push(user);
    gravarUsers(lista);
    localStorage.setItem(SESSAO_KEY, JSON.stringify(user));
    return user;
}

export function login(email, password) {
    const emailNormalizado = normalizarEmail(email);
    const user = lerUsers().find(
        (u) => u.email === emailNormalizado && u.password === password
    );
    if (!user) throw new Error("Email ou palavra-passe incorretos.");
    localStorage.setItem(SESSAO_KEY, JSON.stringify(user));
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
    localStorage.setItem(SESSAO_KEY, JSON.stringify(atualizado));
    return atualizado;
}

export function atualizarPerfil(email, dados) {
    const emailNormalizado = normalizarEmail(email);
    const users = lerUsers();
    const indice = users.findIndex((user) => user.email === emailNormalizado);
    if (indice < 0) throw new Error("Conta não encontrada.");

    const nomeProposto = dados && Object.prototype.hasOwnProperty.call(dados, "nome")
        ? dados.nome
        : users[indice].nome;

    const atualizado = {
        ...users[indice],
        ...dados,
        email: emailNormalizado,
        nome: String(nomeProposto || "").trim() || "Jardineiro"
    };
    users[indice] = atualizado;
    gravarUsers(users);

    const sessao = getSessao();
    if (sessao?.email === emailNormalizado) {
        localStorage.setItem(SESSAO_KEY, JSON.stringify(atualizado));
    }

    return atualizado;
}
