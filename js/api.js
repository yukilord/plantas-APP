(function () {
    const pad = (n) => String(n).padStart(2, '0');
    const paraISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const $ = (id) => document.getElementById(id);
    const uid = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const hojeISO = () => paraISO(new Date());

    function adicionarDias(iso, n) {
        const [a, m, d] = iso.split('-').map(Number);
        return paraISO(new Date(a, m - 1, d + n));
    }

    function diasAte(iso) {
        const [a, m, d] = (iso || hojeISO()).split('-').map(Number);
        const [ha, hm, hd] = hojeISO().split('-').map(Number);
        return Math.round((new Date(a, m - 1, d) - new Date(ha, hm - 1, hd)) / 864e5);
    }

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
    const eur = (n) => (n ? n.toFixed(2).replace('.', ',') + ' €' : 'Grátis');

    const opt = (o, sel) =>
        (Array.isArray(o) ? o.map((x) => [x, x]) : Object.entries(o))
            .map(([k, v]) => `<option value="${k}" ${k == sel ? 'selected' : ''}>${v}</option>`)
            .join('');

    const USERS_KEY = 'herbanario_users';
    const SESSAO_KEY = 'herbanario_sessao';

    const users = () => {
        try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
    };
    const gravarUsers = (lista) => localStorage.setItem(USERS_KEY, JSON.stringify(lista));

    function abrirSessao(u) {
        const sessao = { nome: u.nome, email: u.email, nivel: u.nivel };
        localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
        return sessao;
    }

    function registar({ nome, email, password, nivel }) {
        email = email.trim().toLowerCase();
        if (password.length < 4) throw new Error('A palavra-passe precisa de pelo menos 4 caracteres.');
        if (users().some((u) => u.email === email)) throw new Error('Este email já está registado.');
        const u = { nome, email, password, nivel };
        gravarUsers([...users(), u]);
        return abrirSessao(u);
    }

    function login(email, password) {
        email = email.trim().toLowerCase();
        const u = users().find((x) => x.email === email && x.password === password);
        if (!u) throw new Error('Email ou palavra-passe incorretos.');
        return abrirSessao(u);
    }

    function getSessao() {
        try { return JSON.parse(localStorage.getItem(SESSAO_KEY)); } catch { return null; }
    }

    function logout() {
        localStorage.removeItem(SESSAO_KEY);
    }

    function atualizarPerfil(email, dados) {
        const emailNormalizado = String(email || '').trim().toLowerCase();
        const lista = users();
        const indice = lista.findIndex((u) => u.email === emailNormalizado);
        if (indice < 0) throw new Error('Conta não encontrada.');

        const atual = { ...lista[indice], ...dados };
        if (atual.email) atual.email = atual.email.trim().toLowerCase();
        if (atual.nome !== undefined) atual.nome = String(atual.nome || '').trim() || 'Jardineiro';

        lista[indice] = atual;
        gravarUsers(lista);
        return abrirSessao(atual);
    }

    const COLECAO_KEY = 'herbanario_colecao';
    const NIVEIS = ['Iniciante', 'Intermédio', 'Avançado'];
    const TIPOS = { interior: 'Interior', exterior: 'Exterior', jardim: 'Jardim', ornamental: 'Ornamental' };

    const N = { I: 'Iniciante', M: 'Intermédio', A: 'Avançado' };
    const T = { i: 'interior', e: 'exterior', j: 'jardim', o: 'ornamental' };

    const FOTOS = {
        'Jiboia': 'https://casaeconstrucao.vivadecora.com.br/wp-content/uploads/2025/08/shutterstock_1981510535-1024x678.jpg',
        'Espada-de-São-Jorge': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8sE76KsPWkHZNeE3p-YZdvRLn0pEAIalK4QdSYIKEU-DwEELBA1rW_r8X&s=10',
        'Cacto-bola': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrgJUX5YuwdaJWMSLKCxFx6uySqGZNo6km9qoEZf74Kyhk4jqBvVTP5Ew&s=10',
        'Aloé Vera': 'https://viplant.pt/app/uploads/2022/02/2-imagem-artigo1049109326.jpg',
        'Planta-ZZ': 'https://casa.abril.com.br/wp-content/uploads/2022/04/como-plantar-zamioculca-peexels-suki-lee.jpeg?quality=70&strip=info&w=683',
        'Costela-de-Adão': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWEOyyqSDgKCx2PEpZdsQJvcGGrjWXwN8W6pa9x0Xupg&s=10',
        'Fícus-lira': 'https://floresnocais.pt/wp-content/uploads/2021/03/ficus-lyrata-flores-no-cais-2.jpg',
        'Orquídea': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4GnEI7fum1T4MZPaDWViufVheZotWX4THw-xUl3Ohjb20UQc_ndAwyEoJ&s=10',
        'Lavanda': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvOWre72T89Zs3k1b4_pcF6xwqVHakq0Q3eqTuhXPvTvTEUUZ0IslxaLfk_B3bEpN5glLVCQOA54h0aoZ-zAsjfSgnKBeT-Cj6vE4XQb0k&s=10',
        'Alecrim': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmHLxnHyF9O6MY_UeNyN-6378QkBHxGslRi_LtxK9FVTTBb2u76ZamxD1SoNXukI-OhLQk1xpR8jhtmuoiEixLBiZ5Iuren4vkYAfaipvv&s=10',
        'Hortelã': 'https://ciclovivo.com.br/wp-content/uploads/2020/06/mint-5229226_1280.jpg',
        'Manjericão': 'https://image.tuasaude.com/media/article/lk/sf/manjericao_3994.jpg',
        'Hibisco': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgDvQNPQmiwCgpaIBam0nK_oQY8F16hY11Lq13gtLk7ZhqCEZ0TcmaPH8y1wTO-JVoyoH0wsR5MjX29S2TXx4O4gERVwlnHQ6_q-461YzK&s=10',
        'Girassol': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWG0jRXNo04r8cI4PSYvgZvnf4ocklzmTCfCkCAsdzoRX3dYwPQQZLSwx0Lv7W6i3ePRD2fUSj5LThC5hasXsLPe9JHR2B_hB4-QaCOLXT&s=10',
        'Rosa': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWHOk7aLSqIbgRtz-6Zg57d2zMaRlIRdTqo-1nwdWIMDM81R7rjNc5aPcN9BESBQfalVrPRSuWo_goUOPqwyR6LDh6nIu5IvnzJ6QZamsV9A&s=10',
        'Tulipa': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT30AqJoQCyetA7BOTFJaQDKSsNTDZ0ehwRzi8icjw3_BpiIsyLcl679l8E&s=10'
    };

    const RAW = [
        'Jiboia|Epipremnum aureum|I|i|7|Luz indireta|9|140|Perdoa esquecimentos. Rega quando o topo do substrato estiver seco.',
        'Espada-de-São-Jorge|Dracaena trifasciata|I|i|14|Qualquer luz|14|150|Quase indestrutível. O maior erro é regar demais.',
        'Cacto-bola|Echinocactus grusonii|I|i|21|Sol direto|8|95|Adora sol. Reduz a rega para metade no inverno.',
        'Aloé Vera|Aloe vera|I|i|14|Sol filtrado|10|120|Rega a fundo, mas só com a terra completamente seca.',
        'Planta-ZZ|Zamioculcas zamiifolia|I|i|14|Sombra|16|160|Guarda água nos rizomas. Ideal para cantos escuros.',
        'Costela-de-Adão|Monstera deliciosa|M|i|7|Luz indireta|24|135|Limpa as folhas com um pano húmido e dá-lhe um tutor.',
        'Fícus-lira|Ficus lyrata|A|i|7|Luz forte|38|110|Odeia mudanças. Escolhe um sítio e deixa-a ficar lá.',
        'Orquídea|Phalaenopsis|M|i|7|Luz indireta|22|330|Rega por imersão 10 minutos e deixa escorrer bem.',
        'Lavanda|Lavandula angustifolia|I|e|5|Sol direto|7|270|Gosta de solo pobre e drenado. Poda depois da floração.',
        'Alecrim|Salvia rosmarinus|I|j|6|Sol direto|6|150|Mediterrânico por natureza: pouca água e muito sol.',
        'Hortelã|Mentha spicata|I|j|3|Meia-sombra|4|125|Cresce depressa. Mete-a num vaso para não invadir o jardim.',
        'Manjericão|Ocimum basilicum|M|j|2|Sol direto|4|105|Belisca as pontas para ficar frondoso. Odeia frio.',
        'Hibisco|Hibiscus rosa-sinensis|M|e|4|Sol direto|18|350|Floresce com calor. Rega abundante no verão.',
        'Girassol|Helianthus annuus|I|j|3|Sol direto|5|45|Semeia na primavera ao sol. As flores seguem a luz.',
        'Rosa|Rosa × hybrida|A|j|4|Sol direto|15|355|Pede poda anual, adubo e atenção aos pulgões.',
        'Tulipa|Tulipa gesneriana|M|j|4|Sol suave|8|320|Planta os bolbos no outono para florir na primavera.',
        'Bambu-da-sorte|Dracaena sanderiana|I|i|7|Luz indireta|11|130|Vive em água. Troca-a todas as semanas.',
        'Palmeira-areca|Dypsis lutescens|M|i|5|Luz indireta|29|100|Gosta de humidade. Pulveriza as folhas com frequência.',
        'Calathea|Calathea orbifolia|A|i|4|Sombra|21|145|Prefere água da chuva e ar húmido. Foge das correntes de ar.',
        'Bonsai de Ficus|Ficus microcarpa|A|i|3|Luz forte|45|115|Verifica a terra todos os dias e poda para manter a forma.',
        'Echeveria|Echeveria elegans|I|i|12|Sol direto|6|175|Rosetas compactas. Rega junto à terra, nunca nas folhas.',
        'Cíclame|Cyclamen persicum|M|o|4|Luz fresca|9|340|Gosta de frescura. Rega por baixo e tira as flores secas.',
        'Begónia-rex|Begonia rex|A|o|5|Luz indireta|17|300|Folhas deslumbrantes mas sensíveis. Evita molhá-las.',
        'Camélia|Camellia japonica|A|o|6|Meia-sombra|26|345|Terra ácida e rega constante. Não a mudes com botões.',
        'Tomateiro|Solanum lycopersicum|M|j|2|Sol direto|3|5|Rega ao pé, de manhã, e põe tutor desde cedo.',
        'Limoeiro|Citrus × limon|A|e|4|Sol direto|32|55|Pede adubo rico em azoto e proteção contra geadas.'
    ];

    const CATALOGO = RAW.map((r, i) => {
        const a = r.split('|');
        return {
            id: 'esp' + i, nome: a[0], cientifico: a[1], nivel: N[a[2]], tipo: T[a[3]],
            intervaloRega: +a[4], luz: a[5], preco: +a[6], hue: +a[7], dicas: a[8],
            foto: FOTOS[a[0]] || ''
        };
    });

    function getFoto(planta) {
        const especie = planta.especieId && CATALOGO.find((p) => p.id === planta.especieId);
        return especie ? especie.foto : (planta.foto || '');
    }

    function colecaoTodos() {
        try { return JSON.parse(localStorage.getItem(COLECAO_KEY) || '{}'); } catch { return {}; }
    }

    function getCatalogo() {
        return CATALOGO;
    }

    function getColecao(email) {
        return colecaoTodos()[email] || [];
    }

    function gravarColecao(email, plantas) {
        const dados = colecaoTodos();
        dados[email] = plantas;
        localStorage.setItem(COLECAO_KEY, JSON.stringify(dados));
    }

    function adicionarAColecao(email, especie) {
        const lista = getColecao(email);
        const planta = {
            ...especie,
            id: uid(),
            especieId: especie.id,
            proximaRega: adicionarDias(hojeISO(), especie.intervaloRega || 7)
        };
        lista.push(planta);
        gravarColecao(email, lista);
        return planta;
    }

    function semear(email, nivel) {
        const ids = { Iniciante: [0, 1, 3], Intermédio: [5, 7, 11], Avançado: [6, 18, 23] }[nivel] || [0, 1, 3];
        const desvios = [-1, 0, 2];
        ids.forEach((n, i) => {
            const p = adicionarAColecao(email, CATALOGO[n]);
            guardarPlanta(email, { id: p.id, proximaRega: adicionarDias(hojeISO(), desvios[i]) });
        });
    }

    function guardarPlanta(email, planta) {
        const lista = getColecao(email);
        if (planta.id) {
            const i = lista.findIndex((p) => p.id === planta.id);
            if (i >= 0) lista[i] = { ...lista[i], ...planta };
        } else {
            planta.id = uid();
            planta.proximaRega = adicionarDias(hojeISO(), planta.intervaloRega || 7);
            planta.hue = planta.hue ?? Math.floor(Math.random() * 360);
            planta.luz = planta.luz || '—';
            planta.preco = planta.preco || 0;
            lista.push(planta);
        }
        gravarColecao(email, lista);
    }

    function eliminarPlanta(email, id) {
        gravarColecao(email, getColecao(email).filter((p) => p.id !== id));
    }

    function marcarRega(email, id) {
        const lista = getColecao(email).map((p) => {
            if (p.id !== id) return p;
            return { ...p, proximaRega: adicionarDias(hojeISO(), p.intervaloRega || 7) };
        });
        gravarColecao(email, lista);
    }

    function reagendarRega(email, id) {
        const lista = getColecao(email).map((p) => {
            if (p.id !== id) return p;
            const base = p.proximaRega && p.proximaRega > hojeISO() ? p.proximaRega : hojeISO();
            return { ...p, proximaRega: adicionarDias(base, 1) };
        });
        gravarColecao(email, lista);
    }

    function precisaRegaHoje(proximaRegaData) {
        if (!proximaRegaData) return true;
        return proximaRegaData <= hojeISO();
    }

    function filtrarCatalogo({ texto = '', tipo = '', nivel = '' } = {}) {
        const q = texto.trim().toLowerCase();
        return getCatalogo().filter((p) => {
            const nomeOk = !q || p.nome.toLowerCase().includes(q) || (p.cientifico && p.cientifico.toLowerCase().includes(q));
            const tipoOk = !tipo || p.tipo === tipo;
            const nivelOk = !nivel || p.nivel === nivel;
            return nomeOk && tipoOk && nivelOk;
        });
    }

    const api = {
        $, uid, hojeISO, adicionarDias, diasAte, esc, eur, opt,
        NIVEIS, TIPOS,
        registar, login, getSessao, logout, atualizarPerfil,
        getCatalogo, getFoto, getColecao, adicionarAColecao, semear, guardarPlanta,
        eliminarPlanta, marcarRega, reagendarRega, precisaRegaHoje, filtrarCatalogo
    };

    Object.assign(window, { $, uid, hojeISO, adicionarDias, diasAte, esc, eur, opt, api });
    window.api = api;
})();