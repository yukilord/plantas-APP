(function () {
    const api = window.api;
    const { NIVEIS, TIPOS } = api;
    const { $, esc, eur, opt, diasAte } = api;
    const { initHeader, marcarNav, fan } = window.herbanarioHeader;
    const { cartao, chips, renderDica } = window.herbanarioFeed;

    let utilizadorAtual = null;
    let ecra = 'hoje';
    let bloqueado = false;
    const F = { n: 'Todos', t: 'Todos', q: '' };

    document.addEventListener('DOMContentLoaded', () => {
        aplicarTema();
        initHeader();
        registarServiceWorker();
        $('sh').onclick = (e) => { if (e.target.id === 'sh' && !bloqueado) fecharPainel(); };
        verificarSessao();
    });

    function registarServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch((err) => console.log(err));
        }
    }

    const painel = (html, trancar = false) => {
        bloqueado = trancar;
        $('pn').innerHTML = '<div class="grab"></div>' + html;
        $('sh').classList.add('o');
    };

    function fecharPainel() { bloqueado = false; $('sh').classList.remove('o'); }
    window.fecharPainel = fecharPainel;

    let temporizador;
    function mostrarToast(txt) {
        const t = $('ts');
        t.textContent = txt;
        t.classList.add('show');
        clearTimeout(temporizador);
        temporizador = setTimeout(() => t.classList.remove('show'), 2300);
    }

    const estado = (p) => {
        const d = diasAte(p.proximaRega);
        return { d, t: d < 0 ? `Atrasada ${-d}d` : d === 0 ? 'Regar hoje' : d === 1 ? 'Amanhã' : `em ${d} dias` };
    };
    const minhas = () => api.getColecao(utilizadorAtual.email).map((p) => ({ p, ...estado(p) })).sort((a, b) => a.d - b.d);
    const jaTem = (especieId) => api.getColecao(utilizadorAtual.email).some((p) => p.especieId === especieId);
    const inicial = () => esc((utilizadorAtual.nome || 'H')[0].toUpperCase());
    const cab = (k, t, extra = '') => `<div class="hd"><div><span class="k">${k}</span><h1>${t}</h1></div>${extra}</div>`;
    const vazio = '<div class="em0"><span>🪴</span>Ainda não tens plantas. Explora a Loja ou toca em ＋ para criar uma.</div>';

    function verificarSessao() {
        const user = api.getSessao();
        if (user) {
            utilizadorAtual = user;
            window.navegar('hoje');
        } else {
            abrirAuth('login');
        }
    }

    function abrirAuth(modo) {
        const r = modo === 'register';
        painel(`<h2 class="sn">${r ? 'Criar conta' : 'Entrar no Herbanário'}</h2>
        <div class="chips" style="margin:12px 0"><button class="chip ${r ? '' : 'on'}" onclick="alternarAuth('login')">Entrar</button><button class="chip ${r ? 'on' : ''}" onclick="alternarAuth('register')">Registar</button></div>
        <form onsubmit="submeterAuth(event,'${modo}')">
            <label class="f">Email<input id="a1" type="email" required placeholder="exemplo@email.com" autocomplete="email"></label>
            <label class="f">Palavra-passe<input id="a2" type="password" required placeholder="••••••••" autocomplete="${r ? 'new' : 'current'}-password"></label>
            ${r ? `<label class="f">Nome<input id="a3" placeholder="O teu nome" autocomplete="name"></label>
            <label class="f">Nível de experiência<select id="a4">${opt(NIVEIS)}</select></label>` : ''}
            <p class="err" id="ae" role="alert"></p>
            <button class="big">${r ? 'Criar conta' : 'Entrar'}</button>
        </form>`, true);
    }

    window.alternarAuth = (modo) => abrirAuth(modo);

    window.submeterAuth = (e, modo) => {
        e.preventDefault();
        const email = $('a1').value.trim(), password = $('a2').value;
        try {
            if (modo === 'register') {
                const nome = $('a3').value.trim() || email.split('@')[0];
                const nivel = $('a4').value;
                utilizadorAtual = api.registar({ nome, email, password, nivel });
                api.semear(utilizadorAtual.email, nivel);
            } else {
                utilizadorAtual = api.login(email, password);
            }
        } catch (erro) {
            $('ae').textContent = erro.message || 'Não foi possível autenticar. Tenta novamente.';
            return;
        }
        fecharPainel();
        window.navegar('hoje');
    };

    window.logout = () => {
        api.logout();
        location.reload();
    };

    window.navegar = (id) => {
        if (!utilizadorAtual) return;
        ecra = id;
        fan(0);
        fecharPainel();
        desenhar();
        scrollTo(0, 0);
        marcarNav(id);
    };

    function desenhar() {
        if (utilizadorAtual) $('v').innerHTML = ECRAS[ecra]();
    }

    window.filtrar = (chave, valor) => { F[chave] = valor; desenhar(); };

    const ECRAS = {
        hoje() {
            const l = minhas(), pend = l.filter((x) => x.d <= 0), f = pend[0];
            const pc = l.length ? (l.length - pend.length) / l.length : 0;
            const h = new Date().getHours(), g = h < 6 || h >= 20 ? 'Boa noite' : h < 12 ? 'Bom dia' : 'Boa tarde';
            const data = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
            return `${cab(data, `${g},${esc(utilizadorAtual.nome)}`, `<button class="av" onclick="navegar('perfil')" aria-label="Perfil">${inicial()}</button>`) }
            <section class="hero"><div class="tx"><span class="bd">${f ? 'Rega de hoje' : 'Jardim em dia'}</span>
                <h3>${!l.length ? 'Começa o teu jardim' : f ? esc(f.p.nome) + (pend.length > 1 ? ` +${pend.length - 1}` : '') : 'Tudo regado ✨'}</h3>
                <p>${!l.length ? 'Adiciona a tua primeira planta.' : f ? (f.d < 0 ? `Atrasada ${-f.d} dia(s). ` : '') + 'Está com sede.' : `Próxima: ${esc(l[0].p.nome)},${l[0].t}.`}</p>
                <div class="bt">${f ? `<button class="b w" onclick="regardestaque('${f.p.id}')">💧 Reguei agora</button><button class="b g" onclick="reagendarDestaque('${f.p.id}')">+1 dia</button>` : !l.length ? `<button class="b w" onclick="navegar('descobrir')">Descobrir plantas</button>` : ''}</div></div>
                <svg class="ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="8"/><circle cx="40" cy="40" r="34" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="213.6" stroke-dashoffset="${213.6 * (1 - pc)}" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">${Math.round(pc * 100)}%</text></svg>
            </section>
            <div class="sec"><h2>A tua coleção</h2><a onclick="navegar('colecao')">Ver tudo</a></div>
            ${l.length ? `<div class="hs">${l.map((x) => cartao(x.p, 'col', x)).join('')}</div>` : vazio}
            ${renderDica(api.getCatalogo())}`;
        },

        descobrir() {
            const lista = api.filtrarCatalogo({ nivel: F.n === 'Todos' ? '' : F.n });
            return cab('Encontra a tua próxima planta', 'Descobrir') + chips(['Todos', ...NIVEIS], 'n', F.n) +
                `<div class="g">${lista.map((p) => cartao(p, 'cat', jaTem(p.id))).join('')}</div>`;
        },

        loja() {
            return cab('Catálogo e loja', 'A Loja') +
                `<input class="sr" placeholder="Pesquisar plantas…" value="${esc(F.q)}" oninput="filtrarLoja(this.value)">` +
                chips([['Todos', 'Todas'], ...Object.entries(TIPOS)], 't', F.t) +
                `<div class="g" id="lista-loja">${gradeLoja()}</div>`;
        },

        colecao() {
            const l = minhas();
            return cab('A tua coleção pessoal', 'As minhas plantas', `<button class="mini" style="margin-top:8px;padding:10px 14px" onclick="novaPlanta()">＋ Nova</button>`) +
                `<div class="g" style="margin-top:18px">${l.map((x) => cartao(x.p, 'col', x)).join('')}</div>` + (l.length ? '' : vazio);
        },

        lembretes() {
            const l = minhas();
            const semana = [0, 1, 2, 3, 4, 5, 6].map((i) => {
                const dt = new Date(Date.now() + i * 864e5);
                const n = l.filter((x) => (i === 0 ? x.d <= 0 : x.d === i)).length;
                return `<div class="dy ${n ? 'on' : ''}">${dt.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}<b>${n || dt.getDate()}</b></div>`;
            }).join('');
            return cab('Gestão de cuidados', 'Lembretes de rega') + `<div class="wk">${semana}</div>` +
                (l.map((x) => `<div class="it" onclick="abrirPlanta('${x.p.id}')"><div class="eb" style="--h:${x.p.hue}">${x.p.emoji}</div>
                    <div class="in"><b>${esc(x.p.nome)}</b><small>A cada ${x.p.intervaloRega} dias</small></div>
                    <em class="pill ${x.d <= 0 ? 'due' : ''}">${x.t}</em>
                    <button class="wb" aria-label="Regar" onclick="event.stopPropagation();regar('${x.p.id}')">💧</button></div>`).join('') || vazio);
        },

        perfil() {
            const l = minhas(), tema = localStorage.getItem('herbanario_tema') || '';
            return `${cab('Definições da conta', 'O meu perfil')}
            <div class="pc"><div class="av">${inicial()}</div><div><b>${esc(utilizadorAtual.nome)}</b><small>${esc(utilizadorAtual.email)}</small><small>Nível: ${utilizadorAtual.nivel}</small></div></div>
            <div class="ft st"><div><b>${l.length}</b>plantas</div><div><b>${l.filter((x) => x.d > 0).length}</b>em dia</div><div><b>${l.filter((x) => x.d <= 0).length}</b>a regar</div></div>
            <label class="f">Nome<input value="${esc(utilizadorAtual.nome)}" onchange="guardarPerfil({nome:this.value.trim()||'Jardineiro'})"></label>
            <label class="f">Nível de experiência<select onchange="guardarPerfil({nivel:this.value})">${opt(NIVEIS, utilizadorAtual.nivel)}</select></label>
            <label class="f">Tema<select onchange="mudarTema(this.value)"><option value="">Automático</option><option value="light" ${tema === 'light' ? 'selected' : ''}>Claro</option><option value="dark" ${tema === 'dark' ? 'selected' : ''}>Escuro</option></select></label>
            <button class="big d" onclick="logout()">Terminar sessão</button>`;
        }
    };

    const gradeLoja = () => {
        const lista = api.filtrarCatalogo({ texto: F.q, tipo: F.t === 'Todos' ? '' : F.t });
        return lista.map((p) => cartao(p, 'loja', jaTem(p.id))).join('') || '<div class="em0">Nenhuma planta encontrada.</div>';
    };
    window.filtrarLoja = (valor) => { F.q = valor; $('lista-loja').innerHTML = gradeLoja(); };

    window.guardarPerfil = (dados) => {
        utilizadorAtual = api.atualizarPerfil(utilizadorAtual.email, dados);
        desenhar();
    };

    function aplicarTema() {
        const t = localStorage.getItem('herbanario_tema');
        if (t) document.documentElement.dataset.theme = t;
    }
    window.mudarTema = (v) => {
        if (v) { localStorage.setItem('herbanario_tema', v); document.documentElement.dataset.theme = v; }
        else { localStorage.removeItem('herbanario_tema'); delete document.documentElement.dataset.theme; }
    };

    const daColecao = (id) => api.getColecao(utilizadorAtual.email).find((p) => p.id === id);

    window.regar = (id) => {
        const p = daColecao(id);
        api.marcarRega(utilizadorAtual.email, id);
        mostrarToast(`💧 ${p.nome} regada`);
        try { navigator.vibrate(30); } catch (e) {}
        desenhar();
    };
    window.regardestaque = (id) => window.regar(id);
    window.reagendarDestaque = (id) => {
        api.reagendarRega(utilizadorAtual.email, id);
        mostrarToast('Reagendada para amanhã');
        desenhar();
    };

    const factos = (p, extra) => `<div class="ft"><div>Rega<b>A cada ${p.intervaloRega} dias</b></div><div>Luz<b>${esc(p.luz || '—')}</b></div><div>Tipo<b>${TIPOS[p.tipo] || '—'}</b></div>${extra}</div>`;
    const topo = (p) => `<div class="art big" style="--h:${p.hue}"><span>${p.emoji}</span><i class="lv">${p.nivel}</i></div><h2 class="sn">${esc(p.nome)}</h2><small class="sc">${esc(p.cientifico)}</small>`;

    window.abrirEspecie = (id) => {
        const p = api.getCatalogo().find((x) => x.id === id);
        painel(`${topo(p)}${factos(p, `<div>Preço<b>${eur(p.preco)}</b></div>`)}<p class="dc">${esc(p.dicas)}</p>
        <button class="big" onclick="adicionarComprar('${id}');fecharPainel()">＋ Adicionar à coleção</button>
        <button class="big s" onclick="fecharPainel()">Fechar</button>`);
    };

    window.abrirPlanta = (id) => {
        const p = daColecao(id), s = estado(p);
        painel(`${topo(p)}${factos(p, `<div>Próxima rega<b>${s.t}</b></div>`)}<p class="dc">${esc(p.dicas || 'Sem notas.')}</p>
        <button class="big" onclick="regar('${id}');fecharPainel()">💧 Reguei agora</button>
        <button class="big s" onclick="editarPlanta('${id}')">Editar</button>
        <button class="big d" onclick="removerPlanta('${id}')">Remover da coleção</button>`);
    };

    window.adicionarComprar = (id) => {
        const especie = api.getCatalogo().find((p) => p.id === id);
        if (!especie) return;
        api.adicionarAColecao(utilizadorAtual.email, especie);
        mostrarToast(`🌱 ${especie.nome} adicionada à coleção`);
        desenhar();
    };

    window.removerPlanta = (id) => {
        if (!confirm('Remover esta planta da coleção?')) return;
        api.eliminarPlanta(utilizadorAtual.email, id);
        fecharPainel();
        mostrarToast('Planta removida');
        desenhar();
    };

    const EMOJIS = ['🪴', '🌿', '🌵', '🌸', '🌺', '🌻', '🌷', '🌴', '🍃', '🍀'];

    function formulario(p = {}) {
        painel(`<h2 class="sn">${p.id ? 'Editar planta' : 'Nova planta'}</h2>
        <label class="f">Emoji<select id="n1">${opt(EMOJIS, p.emoji)}</select></label>
        <label class="f">Nome comum<input id="n2" value="${esc(p.nome || '')}"></label>
        <label class="f">Nome científico<input id="n3" value="${esc(p.cientifico || '')}"></label>
        <div class="two"><label class="f">Tipo<select id="n4">${opt(TIPOS, p.tipo)}</select></label>
        <label class="f">Nível<select id="n5">${opt(NIVEIS, p.nivel)}</select></label></div>
        <label class="f">Regar a cada (dias)<input id="n6" type="number" min="1" value="${p.intervaloRega || 7}"></label>
        <label class="f">Dicas<textarea id="n7" rows="2">${esc(p.dicas || '')}</textarea></label>
        <button class="big" onclick="guardarFormPlanta('${p.id || ''}')">Guardar planta</button>
        <button class="big s" onclick="fecharPainel()">Cancelar</button>`);
    }

    window.novaPlanta = () => { fan(0); formulario(); };
    window.editarPlanta = (id) => formulario(daColecao(id));

    window.guardarFormPlanta = (id) => {
        const nome = $('n2').value.trim();
        if (!nome) return mostrarToast('Dá um nome à planta');
        const planta = {
            ...(id ? daColecao(id) : {}),
            id: id || undefined,
            emoji: $('n1').value,
            nome,
            cientifico: $('n3').value.trim() || '—',
            tipo: $('n4').value,
            nivel: $('n5').value,
            intervaloRega: Math.max(1, parseInt($('n6').value) || 7),
            dicas: $('n7').value.trim()
        };
        api.guardarPlanta(utilizadorAtual.email, planta);
        mostrarToast(id ? 'Planta atualizada' : `🌱 ${nome} criada`);
        window.navegar('colecao');
    };
})();
