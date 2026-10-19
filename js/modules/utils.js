export function $(id) {
    return document.getElementById(id);
}

export function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

export function eur(value) {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

export function opt(options, selected = "") {
    const entries = Array.isArray(options)
        ? options.map((value) => [value, value])
        : Object.entries(options);

    return entries.map(([value, label]) =>
        `<option value="${esc(value)}" ${String(value) === String(selected) ? "selected" : ""}>${esc(label)}</option>`
    ).join("");
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

export function diasAte(dataISO) {
    const data = Date.parse(`${dataISO}T00:00:00Z`);
    const hoje = Date.parse(`${hojeISO()}T00:00:00Z`);
    return Math.round((data - hoje) / 86400000);
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
