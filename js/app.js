(function () {
    const api = window.api;
    const { NIVEIS, TIPOS } = api;
    const { $, esc, opt, diasAte } = api;
    const { initHeader, marcarNav, fan } = window.herbanarioHeader;
    const { visual, cartao, chips, renderDica } = window.herbanarioFeed;

    let utilizadorAtual = null;
    let ecra = 'hoje';
    let bloqueado = false;
    const F = { n: 'Todos' };
    let mesOffset = 0;   // 0 = mês atual no calendário de regas
    let diaSel = null;   // dia escolhido no calendário (ISO)

    document.addEventListener('DOMContentLoaded', () => {
        aplicarTema();
        initHeader();
        registarServiceWorker();
        $('sh').onclick = (e) => { if (e.target.id === 'sh' && !bloqueado) fecharPainel(); };
        window.addEventListener('firebase-sync-error', (e) => {
            mostrarToast(`Erro ao sincronizar com Firebase: ${e.detail}`);
        });
        window.addEventListener('firebase-auth-error', (e) => {
            mostrarToast(`Erro de autenticação Firebase: ${e.detail}`);
        });
        api.inicializar().then(verificarSessao);
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

    function fecharPainel() { bloqueado = false; acaoConfirmada = null; $('sh').classList.remove('o'); }
    window.fecharPainel = fecharPainel;

    // Confirmação dentro da app: o confirm() do browser é bloqueado em alguns
    // browsers e apps instaladas, e aí devolve "Cancelar" sem mostrar nada.
    let acaoConfirmada = null;
    function confirmar(titulo, texto, rotuloBotao, acao) {
        painel(`<h2 class="sn">${titulo}</h2><p class="dc">${texto}</p>
            <button class="big d" id="confirmar-acao" onclick="executarConfirmacao()">${rotuloBotao}</button>
            <button class="big s" onclick="fecharPainel()">Cancelar</button>`);
        acaoConfirmada = acao;
    }
    window.executarConfirmacao = () => {
        const acao = acaoConfirmada;
        fecharPainel();
        if (acao) acao();
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('sh').classList.contains('o') && !bloqueado) fecharPainel();
    });

    const MENSAGENS_AUTH = {
        'auth/invalid-credential': 'Email ou palavra-passe incorretos.',
        'auth/wrong-password': 'Email ou palavra-passe incorretos.',
        'auth/user-not-found': 'Não existe nenhuma conta com este email.',
        'auth/invalid-email': 'O email não é válido.',
        'auth/email-already-in-use': 'Já existe uma conta com este email. Escolhe Entrar.',
        'auth/weak-password': 'A palavra-passe tem de ter pelo menos 6 caracteres.',
        'auth/too-many-requests': 'Demasiadas tentativas. Espera um pouco e tenta outra vez.',
        'auth/network-request-failed': 'Sem ligação à internet. Verifica a ligação e tenta novamente.',
        'auth/unauthorized-domain': 'Este domínio não está autorizado nas definições do Firebase Authentication.',
        'auth/account-exists-with-different-credential': 'Já existe uma conta com este email. Entra primeiro pelo método original.'
    };
    const mensagemAuth = (erro, alternativa) => MENSAGENS_AUTH[erro && erro.code] || (erro && erro.message) || alternativa;

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
    const vazio = '<div class="em0">Ainda não tens plantas. Explora Descobrir ou toca em ＋ para criar uma.</div>';

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
        <div class="chips auth-switch"><button type="button" class="chip ${r ? '' : 'on'}" onclick="alternarAuth('login')">Entrar</button><button type="button" class="chip ${r ? 'on' : ''}" onclick="alternarAuth('register')">Registar</button></div>
        <form class="auth-form" onsubmit="submeterAuth(event,'${modo}')">
            <label class="f">Email<input id="a1" type="email" required placeholder="exemplo@email.com" autocomplete="email"></label>
            <label class="f">Palavra-passe<input id="a2" type="password" required placeholder="••••••••" autocomplete="${r ? 'new' : 'current'}-password"></label>
            ${r ? `<label class="f">Nome<input id="a3" placeholder="O teu nome" autocomplete="name"></label>
            <label class="f">Nível de experiência<select id="a4">${opt(NIVEIS)}</select></label>` : ''}
            <p class="err" id="ae" role="alert"></p>
            <button type="submit" class="big auth-submit">${r ? 'Criar conta' : 'Entrar'}</button>
        </form>`, true);
        $('pn').insertAdjacentHTML('beforeend', `
            <div class="auth-separador">ou</div>
            <button type="button" class="big auth-google" onclick="entrarComGoogle()">
                <img src="assets/google-g-logo.png" alt="" width="20" height="20">
                <span>Continuar com Google</span>
            </button>
        `);
    }

    window.alternarAuth = (modo) => abrirAuth(modo);

    async function entrarComFornecedor(iniciarSessao, seletor, nomeFornecedor) {
        const botao = $('pn').querySelector(seletor);
        const mensagem = $('ae');
        if (botao) botao.disabled = true;
        if (mensagem) mensagem.textContent = '';
        try {
            const utilizador = await iniciarSessao();
            if (!utilizador) return;
            utilizadorAtual = utilizador;
            fecharPainel();
            window.navegar('hoje');
        } catch (erro) {
            if (erro && (erro.code === 'auth/popup-closed-by-user' || erro.code === 'auth/cancelled-popup-request')) {
                if (botao) botao.disabled = false;
                return;
            }
            const texto = erro && erro.code === 'auth/operation-not-allowed'
                ? `O início de sessão com ${nomeFornecedor} ainda não está ativado no Firebase.`
                : mensagemAuth(erro, `Não foi possível entrar com ${nomeFornecedor}.`);
            if (mensagem) mensagem.textContent = texto;
            if (botao) botao.disabled = false;
        }
    }

    window.entrarComGoogle = () => entrarComFornecedor(api.loginGoogle, '.auth-google', 'Google');

    window.submeterAuth = async (e, modo) => {
        e.preventDefault();
        const email = $('a1').value.trim(), password = $('a2').value;
        const botao = $('pn').querySelector('form button[type="submit"], form button.big');
        if (botao) botao.disabled = true;
        try {
            if (modo === 'register') {
                const nome = $('a3').value.trim() || email.split('@')[0];
                const nivel = $('a4').value;
                utilizadorAtual = await api.registar({ nome, email, password, nivel });
            } else {
                utilizadorAtual = await api.login(email, password);
            }
        } catch (erro) {
            const mensagem = $('ae');
            if (mensagem) mensagem.textContent = mensagemAuth(erro, 'Não foi possível autenticar. Tenta novamente.');
            if (botao) botao.disabled = false;
            return;
        }
        fecharPainel();
        window.navegar('hoje');
    };

    window.logout = async () => {
        try {
            await api.logout();
            location.reload();
        } catch (erro) {
            mostrarToast(`Não foi possível terminar sessão: ${erro.message}`);
        }
    };

    window.navegar = (id) => {
        if (!utilizadorAtual) return;
        if (id === 'lembretes' && ecra !== 'lembretes') { mesOffset = 0; diaSel = null; }
        ecra = id;
        fan(0);
        fecharPainel();
        desenhar();
        scrollTo(0, 0);
        marcarNav(id);
    };

    function desenhar() {
        if (!utilizadorAtual) return;
        $('v').dataset.ecra = ecra;
        $('v').innerHTML = ECRAS[ecra]();
    }

    window.filtrar = (chave, valor) => { F[chave] = valor; desenhar(); };

    window.executarDiagnostico = () => {
        const resultado = api.diagnosticar({
            sintoma: $('diag-sintoma').value,
            solo: $('diag-solo').value,
            luz: $('diag-luz').value
        });
        $('diag-resultado').innerHTML = `<section class="diagnostico-resultado"><span class="k">Causa mais provável</span><h2>${esc(resultado.causa)}</h2><p>${esc(resultado.acao)}</p></section>`;
    };

    function carregarFotoCartao(src) {
        if (!src) return Promise.resolve(null);
        return new Promise((resolve) => {
            const imagem = new Image();
            const temporizador = setTimeout(() => resolve(null), 8000);
            imagem.crossOrigin = 'anonymous';
            imagem.onload = () => { clearTimeout(temporizador); resolve(imagem); };
            imagem.onerror = () => { clearTimeout(temporizador); resolve(null); };
            imagem.src = src;
        });
    }

    function escreverLinhas(contexto, texto, x, y, largura, altura) {
        const palavras = texto.split(/\s+/);
        let linha = '';
        for (const palavra of palavras) {
            const tentativa = linha ? `${linha} ${palavra}` : palavra;
            if (contexto.measureText(tentativa).width > largura && linha) {
                contexto.fillText(linha, x, y);
                y += altura;
                linha = palavra;
            } else {
                linha = tentativa;
            }
        }
        if (linha) contexto.fillText(linha, x, y);
    }

    async function criarImagemCartao(plantas) {
        const fotos = await Promise.all(plantas.map((p) => carregarFotoCartao(api.getFoto(p))));
        const largura = 1200, topo = 240, alturaLinha = 290;
        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = topo + alturaLinha * plantas.length;
        const contexto = canvas.getContext('2d');
        if (!contexto) throw new Error('Não foi possível preparar a imagem.');

        contexto.fillStyle = '#f5f8f2';
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        contexto.fillStyle = '#0f5c46';
        contexto.fillRect(0, 0, largura, topo);
        contexto.fillStyle = '#ffffff';
        contexto.font = 'bold 28px Arial';
        contexto.fillText('HERBANÁRIO  /  GUIA DE CUIDADOS', 56, 70);
        contexto.font = 'bold 48px Georgia';
        contexto.fillText('As minhas plantas', 56, 139);
        contexto.font = '24px Arial';
        contexto.fillText(`Instruções de rega • ${new Date().toLocaleDateString('pt-PT')}`, 56, 190);

        plantas.forEach((planta, indice) => {
            const y = topo + indice * alturaLinha;
            contexto.fillStyle = indice % 2 ? '#edf3e9' : '#ffffff';
            contexto.fillRect(0, y, largura, alturaLinha);
            contexto.strokeStyle = '#d7e2d5';
            contexto.beginPath();
            contexto.moveTo(48, y + alturaLinha);
            contexto.lineTo(largura - 48, y + alturaLinha);
            contexto.stroke();

            const foto = fotos[indice];
            if (foto) {
                contexto.save();
                contexto.beginPath();
                contexto.roundRect(56, y + 40, 210, 210, 20);
                contexto.clip();
                const escala = Math.max(210 / foto.width, 210 / foto.height);
                const fotoLargura = foto.width * escala, fotoAltura = foto.height * escala;
                contexto.drawImage(foto, 56 + (210 - fotoLargura) / 2, y + 40 + (210 - fotoAltura) / 2, fotoLargura, fotoAltura);
                contexto.restore();
            } else {
                contexto.fillStyle = '#dce9dc';
                contexto.beginPath();
                contexto.roundRect(56, y + 40, 210, 210, 20);
                contexto.fill();
                contexto.fillStyle = '#426b55';
                contexto.font = 'bold 20px Arial';
                contexto.fillText('Foto indisponível', 76, y + 150);
            }

            const x = 306, textoLargura = 830;
            contexto.fillStyle = '#153b2d';
            contexto.font = 'bold 34px Georgia';
            contexto.fillText(planta.nome, x, y + 66, textoLargura);
            contexto.fillStyle = '#466254';
            contexto.font = 'bold 22px Arial';
            const data = planta.proximaRega
                ? new Date(`${planta.proximaRega}T12:00:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
                : 'por definir';
            contexto.fillText(`Próxima rega: ${data}  •  A cada ${planta.intervaloRega || 7} dias`, x, y + 108);
            contexto.font = '20px Arial';
            contexto.fillStyle = '#30483a';
            escreverLinhas(contexto, 'Quantidade: regar lentamente até a água começar a sair pelos furos do vaso; esvaziar o prato. Em cactos e suculentas, usar pouca água e deixar a terra secar completamente.', x, y + 150, textoLargura, 29);
        });

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Não foi possível criar o ficheiro de imagem.'));
            }, 'image/png');
        });
    }

    window.gerarCartaoCuidados = async () => {
        const plantas = api.getColecao(utilizadorAtual.email);
        const botao = $('gerar-cartao');
        const erro = $('cartao-erro');
        if (!plantas.length || !botao || !erro) return;
        botao.disabled = true;
        erro.textContent = '';
        try {
            const blob = await criarImagemCartao(plantas);
            const nomeFicheiro = 'cartao-cuidados-plantas.png';
            const ficheiro = typeof File === 'undefined' ? null : new File([blob], nomeFicheiro, { type: 'image/png' });
            if (ficheiro && navigator.share && navigator.canShare && navigator.canShare({ files: [ficheiro] })) {
                await navigator.share({
                    files: [ficheiro],
                    title: 'Cuidados das minhas plantas',
                    text: 'Instruções de rega para cuidares das minhas plantas.'
                });
                mostrarToast('Cartão partilhado');
            } else {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = nomeFicheiro;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                mostrarToast('Cartão guardado como imagem');
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                mostrarToast('Partilha cancelada');
            } else {
                erro.textContent = e.message || 'Não foi possível criar o cartão. Tenta novamente.';
            }
        } finally {
            if ($('gerar-cartao')) $('gerar-cartao').disabled = false;
        }
    };

    const ECRAS = {
        hoje() {
            const l = minhas(), pend = l.filter((x) => x.d <= 0), f = pend[0];
            const pc = l.length ? (l.length - pend.length) / l.length : 0;
            const h = new Date().getHours(), g = h < 6 || h >= 20 ? 'Boa noite' : h < 12 ? 'Bom dia' : 'Boa tarde';
            const data = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
            return `${cab(data, `${g}, ${esc(utilizadorAtual.nome)}`, `<button class="av" onclick="navegar('perfil')" aria-label="Perfil">${inicial()}</button>`) }
            <section class="hero"><div class="tx"><span class="bd">${f ? 'Rega de hoje' : 'Jardim em dia'}</span>
                <h3>${!l.length ? 'Começa o teu jardim' : f ? esc(f.p.nome) + (pend.length > 1 ? ` +${pend.length - 1}` : '') : 'Tudo regado'}</h3>
                <p>${!l.length ? 'Adiciona a tua primeira planta.' : f ? (f.d < 0 ? `Atrasada ${-f.d} dia(s). ` : '') + 'Está com sede.' : `Próxima: ${esc(l[0].p.nome)}, ${l[0].t}.`}</p>
                <div class="bt">${f ? `<button class="b w" onclick="regardestaque('${f.p.id}')">Reguei agora</button><button class="b g" onclick="reagendarDestaque('${f.p.id}')">+1 dia</button>${pend.length > 1 ? `<button class="b g" onclick="regarTodas()">Regar todas (${pend.length})</button>` : ''}` : !l.length ? `<button class="b w" onclick="navegar('descobrir')">Descobrir plantas</button>` : ''}</div></div>
                <svg class="ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="8"/><circle cx="40" cy="40" r="34" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="213.6" stroke-dashoffset="${213.6 * (1 - pc)}" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">${Math.round(pc * 100)}%</text></svg>
            </section>
            <div class="sec"><h2>A tua coleção</h2><a onclick="navegar('colecao')">Ver tudo</a></div>
            ${l.length ? `<div class="hs">${l.map((x) => cartao(x.p, 'col', x)).join('')}</div>` : vazio}
            <section class="atalhos-func">
                <button class="func-card" onclick="navegar('diagnostico')"><span aria-hidden="true">⌕</span><b>Diagnóstico por sintomas</b><small>Descobre causas prováveis e o que fazer.</small></button>
                <button class="func-card" onclick="navegar('cartao')"><span aria-hidden="true">▤</span><b>Cartão para férias</b><small>Prepara as instruções para quem cuida das plantas.</small></button>
                <button class="func-card" onclick="navegar('lembretes-pessoais')"><span aria-hidden="true">✎</span><b>Os meus lembretes</b><small>Escreve e guarda qualquer lembrete para o teu jardim.</small></button>
            </section>
            ${renderDica(api.getCatalogo())}`;
        },

        descobrir() {
            const lista = api.filtrarCatalogo({ nivel: F.n === 'Todos' ? '' : F.n });
            return cab('Encontra a tua próxima planta', 'Descobrir') + chips(['Todos', ...NIVEIS], 'n', F.n) +
                `<div class="g">${lista.map((p) => cartao(p, 'cat', jaTem(p.id))).join('')}</div>`;
        },

        colecao() {
            const l = minhas();
            return cab('A tua coleção pessoal', 'As minhas plantas', `<button class="mini" style="margin-top:8px;padding:10px 14px" onclick="novaPlanta()">＋ Nova</button>`) +
                (l.length ? '<button class="big s" onclick="navegar(\'cartao\')">Criar cartão para quem cuida</button>' : '') +
                `<div class="g" style="margin-top:18px">${l.map((x) => cartao(x.p, 'col', x)).join('')}</div>` + (l.length ? '' : vazio);
        },

        diagnostico() {
            return cab('Responde a 3 perguntas; o resultado é uma estimativa por regras simples.', 'O que se passa?') +
                `<form class="diagnostico-form" onsubmit="event.preventDefault();executarDiagnostico()">
                    <label class="f">1. Qual é o principal sintoma?
                        <select id="diag-sintoma">
                            <option value="amarelas">Folhas amarelas</option>
                            <option value="pontas">Pontas castanhas</option>
                            <option value="caem">Folhas a cair</option>
                            <option value="nenhum">Nenhum destes</option>
                        </select>
                    </label>
                    <label class="f">2. Como está a terra neste momento?
                        <select id="diag-solo">
                            <option value="humido">Húmida ou molhada</option>
                            <option value="normal">Ligeiramente húmida</option>
                            <option value="seco">Seca</option>
                        </select>
                    </label>
                    <label class="f">3. Quanta luz recebe a planta?
                        <select id="diag-luz">
                            <option value="pouca">Pouca luz</option>
                            <option value="indireta">Luz indireta</option>
                            <option value="muita">Luz forte ou sol direto</option>
                        </select>
                    </label>
                    <button class="big" type="submit">Ver resultado</button>
                </form>
                <div id="diag-resultado" aria-live="polite"></div>
                <p class="diagnostico-nota">É uma orientação geral, não um diagnóstico definitivo. As necessidades variam conforme a espécie e a estação.</p>`;
        },

        cartao() {
            const l = minhas();
            return cab('Instruções prontas para partilhar antes das férias.', 'Cuidados das plantas') +
                (l.length
                    ? `<p class="dc">O cartão inclui a fotografia, a próxima data de rega, o intervalo e instruções sobre a quantidade de água.</p>
                        <div class="cartao-lista">${l.map((x) => `<div class="it">${visual(x.p, 'eb')}<div class="in"><b>${esc(x.p.nome)}</b><small>Próxima rega: ${esc(x.t)}</small></div></div>`).join('')}</div>
                        <p class="err" id="cartao-erro" role="alert"></p>
                        <button class="big" id="gerar-cartao" onclick="gerarCartaoCuidados()">Criar e partilhar imagem</button>
                        <p class="diagnostico-nota">Se a partilha de imagens não estiver disponível neste dispositivo, a imagem será guardada para poderes enviá-la por mensagem.</p>`
                    : `${vazio}<button class="big" onclick="navegar('colecao')">Abrir a coleção</button>`);
        },

        'lembretes-pessoais'() {
            const lembretes = api.getLembretes(utilizadorAtual.email);
            return cab('Aponta qualquer tarefa, ideia ou cuidado que queiras recordar.', 'Os meus lembretes') +
                `<form class="diagnostico-form lembrete-form" onsubmit="event.preventDefault();guardarLembrete()">
                    <label class="f" for="lembrete-texto">O que queres lembrar?</label>
                    <textarea id="lembrete-texto" class="lembrete-editor" rows="8" maxlength="1000" required placeholder="Ex.: comprar terra para a Monstera, podar a lavanda na primavera…"></textarea>
                    <button class="big" type="submit">Guardar lembrete</button>
                </form>
                <div class="sec"><h2>Lembretes guardados</h2></div>
                ${lembretes.length ? `<div class="lembretes-lista">${lembretes.map((lembrete) => {
                    const data = new Date(lembrete.data);
                    const dataFormatada = Number.isNaN(data.getTime()) ? '' : data.toLocaleString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
                    return `<article class="lembrete-item"><div><p>${esc(lembrete.texto)}</p><small>${esc(dataFormatada)}</small></div><button class="lembrete-remover" aria-label="Apagar lembrete" onclick="apagarLembrete('${lembrete.id}')">Apagar</button></article>`;
                }).join('')}</div>` : '<div class="em0">Ainda não guardaste lembretes.</div>'}`;
        },

        lembretes() {
            const l = minhas();
            const pend = l.filter((x) => x.d <= 0);
            const hoje = api.hojeISO();

            const base = new Date();
            base.setDate(1);
            base.setMonth(base.getMonth() + mesOffset);
            const ano = base.getFullYear(), mes = base.getMonth();
            const total = new Date(ano, mes + 1, 0).getDate();
            const inicio = isoDe(ano, mes, 1), fim = isoDe(ano, mes, total);
            const mapa = mapaRegas(l.map((x) => x.p), inicio, fim);
            const sel = diaSel && diaSel >= inicio && diaSel <= fim ? diaSel : (hoje >= inicio && hoje <= fim ? hoje : inicio);

            const tituloMes = base.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
            const semana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => `<div class="cal-wd">${d}</div>`).join('');
            let celulas = '<div></div>'.repeat((new Date(ano, mes, 1).getDay() + 6) % 7);
            let previstasMes = 0, feitasMes = 0;
            for (let dia = 1; dia <= total; dia++) {
                const iso = isoDe(ano, mes, dia);
                const info = mapa[iso] || { prev: [], feitas: [] };
                previstasMes += info.prev.length;
                feitasMes += info.feitas.length;
                const pontos = [
                    ...info.feitas.map(() => '<i class="ok"></i>'),
                    ...info.prev.map((p) => `<i style="--h:${p.hue ?? 140}"></i>`)
                ];
                const extra = pontos.length > 4 ? `<em>+${pontos.length - 3}</em>` : '';
                const classes = [
                    iso < hoje ? 'passado' : '',
                    iso === hoje ? 'hoje' : '',
                    iso === hoje && pend.length ? 'atraso' : '',
                    iso === sel ? 'sel' : ''
                ].join(' ');
                const rotulo = `${dia}: ${info.prev.length} rega(s) prevista(s), ${info.feitas.length} feita(s)`;
                celulas += `<button class="cd ${classes}" aria-label="${rotulo}" aria-pressed="${iso === sel}" onclick="selecionarDia('${iso}')"><span>${dia}</span><b class="pts">${(extra ? pontos.slice(0, 3) : pontos).join('')}${extra}</b></button>`;
            }

            const info = mapa[sel] || { prev: [], feitas: [] };
            const estadoDe = (p) => l.find((x) => x.p.id === p.id);
            const linha = (p, pill, botao = '') => `<div class="it" onclick="abrirPlanta('${p.id}')">${visual(p, 'eb')}
                <div class="in"><b>${esc(p.nome)}</b><small>A cada ${p.intervaloRega || 7} dias</small></div>${pill}${botao}</div>`;
            const itensDia = [
                ...info.prev.map((p) => sel === hoje
                    ? linha(p, `<em class="pill due">${estadoDe(p).t}</em>`, `<button class="wb" onclick="event.stopPropagation();regar('${p.id}')">Regar</button>`)
                    : linha(p, '<em class="pill">Prevista</em>')),
                ...info.feitas.map((p) => linha(p, '<em class="pill ok">✓ Regada</em>'))
            ].join('') || `<div class="em0 pq">${sel < hoje ? 'Sem regas registadas neste dia.' : 'Nenhuma rega prevista neste dia.'}</div>`;

            const todas = l.map((x) => `<div class="it" onclick="abrirPlanta('${x.p.id}')">${visual(x.p, 'eb')}
                    <div class="in"><b>${esc(x.p.nome)}</b><small>A cada ${x.p.intervaloRega} dias · Última: ${ultimaRega(x.p)}</small></div>
                    <em class="pill ${x.d <= 0 ? 'due' : ''}">${x.t}</em>
                    <button class="wb" aria-label="Regar ${esc(x.p.nome)}" onclick="event.stopPropagation();regar('${x.p.id}')">Regar</button></div>`).join('');

            return cab('Calendário de regas', 'Regas', pend.length > 1 ? `<button class="mini" style="margin-top:8px;padding:10px 14px" onclick="regarTodas()">Regar todas (${pend.length})</button>` : '') +
                (!l.length ? vazio : `<div class="regas-layout">
                <section class="cal" aria-label="Calendário de ${tituloMes}">
                    <div class="cal-top">
                        <h2>${tituloMes}</h2>
                        <div class="cal-nav">
                            <button onclick="mudarMes(-1)" aria-label="Mês anterior">‹</button>
                            ${mesOffset ? '<button class="cal-hoje" onclick="mudarMes(0)">Hoje</button>' : ''}
                            <button onclick="mudarMes(1)" aria-label="Mês seguinte">›</button>
                        </div>
                    </div>
                    <div class="cal-grid">${semana}${celulas}</div>
                    <div class="cal-leg"><span><i class="pv"></i>Rega prevista</span><span><i class="ok"></i>Rega feita</span><span><b>${previstasMes}</b> previstas · <b>${feitasMes}</b> feitas</span></div>
                </section>
                <div>
                    <section class="dia">
                        <div class="sec"><h2>${dataLonga(sel)}</h2><span class="k">${info.prev.length + info.feitas.length} rega(s)</span></div>
                        ${itensDia}
                    </section>
                    <div class="sec"><h2>Todas as plantas</h2></div>
                    ${todas}
                </div>
            </div>`);
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
        if (!p) return;
        api.marcarRega(utilizadorAtual.email, id);
        mostrarToast(`${p.nome} regada`);
        try { navigator.vibrate(30); } catch (e) {}
        desenhar();
    };
    window.regarTodas = () => {
        const ids = minhas().filter((x) => x.d <= 0).map((x) => x.p.id);
        if (!ids.length) return;
        api.marcarRega(utilizadorAtual.email, ids);
        mostrarToast(`${ids.length} plantas regadas`);
        try { navigator.vibrate(30); } catch (e) {}
        desenhar();
    };

    // ----- Calendário mensal de regas -----
    const dois = (n) => String(n).padStart(2, '0');
    const isoDe = (ano, mes, dia) => `${ano}-${dois(mes + 1)}-${dois(dia)}`;

    function dataLonga(iso) {
        const [a, m, d] = iso.split('-').map(Number);
        const texto = new Date(a, m - 1, d).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function ultimaRega(p) {
        const ultima = (p.historicoRegas || []).slice(-1)[0];
        if (!ultima) return 'sem registo';
        const dias = -diasAte(ultima);
        return dias <= 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`;
    }

    // Datas previstas: começa na próxima rega (ou hoje, se estiver atrasada) e repete pelo intervalo.
    function regasPrevistas(p, inicio, fim) {
        const hoje = api.hojeISO();
        const intervalo = Math.max(1, parseInt(p.intervaloRega) || 7);
        let d = p.proximaRega && p.proximaRega > hoje ? p.proximaRega : hoje;
        const datas = [];
        while (d <= fim) {
            if (d >= inicio) datas.push(d);
            d = api.adicionarDias(d, intervalo);
        }
        return datas;
    }

    function mapaRegas(plantas, inicio, fim) {
        const mapa = {};
        const juntar = (iso, tipo, p) => {
            if (!mapa[iso]) mapa[iso] = { prev: [], feitas: [] };
            mapa[iso][tipo].push(p);
        };
        plantas.forEach((p) => {
            (p.historicoRegas || []).forEach((d) => { if (d >= inicio && d <= fim) juntar(d, 'feitas', p); });
            regasPrevistas(p, inicio, fim).forEach((d) => juntar(d, 'prev', p));
        });
        return mapa;
    }

    window.mudarMes = (passo) => {
        mesOffset = passo === 0 ? 0 : mesOffset + passo;
        diaSel = null;
        desenhar();
    };
    window.selecionarDia = (iso) => {
        diaSel = iso;
        desenhar();
        const dia = document.querySelector('.dia');
        if (dia && window.innerWidth < 900) dia.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.regardestaque = (id) => window.regar(id);
    window.reagendarDestaque = (id) => {
        api.reagendarRega(utilizadorAtual.email, id);
        mostrarToast('Reagendada para amanhã');
        desenhar();
    };

    window.guardarLembrete = () => {
        const texto = $('lembrete-texto').value.trim();
        if (!texto) return mostrarToast('Escreve o lembrete antes de guardar');
        api.adicionarLembrete(utilizadorAtual.email, texto);
        mostrarToast('Lembrete guardado');
        desenhar();
    };

    window.apagarLembrete = (id) => {
        confirmar('Apagar lembrete?', 'Este lembrete vai ser apagado de todos os teus dispositivos.', 'Apagar lembrete', () => {
            api.eliminarLembrete(utilizadorAtual.email, id);
            mostrarToast('Lembrete apagado');
            desenhar();
        });
    };

    const factos = (p, extra) => `<div class="ft"><div>Rega<b>A cada ${p.intervaloRega} dias</b></div><div>Luz<b>${esc(p.luz || '—')}</b></div><div>Tipo<b>${TIPOS[p.tipo] || '—'}</b></div>${extra}</div>`;
    const topo = (p) => `${visual(p, 'art big', `<i class="lv">${esc(p.nivel)}</i>`)}<h2 class="sn">${esc(p.nome)}</h2><small class="sc">${esc(p.cientifico)}</small>`;

    window.abrirEspecie = (id) => {
        const p = api.getCatalogo().find((x) => x.id === id);
        if (!p) return;
        painel(`${topo(p)}${factos(p, '')}<section class="info-planta"><span class="k">Guia de cultivo</span><p>${esc(p.detalhes || p.dicas)}</p><p><b>Dica:</b> ${esc(p.dicas)}</p></section>
        ${jaTem(id)
            ? '<button class="big" disabled>✓ Já está na tua coleção</button>'
            : `<button class="big" onclick="adicionarComprar('${id}');fecharPainel()">＋ Adicionar à coleção</button>`}
        <button class="big s" onclick="fecharPainel()">Fechar</button>`);
    };

    window.abrirPlanta = (id) => {
        const p = daColecao(id);
        if (!p) return;
        const s = estado(p);
        painel(`${topo(p)}${factos(p, `<div>Próxima rega<b>${s.t}</b></div><div>Última rega<b>${ultimaRega(p)}</b></div>`)}<section class="info-planta"><span class="k">Guia de cultivo</span><p>${esc(p.detalhes || p.dicas || 'Ainda sem guia de cultivo. Podes acrescentar dicas ao editar a planta.')}</p>${p.dicas ? `<p><b>Dica:</b> ${esc(p.dicas)}</p>` : ''}</section>
        <button class="big" onclick="regar('${id}');fecharPainel()">Reguei agora</button>
        <button class="big s" onclick="editarPlanta('${id}')">Editar</button>
        <button class="big d" onclick="removerPlanta('${id}')">Remover da coleção</button>`);
    };

    window.adicionarComprar = (id) => {
        const especie = api.getCatalogo().find((p) => p.id === id);
        if (!especie || jaTem(id)) return;
        api.adicionarAColecao(utilizadorAtual.email, especie);
        mostrarToast(`${especie.nome} adicionada à coleção`);
        desenhar();
    };

    window.removerPlanta = (id) => {
        const p = daColecao(id);
        if (!p) return;
        confirmar('Remover da coleção?', `${esc(p.nome)}, a fotografia e o histórico de regas vão ser removidos da tua coleção.`, 'Remover da coleção', () => {
            api.eliminarPlanta(utilizadorAtual.email, id);
            mostrarToast(`${p.nome} removida da coleção`);
            desenhar();
        });
    };

    let imagemSelecionada = null;

    function prepararImagem(file) {
        if (!file.type.startsWith('image/')) {
            return Promise.reject(new Error('Escolhe um ficheiro de imagem.'));
        }
        if (file.size > 10 * 1024 * 1024) {
            return Promise.reject(new Error('A imagem não pode ter mais de 10 MB.'));
        }

        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const imagem = new Image();
            imagem.onload = () => {
                URL.revokeObjectURL(url);
                try {
                    if (!imagem.width || !imagem.height) throw new Error('A imagem não tem dimensões válidas.');
                    // 900px e qualidade 0,78 deixam a foto com ~100-200 KB, dentro do limite do Firestore.
                    const escala = Math.min(1, 900 / Math.max(imagem.width, imagem.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(imagem.width * escala);
                    canvas.height = Math.round(imagem.height * escala);
                    const contexto = canvas.getContext('2d');
                    if (!contexto) throw new Error('Não foi possível processar esta imagem.');
                    contexto.fillStyle = '#fff';
                    contexto.fillRect(0, 0, canvas.width, canvas.height);
                    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.78));
                } catch (e) {
                    reject(e);
                }
            };
            imagem.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Não foi possível abrir esta imagem.'));
            };
            imagem.src = url;
        });
    }

    function formulario(p = {}) {
        imagemSelecionada = null;
        const foto = api.getFoto(p);
        painel(`<h2 class="sn">${p.id ? 'Editar planta' : 'Nova planta'}</h2>
        <label class="f">Nome comum<input id="n2" value="${esc(p.nome || '')}"></label>
        <label class="f">Nome científico<input id="n3" value="${esc(p.cientifico || '')}"></label>
        <div class="two"><label class="f">Tipo<select id="n4">${opt(TIPOS, p.tipo)}</select></label>
        <label class="f">Nível<select id="n5">${opt(NIVEIS, p.nivel)}</select></label></div>
        <label class="f">Regar a cada (dias)<input id="n6" type="number" min="1" value="${p.intervaloRega || 7}"></label>
        <label class="f">Dicas<textarea id="n7" rows="2">${esc(p.dicas || '')}</textarea></label>
        <label class="f">Fotografia<input id="n8" type="file" accept="image/*" onchange="preverImagemPlanta(this)"></label>
        <div class="foto-preview" id="foto-preview">${foto ? `<img src="${esc(foto)}" alt="Pré-visualização da planta">` : '<span>Sem fotografia selecionada</span>'}</div>
        <p class="err" id="planta-erro" role="alert"></p>
        <button class="big" id="guardar-planta" onclick="guardarFormPlanta('${p.id || ''}')">Guardar planta</button>
        <button class="big s" onclick="fecharPainel()">Cancelar</button>`);
    }

    window.novaPlanta = () => { fan(0); formulario(); };
    window.editarPlanta = (id) => formulario(daColecao(id));

    window.preverImagemPlanta = (input) => {
        const file = input.files[0];
        if (!file) return;
        const pedido = prepararImagem(file);
        imagemSelecionada = pedido;
        pedido.then((dataUrl) => {
            const preview = $('foto-preview');
            const erro = $('planta-erro');
            if (!preview || !erro) return;
            const imagem = document.createElement('img');
            imagem.alt = 'Pré-visualização da planta';
            imagem.src = dataUrl;
            preview.replaceChildren(imagem);
        }).catch((e) => {
            const erro = $('planta-erro');
            if (erro) erro.textContent = e.message || 'Não foi possível abrir esta imagem.';
        });
    };

    window.guardarFormPlanta = async (id) => {
        const nome = $('n2').value.trim();
        if (!nome) return mostrarToast('Dá um nome à planta');
        const botao = $('guardar-planta');
        const erro = $('planta-erro');
        botao.disabled = true;
        erro.textContent = '';
        const anterior = id ? daColecao(id) : null;
        const planta = {
            ...(anterior || {}),
            id: id || undefined,
            nome,
            cientifico: $('n3').value.trim() || '—',
            tipo: $('n4').value,
            nivel: $('n5').value,
            intervaloRega: Math.max(1, parseInt($('n6').value) || 7),
            dicas: $('n7').value.trim()
        };
        // Se o intervalo mudou, a próxima rega passa a contar a partir da última rega.
        if (anterior && +anterior.intervaloRega !== planta.intervaloRega) {
            const hoje = api.hojeISO();
            const ultima = (anterior.historicoRegas || []).slice(-1)[0] || hoje;
            const proxima = api.adicionarDias(ultima, planta.intervaloRega);
            planta.proximaRega = proxima < hoje ? hoje : proxima;
        }
        try {
            if (imagemSelecionada) planta.foto = await imagemSelecionada;
            if (!$('guardar-planta')) return;
            api.guardarPlanta(utilizadorAtual.email, planta);
        } catch (e) {
            const mensagem = $('planta-erro');
            const botaoAtual = $('guardar-planta');
            if (mensagem && botaoAtual) {
                mensagem.textContent = e.message || 'Não foi possível guardar a planta. Tenta novamente.';
                botaoAtual.disabled = false;
            }
            return;
        }
        mostrarToast(id ? 'Planta atualizada' : `${nome} criada`);
        window.navegar('colecao');
    };
})();
