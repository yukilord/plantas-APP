export function initFeed() {
    console.log("Feed componente carregado.");
}
export function uid() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

export function hojeISO() {
    return new Date().toISOString().split('T')[0];
}

export function adicionarDias(dataStr, dias) {
    const d = new Date(dataStr);
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
}