import * as api from "./api.js";
import * as auth from "./modules/auth.js";
import { initHeader } from "./components/header.js";
import { initFeed } from "./components/feed.js";

let modoAuth = 'login';
let utilizadorAtual = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();
    registarServiceWorker();
    initHeader();
    initFeed();
});

function registarServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
    }
}

function verificarSessao() {
    const user = auth.getSessao();
    if (user) {
        utilizadorAtual = user;
        document.getElementById('auth-modal').classList.add('hidden');
        carregarEcraHoje();
        carregarPerfil();
    } else {
        document.getElementById('auth-modal').classList.remove('hidden');
    }
}

window.alternarAuth = function(modo) {
    modoAuth = modo;
    document.getElementById('auth-error').classList.add('hidden');
    document.getElementById('tab-login').classList.toggle('active', modo === 'login');
    document.getElementById('tab-register').classList.toggle('active', modo === 'register');
    document.getElementById('group-nome').style.display = modo === 'register' ? 'block' : 'none';
    document.getElementById('group-nivel').style.display = modo === 'register' ? 'block' : 'none';
    document.getElementById('btn-auth-submit').innerText = modo === 'login' ? 'Entrar' : 'Criar Conta';
};

window.submeterAuth = function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-pass').value;
    const mensagemErro = document.getElementById('auth-error');

    try {
        if (modoAuth === 'register') {
            const nome = document.getElementById('auth-nome').value || email.split('@')[0];
            const nivel = document.getElementById('auth-nivel').value;
            utilizadorAtual = auth.registar({ nome, email, password, nivel });
        } else {
            utilizadorAtual = auth.login(email, password);
        }
    } catch (error) {
        mensagemErro.textContent = error.message || 'Não foi possível autenticar. Tenta novamente.';
        mensagemErro.classList.remove('hidden');
        return;
    }

    mensagemErro.classList.add('hidden');
    document.getElementById('form-auth').reset();
    document.getElementById('auth-modal').classList.add('hidden');
    carregarEcraHoje();
    carregarPerfil();
};

window.logout = function() {
    auth.logout();
    location.reload();
};

window.navegar = function(screenId) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    const target = document.getElementById(`screen-${screenId}`);
    if (target) target.classList.remove('hidden');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    if (screenId === 'hoje') carregarEcraHoje();
    if (screenId === 'descobrir') carregarDescobrir();
    if (screenId === 'loja') carregarLoja();
    if (screenId === 'colecao') carregarColecao();
    if (screenId === 'lembretes') carregarLembretes();
    if (screenId === 'perfil') carregarPerfil();
};

function carregarEcraHoje() {
    if (!utilizadorAtual) return;
    document.getElementById('boas-vindas-user').innerText = `Bom dia, ${utilizadorAtual.nome}`;
    const colecao = api.getColecao(utilizadorAtual.email);
    const pendentes = colecao.filter(p => api.precisaRegaHoje(p.proximaRega));
    
    const cardDestaque = document.getElementById('card-destaque-rega');
    if (pendentes.length > 0) {
        cardDestaque.dataset.plantaId = pendentes[0].id;
        document.getElementById('rega-destaque-titulo').innerText = pendentes[0].nome;
        document.getElementById('rega-destaque-desc').innerText = `Necessita de rega hoje.`;
    } else {
        cardDestaque.dataset.plantaId = "";
        document.getElementById('rega-destaque-titulo').innerText = "Tudo regado!";
        document.getElementById('rega-destaque-desc').innerText = "As tuas plantas estão hidratadas.";
    }

    document.getElementById('lista-hoje-colecao').innerHTML = colecao.slice(0, 2).map(p => criarCard(p, false)).join('') || '<p class="muted">Sem plantas.</p>';
}

window.regardestaque = function() {
    const id = document.getElementById('card-destaque-rega').dataset.plantaId;
    if (!id) return;
    api.marcarRega(utilizadorAtual.email, id);
    carregarEcraHoje();
};

window.reagendarDestaque = function() {
    const id = document.getElementById('card-destaque-rega').dataset.plantaId;
    if (!id) return;
    api.reagendarRega(utilizadorAtual.email, id);
    carregarEcraHoje();
};

function carregarDescobrir(nivel = 'Todos') {
    const catalogo = api.getCatalogo();
    const filtrados = (nivel === 'Todos') ? catalogo : catalogo.filter(p => p.nivel.toLowerCase() === nivel.toLowerCase());
    document.getElementById('lista-recomendacoes').innerHTML = filtrados.map(p => criarCard(p, true)).join('');
}

