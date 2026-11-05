(function () {
    const { esc, eur, getFoto } = window.api;

    function visual(p, classes, badge = '') {
        const foto = getFoto(p);
        const imagem = foto
            ? `<img class="plant-photo" src="${esc(foto)}" alt="${esc(p.nome)}" loading="lazy" onerror="this.remove()">`
            : '';
        const indisponivel = foto ? '' : ` role="img" aria-label="Fotografia indisponível de ${esc(p.nome)}"`;
        return `<div class="${classes} ${foto ? 'has-photo' : ''}" style="--h:${p.hue}"${indisponivel}>${imagem}${badge}</div>`;
    }

    function cartao(p, modo, info) {
        const col = modo === 'col';
        const abrir = col ? `abrirPlanta('${p.id}')` : `abrirEspecie('${p.id}')`;
        const rodape = col
            ? `<em class="pill ${info.d <= 0 ? 'due' : ''}">${info.t}</em>`
            : `<span>${p.intervaloRega}d entre regas</span>` + (info
                ? '<button class="mini" disabled>✓ Tens</button>'
                : `<button class="mini" onclick="event.stopPropagation();adicionarComprar('${p.id}')">${modo === 'loja' ? eur(p.preco) : '＋ Adicionar'}</button>`);
        return `<article class="card" onclick="${abrir}">
            ${visual(p, 'art', `<i class="lv">${p.nivel}</i>`)}
            <div class="mt"><b>${esc(p.nome)}</b><small>${esc(p.cientifico)}</small><div class="row">${rodape}</div></div>
        </article>`;
    }

    function chips(itens, chave, atual) {
        return `<div class="chips">${itens.map((i) => {
            const [v, t] = Array.isArray(i) ? i : [i, i === 'Todos' ? 'Todas' : i];
            return `<button class="chip ${atual === v ? 'on' : ''}" onclick="filtrar('${chave}','${v}')">${t}</button>`;
        }).join('')}</div>`;
    }

    function renderDica(catalogo) {
        const p = catalogo[Math.floor(Date.now() / 864e5) % catalogo.length];
        return `<div class="sec"><h2>Dica do dia</h2></div>
        <div class="tip">${visual(p, 'tip-photo')}<div><b>${esc(p.nome)}</b><p>${esc(p.dicas)}</p></div></div>`;
    }

    window.herbanarioFeed = { visual, cartao, chips, renderDica };
})();
