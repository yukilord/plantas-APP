import { uid, hojeISO, adicionarDias } from "./modules/utils.js";

const CATALOGO_KEY = "herbanario_catalogo";
const COLECAO_KEY = "herbanario_colecao";

const CATALOGO_INICIAL = [
    {
        id: "monstera",
        nome: "Monstera",
        cientifico: "Monstera deliciosa",
        tipo: "interior",
        nivel: "Intermédio",
        preco: "28,00 €",
        intervaloRega: 7,
        luz: "Luz indireta brilhante",
        solo: "Húmido, bem drenado",
        dicas: "Limpa as folhas grandes e evita sol direto.",
        img: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "lingua-de-sogra",
        nome: "Língua-de-sogra",
        cientifico: "Dracaena trifasciata",
        tipo: "interior",
        nivel: "Iniciante",
        preco: "18,00 €",
        intervaloRega: 14,
        luz: "Pouca a média luz",
        solo: "Seco, bem drenado",
        dicas: "Deixa o solo secar bem entre regas.",
        img: "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jiboia",
        nome: "Jibóia",
        cientifico: "Epipremnum aureum",
        tipo: "interior",
        nivel: "Iniciante",
        preco: "16,00 €",
        intervaloRega: 7,
        luz: "Luz indireta",
        solo: "Ligeiramente húmido",
        dicas: "Cresce bem em vaso suspenso.",
        img: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "echeveria",
        nome: "Echeveria",
        cientifico: "Echeveria elegans",
        tipo: "ornamental",
        nivel: "Avançado",
        preco: "12,00 €",
        intervaloRega: 14,
        luz: "Muito sol",
        solo: "Arenoso para suculentas",
        dicas: "Não molhes as folhas diretamente.",
        img: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80"
    }
];

function colecaoTodos() {
    return JSON.parse(localStorage.getItem(COLECAO_KEY) || "{}");
}

export function getCatalogo() {
    const guardado = localStorage.getItem(CATALOGO_KEY);
    if (!guardado) {
        localStorage.setItem(CATALOGO_KEY, JSON.stringify(CATALOGO_INICIAL));
        return CATALOGO_INICIAL;
    }
    return JSON.parse(guardado);
}

export function getColecao(email) {
    return colecaoTodos()[email] || [];
}

function gravarColecao(email, plantas) {
    const dados = colecaoTodos();
    dados[email] = plantas;
    localStorage.setItem(COLECAO_KEY, JSON.stringify(dados));
}

export function adicionarAColecao(email, especie) {
    const lista = getColecao(email);
    const planta = {
        ...especie,
        id: uid(),
        especieId: especie.id,
        proximaRega: hojeISO()
    };
    lista.push(planta);
    gravarColecao(email, lista);
    return planta;
}

export function guardarPlanta(email, planta) {
    const lista = getColecao(email);
    if (planta.id) {
        const i = lista.findIndex((p) => p.id === planta.id);
        if (i >= 0) lista[i] = { ...lista[i], ...planta };
    } else {
        planta.id = uid();
        planta.proximaRega = hojeISO();
        lista.push(planta);
    }
    gravarColecao(email, lista);
}

export function eliminarPlanta(email, id) {
    gravarColecao(email, getColecao(email).filter((p) => p.id !== id));
}

export function marcarRega(email, id) {
    const lista = getColecao(email).map((p) => {
        if (p.id !== id) return p;
        return { ...p, proximaRega: adicionarDias(hojeISO(), p.intervaloRega || 7) };
    });
    gravarColecao(email, lista);
}

export function reagendarRega(email, id) {
    const lista = getColecao(email).map((p) => {
        if (p.id !== id) return p;
        const base = p.proximaRega && p.proximaRega > hojeISO() ? p.proximaRega : hojeISO();
        return { ...p, proximaRega: adicionarDias(base, 1) };
    });
    gravarColecao(email, lista);
}

export function precisaRegaHoje(proximaRegaData) {
    if (!proximaRegaData) return true;
    return proximaRegaData <= hojeISO();
}

export function filtrarCatalogo({ texto = "", tipo = "", nivel = "" } = {}) {
    const q = texto.trim().toLowerCase();
    return getCatalogo().filter((p) => {
        const nomeOk = !q || p.nome.toLowerCase().includes(q) || (p.cientifico && p.cientifico.toLowerCase().includes(q));
        const tipoOk = !tipo || p.tipo === tipo;
        const nivelOk = !nivel || p.nivel === nivel;
        return nomeOk && tipoOk && nivelOk;
    });
}