window.filtrarRecomendacoes = function(nivel) {
    document.querySelectorAll('.tabs-filter .chip').forEach(c => c.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    carregarDescobrir(nivel);
};

function carregarLoja() {
    filtrarLoja();
}

window.filtrarLoja = function() {
    const query = document.getElementById('search-loja').value;
    const resultados = api.filtrarCatalogo({ texto: query });
    document.getElementById('lista-loja').innerHTML = resultados.map(p => `
        <div class="plant-card">
            <img src="${p.img}" alt="${p.nome}">
            <h4>${p.nome}</h4>
            <p class="muted">${p.preco}</p>
            <button class="btn btn-soft" onclick="adicionarComprar('${p.id}')">Adicionar</button>
        </div>
    `).join('');
};

window.adicionarComprar = function(id) {
    const especie = api.getCatalogo().find(p => p.id === id);
    if (especie) {
        api.adicionarAColecao(utilizadorAtual.email, especie);
        mostrarToast("Adicionado à coleção!");
    }
};

function carregarColecao() {
    const colecao = api.getColecao(utilizadorAtual.email);
    document.getElementById('lista-minhas-plantas').innerHTML = colecao.map(p => `
        <div class="plant-card">
            <img src="${p.img}" alt="${p.nome}">
            <h4>${p.nome}</h4>
            <div class="inline-actions">
                <button class="btn btn-soft" onclick="editarPlanta('${p.id}')">Editar</button>
                <button class="btn btn-danger" onclick="removerPlanta('${p.id}')">Apagar</button>
            </div>
        </div>
    `).join('') || '<p class="muted">Vazio.</p>';
}

window.abrirModalPlanta = function() {
    document.getElementById('form-planta').reset();
    document.getElementById('planta-id').value = "";
    document.getElementById('modal-planta-title').innerText = "Nova Planta";
    document.getElementById('modal-planta').classList.remove('hidden');
};

window.fecharModalPlanta = function() {
    document.getElementById('modal-planta').classList.add('hidden');
};

window.guardarFormPlanta = function(e) {
    e.preventDefault();
    const planta = {
        id: document.getElementById('planta-id').value || null,
        nome: document.getElementById('planta-nome').value,
        cientifico: document.getElementById('planta-cientifico').value,
        tipo: document.getElementById('planta-tipo').value,
        nivel: document.getElementById('planta-nivel').value,
        intervaloRega: parseInt(document.getElementById('planta-intervalo').value) || 7,
        img: document.getElementById('planta-img').value || 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80',
        dicas: document.getElementById('planta-dicas').value
    };
    api.guardarPlanta(utilizadorAtual.email, planta);
    fecharModalPlanta();
    carregarColecao();
};

window.editarPlanta = function(id) {
    const p = api.getColecao(utilizadorAtual.email).find(i => i.id === id);
    if (!p) return;
    document.getElementById('planta-id').value = p.id;
    document.getElementById('planta-nome').value = p.nome;
    document.getElementById('planta-cientifico').value = p.cientifico || '';
    document.getElementById('planta-tipo').value = p.tipo || 'interior';
    document.getElementById('planta-nivel').value = p.nivel || 'Iniciante';
    document.getElementById('planta-intervalo').value = p.intervaloRega || 7;
    document.getElementById('planta-img').value = p.img || '';
    document.getElementById('planta-dicas').value = p.dicas || '';
    document.getElementById('modal-planta-title').innerText = "Editar Planta";
    document.getElementById('modal-planta').classList.remove('hidden');
};

window.removerPlanta = function(id) {
    if (confirm("Remover planta?")) {
        api.eliminarPlanta(utilizadorAtual.email, id);
        carregarColecao();
    }
};

function carregarLembretes() {
    const colecao = api.getColecao(utilizadorAtual.email);
    document.getElementById('lista-lembretes').innerHTML = colecao.map(p => `
        <div class="lembrete-card ${api.precisaRegaHoje(p.proximaRega) ? 'pendente' : 'ok'}">
            <div><h4>${p.nome}</h4><p class="muted">Próxima: ${p.proximaRega}</p></div>
            <div class="inline-actions">
                <button class="btn btn-primary" onclick="api.marcarRega('${utilizadorAtual.email}', '${p.id}'); carregarLembretes();">Regar</button>
            </div>
        </div>
    `).join('') || '<p class="muted">Sem lembretes.</p>';
}

function carregarPerfil() {
    if (!utilizadorAtual) return;
    document.getElementById('profile-nome').innerText = utilizadorAtual.nome;
    document.getElementById('profile-email').innerText = utilizadorAtual.email;
    document.getElementById('profile-nivel').innerText = `Nível: ${utilizadorAtual.nivel}`;
    document.getElementById('profile-avatar').innerText = utilizadorAtual.nome.charAt(0).toUpperCase();
}

function criarCard(p, btn) {
    return `
        <div class="plant-card">
            <img src="${p.img}" alt="${p.nome}">
            <h4>${p.nome}</h4>
            <p class="muted">${p.nivel || 'Intermédio'}</p>
            ${btn ? `<button class="btn btn-soft" onclick="adicionarComprar('${p.id}')">＋ Coleção</button>` : ''}
        </div>
    `;
}

function mostrarToast(txt) {
    const t = document.getElementById('toast');
    t.innerText = txt;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}