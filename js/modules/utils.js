export function $(id) {
    return document.getElementById(id);
}

export function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

export function hojeISO() {
    return new Date().toISOString().slice(0, 10);
}

export function adicionarDias(dataISO, dias) {
    const d = new Date(dataISO + "T12:00:00");
    d.setDate(d.getDate() + Number(dias));
    return d.toISOString().slice(0, 10);
}

export function saudacao() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 19) return "Boa tarde";
    return "Boa noite";
}

export function mostrarToast(texto) {
    const el = $("toast");
    el.textContent = texto;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2400);
}

export function confirmar(texto) {
    return window.confirm(texto);
}

export function precisaRega(planta) {
    if (!planta.proximaRega) return false;
    return planta.proximaRega <= hojeISO();
}
