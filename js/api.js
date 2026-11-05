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

    function garantirContaTeste() {
        const lista = users();
        if (lista.some((u) => String(u.email || '').trim().toLowerCase() === 'teste@teste.pt')) return;
        lista.push({ nome: 'Teste', email: 'teste@teste.pt', password: 'teste123', nivel: 'Iniciante' });
        gravarUsers(lista);
    }

    garantirContaTeste();

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
    const LEMBRETES_KEY = 'herbanario_lembretes';
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
        'Tulipa': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT30AqJoQCyetA7BOTFJaQDKSsNTDZ0ehwRzi8icjw3_BpiIsyLcl679l8E&s=10',
        'Bambu-da-sorte': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Dracaena_sanderiana_2.jpg',
        'Palmeira-areca': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Dypsis_lutescens1.jpg',
        'Calathea': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Calathea_orbifolia_2.jpg',
        'Bonsai de Ficus': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Ficus_microcarpa_-_La_Gomera_01.jpg',
        'Echeveria': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Echeveria_elegans_-_1.png',
        'Cíclame': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Yagur_%E2%80%93_Nesher%2C_the_Green_Path_%E2%80%93_Mount_Carmel_016.JPG',
        'Begónia-rex': 'https://upload.wikimedia.org/wikipedia/commons/6/62/Painted_Leaved_Begonia._Begonia_rex_Putz._Flore_des_serres_et_des_jardins_de_l%27Europe_v.12_%281857%29.jpg',
        'Camélia': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Camellia_japonica_NBG.jpg',
        'Tomateiro': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Starr_080501-4344_Solanum_lycopersicum_var._lycopersicum.jpg',
        'Limoeiro': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Citrus_x_limon_%28Outjo%29.jpg'
    };

    const RAW = [
        'Jiboia|Epipremnum aureum|I|i|7|Luz indireta|140|Perdoa esquecimentos. Rega quando o topo do substrato estiver seco.',
        'Espada-de-São-Jorge|Dracaena trifasciata|I|i|14|Qualquer luz|150|Quase indestrutível. O maior erro é regar demais.',
        'Cacto-bola|Echinocactus grusonii|I|i|21|Sol direto|95|Adora sol. Reduz a rega para metade no inverno.',
        'Aloé Vera|Aloe vera|I|i|14|Sol filtrado|120|Rega a fundo, mas só com a terra completamente seca.',
        'Planta-ZZ|Zamioculcas zamiifolia|I|i|14|Sombra|160|Guarda água nos rizomas. Ideal para cantos escuros.',
        'Costela-de-Adão|Monstera deliciosa|M|i|7|Luz indireta|135|Limpa as folhas com um pano húmido e dá-lhe um tutor.',
        'Fícus-lira|Ficus lyrata|A|i|7|Luz forte|110|Odeia mudanças. Escolhe um sítio e deixa-a ficar lá.',
        'Orquídea|Phalaenopsis|M|i|7|Luz indireta|330|Rega por imersão 10 minutos e deixa escorrer bem.',
        'Lavanda|Lavandula angustifolia|I|e|5|Sol direto|270|Gosta de solo pobre e drenado. Poda depois da floração.',
        'Alecrim|Salvia rosmarinus|I|j|6|Sol direto|150|Mediterrânico por natureza: pouca água e muito sol.',
        'Hortelã|Mentha spicata|I|j|3|Meia-sombra|125|Cresce depressa. Mete-a num vaso para não invadir o jardim.',
        'Manjericão|Ocimum basilicum|M|j|2|Sol direto|105|Belisca as pontas para ficar frondoso. Odeia frio.',
        'Hibisco|Hibiscus rosa-sinensis|M|e|4|Sol direto|350|Floresce com calor. Rega abundante no verão.',
        'Girassol|Helianthus annuus|I|j|3|Sol direto|45|Semeia na primavera ao sol. As flores seguem a luz.',
        'Rosa|Rosa × hybrida|A|j|4|Sol direto|355|Pede poda anual, adubo e atenção aos pulgões.',
        'Tulipa|Tulipa gesneriana|M|j|4|Sol suave|320|Planta os bolbos no outono para florir na primavera.',
        'Bambu-da-sorte|Dracaena sanderiana|I|i|7|Luz indireta|130|Vive em água. Troca-a todas as semanas.',
        'Palmeira-areca|Dypsis lutescens|M|i|5|Luz indireta|100|Gosta de humidade. Pulveriza as folhas com frequência.',
        'Calathea|Calathea orbifolia|A|i|4|Sombra|145|Prefere água da chuva e ar húmido. Foge das correntes de ar.',
        'Bonsai de Ficus|Ficus microcarpa|A|i|3|Luz forte|115|Verifica a terra todos os dias e poda para manter a forma.',
        'Echeveria|Echeveria elegans|I|i|12|Sol direto|175|Rosetas compactas. Rega junto à terra, nunca nas folhas.',
        'Cíclame|Cyclamen persicum|M|o|4|Luz fresca|340|Gosta de frescura. Rega por baixo e tira as flores secas.',
        'Begónia-rex|Begonia rex|A|o|5|Luz indireta|300|Folhas deslumbrantes mas sensíveis. Evita molhá-las.',
        'Camélia|Camellia japonica|A|o|6|Meia-sombra|345|Terra ácida e rega constante. Não a mudes com botões.',
        'Tomateiro|Solanum lycopersicum|M|j|2|Sol direto|5|Rega ao pé, de manhã, e põe tutor desde cedo.',
        'Limoeiro|Citrus × limon|A|e|4|Sol direto|55|Pede adubo rico em azoto e proteção contra geadas.'
    ];

    const DETALHES = {
        'Jiboia': 'Trepadeira tropical de crescimento rápido, adequada a vasos suspensos ou com tutor. Prefere luz indireta e substrato leve; deixa secar os primeiros centímetros da terra antes de regar. Podes podar as pontas para a tornar mais densa e propagar as estacas em água.',
        'Espada-de-São-Jorge': 'Suculenta resistente originária de África Ocidental, tolera desde luz indireta a locais mais sombrios. Usa um substrato muito drenante e espera que seque completamente antes de regar: o excesso de água é a causa mais comum de problemas. Cresce devagar e raramente precisa de poda.',
        'Cacto-bola': 'Cacto globular mexicano que precisa de várias horas de luz forte e de um vaso com drenagem. Rega apenas quando a terra estiver seca, reduzindo muito a frequência durante o inverno. Um substrato mineral para cactos ajuda a evitar raízes encharcadas.',
        'Aloé Vera': 'Suculenta de folhas carnudas que armazena água e gosta de muita claridade, idealmente junto a uma janela luminosa. Deixa o substrato secar por completo entre regas e usa um vaso com furos. Os rebentos laterais podem ser separados quando já tiverem raízes.',
        'Planta-ZZ': 'Planta tropical de rizomas que armazenam água, conhecida por tolerar pouca luz e períodos sem rega. Coloca-a em luz indireta se quiseres estimular o crescimento e deixa a terra secar bem antes de regar. Evita vasos sem drenagem e não cortes folhas saudáveis.',
        'Costela-de-Adão': 'Trepadeira tropical que, na natureza, sobe por troncos e desenvolve folhas recortadas quando amadurece. Dá-lhe luz indireta forte, um tutor e espaço para as raízes aéreas; rega quando a camada superior do substrato secar. Limpa as folhas e roda o vaso ocasionalmente para um crescimento equilibrado.',
        'Fícus-lira': 'Árvore tropical de folhas grandes, sensível a mudanças frequentes de lugar e a correntes de ar. Prefere luz abundante indireta e regas depois de secar a parte superior da terra. Limpa o pó das folhas e verifica a drenagem; folhas amarelas podem indicar água a mais.',
        'Orquídea': 'A Phalaenopsis é uma orquídea epífita: as raízes precisam de ar e não devem ficar em terra comum compacta. Usa casca própria para orquídeas, luz indireta e rega quando as raízes ficarem prateadas, deixando toda a água escorrer. Após a floração, a haste pode voltar a florir.',
        'Lavanda': 'Arbusto mediterrânico aromático que floresce melhor com sol direto e boa circulação de ar. Precisa de substrato pobre e bem drenado; rega moderadamente e evita água parada nas raízes. Uma poda ligeira após a floração ajuda a manter a forma, sem cortar a madeira velha.',
        'Alecrim': 'Arbusto mediterrânico perene, aromático e adaptado a sol direto e pouca água. Cultiva-o em substrato drenante e deixa a terra secar parcialmente entre regas. Colhe as pontas regularmente para estimular ramificação e evita podas severas na madeira velha.',
        'Hortelã': 'Erva aromática vigorosa que prefere substrato fresco e luz abundante sem calor excessivo. Mantém a terra ligeiramente húmida, sem a encharcar, e colhe ou poda as pontas para incentivar folhas novas. Um vaso próprio impede que os rizomas se espalhem pelo jardim.',
        'Manjericão': 'Erva anual de clima quente que precisa de várias horas de luz e proteção contra o frio. Rega quando a superfície começar a secar, de preferência junto à terra, e remove as flores para prolongar a produção de folhas. Colher as pontas acima de um par de folhas estimula novos ramos.',
        'Hibisco': 'Arbusto tropical de floração abundante, que aprecia calor, luz forte e proteção contra geadas. Durante o crescimento mantém o substrato uniformemente húmido, mas com drenagem. Uma poda ligeira no início da primavera pode estimular novos ramos e flores.',
        'Girassol': 'Planta anual de crescimento rápido que precisa de sol direto e espaço para desenvolver raízes profundas. Semeia-a no local definitivo e mantém a terra húmida enquanto a planta é jovem; depois rega profundamente quando o solo começar a secar. Variedades altas podem precisar de tutor.',
        'Rosa': 'Arbusto de floração que beneficia de várias horas de sol, circulação de ar e solo fértil com boa drenagem. Rega junto à base quando a terra começar a secar e evita molhar as folhas ao fim do dia. Retira flores murchas e faz a poda principal no período adequado à variedade e ao clima.',
        'Tulipa': 'Bolbosa de clima fresco que normalmente floresce na primavera após um período frio. Planta os bolbos em substrato drenante, rega moderadamente durante o crescimento e evita deixar o vaso encharcado. Depois da floração, deixa as folhas amarelecer naturalmente para o bolbo repor reservas.',
        'Bambu-da-sorte': 'Apesar do nome, é uma Dracaena tropical e não um bambu verdadeiro. Cresce em água limpa ou em substrato húmido, com luz indireta; se estiver em água, troca-a regularmente e usa água com poucos sais. Evita sol direto forte, que pode queimar as folhas.',
        'Palmeira-areca': 'Palmeira tropical que forma touceiras e prefere luz indireta forte e ambiente moderadamente húmido. Rega quando a camada superior secar, sem deixar água acumulada no prato. As pontas castanhas podem surgir com ar muito seco ou água com muitos sais.',
        'Calathea': 'Planta tropical de folhagem decorativa que prefere luz indireta, calor estável e humidade no ar. Mantém o substrato ligeiramente húmido, nunca encharcado, e evita água muito calcária se as pontas das folhas ficarem castanhas. Protege-a de correntes de ar e sol direto.',
        'Bonsai de Ficus': 'Ficus tropical cultivado em vaso raso, que precisa de muita claridade e regas ajustadas ao substrato e à estação. Verifica a terra com frequência e rega abundantemente quando começar a secar, deixando escorrer o excesso. Poda os rebentos para manter a forma e evita mudanças bruscas de ambiente.',
        'Echeveria': 'Suculenta em roseta que necessita de luz forte e substrato mineral muito drenante. Rega a terra apenas quando estiver seca e evita que a água fique presa no centro da roseta. As folhas inferiores secas são normais; remove-as suavemente para reduzir a humidade junto ao caule.',
        'Cíclame': 'Planta de floração que prefere temperaturas frescas e luz brilhante sem sol forte. Rega pela base ou pela borda do vaso quando a superfície começar a secar e esvazia o prato depois. Retira flores e folhas murchas pela base; no calor pode entrar em repouso.',
        'Begónia-rex': 'Begónia cultivada pelas folhas coloridas, sensível ao encharcamento e à água sobre a folhagem. Prefere luz indireta, calor estável e substrato arejado, ligeiramente húmido. Evita sol direto e correntes de ar; remove folhas danificadas para melhorar a ventilação.',
        'Camélia': 'Arbusto de floração que prefere meia-sombra luminosa e substrato ácido, rico em matéria orgânica. Mantém a humidade regular sem encharcar e usa água pouco calcária sempre que possível. Evita mudanças de lugar quando os botões estão formados, pois podem cair com o stress.',
        'Tomateiro': 'Planta produtiva de sol pleno que precisa de vaso grande, solo fértil e tutor desde cedo. Rega profundamente junto à base com regularidade, evitando alternar entre seca extrema e excesso de água. Retira folhas doentes e assegura boa circulação de ar para reduzir problemas fúngicos.',
        'Limoeiro': 'Citrino que precisa de várias horas de sol, substrato ligeiramente ácido e vaso com boa drenagem. Rega quando a camada superior começar a secar e aduba durante o período de crescimento com fertilizante para citrinos. Protege de geadas e observa folhas e ramos para detetar pragas.'
    };

    const CATALOGO = RAW.map((r, i) => {
        const a = r.split('|');
        return {
            id: 'esp' + i, nome: a[0], cientifico: a[1], nivel: N[a[2]], tipo: T[a[3]],
            intervaloRega: +a[4], luz: a[5], hue: +a[6], dicas: a[7], detalhes: DETALHES[a[0]],
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
            lista.push(planta);
        }
        gravarColecao(email, lista);
    }

    function getLembretes(email) {
        try {
            const dados = JSON.parse(localStorage.getItem(LEMBRETES_KEY) || '{}');
            return (dados[email] || []).slice().sort((a, b) => b.data.localeCompare(a.data));
        } catch {
            return [];
        }
    }

    function adicionarLembrete(email, texto) {
        let dados;
        try { dados = JSON.parse(localStorage.getItem(LEMBRETES_KEY) || '{}'); } catch { dados = {}; }
        const lembretes = Array.isArray(dados[email]) ? dados[email] : [];
        lembretes.push({ id: uid(), texto: String(texto), data: new Date().toISOString() });
        dados[email] = lembretes;
        localStorage.setItem(LEMBRETES_KEY, JSON.stringify(dados));
    }

    function eliminarLembrete(email, id) {
        let dados;
        try { dados = JSON.parse(localStorage.getItem(LEMBRETES_KEY) || '{}'); } catch { dados = {}; }
        dados[email] = (Array.isArray(dados[email]) ? dados[email] : []).filter((lembrete) => lembrete.id !== id);
        localStorage.setItem(LEMBRETES_KEY, JSON.stringify(dados));
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

    function diagnosticar({ sintoma, solo, luz } = {}) {
        const causas = [
            {
                id: 'rega-excessiva',
                nome: 'Rega em excesso',
                pontos: (solo === 'humido' ? 3 : 0) + (sintoma === 'amarelas' ? 2 : 0) + (sintoma === 'caem' ? 1 : 0),
                minimo: 3,
                acao: 'Deixa o substrato secar antes da próxima rega, confirma que o vaso tem drenagem e não deixes água acumulada no prato.'
            },
            {
                id: 'pouca-luz',
                nome: 'Pouca luz',
                pontos: (luz === 'pouca' ? 3 : 0) + (sintoma === 'amarelas' ? 1 : 0) + (sintoma === 'caem' ? 1 : 0),
                minimo: 3,
                acao: 'Experimenta aproximar a planta de uma janela com luz indireta. Evita mudanças bruscas para sol direto.'
            },
            {
                id: 'falta-rega',
                nome: 'Falta de água',
                pontos: (solo === 'seco' ? 3 : 0) + (sintoma === 'pontas' ? 2 : 0) + (sintoma === 'caem' ? 1 : 0),
                minimo: 3,
                acao: 'Rega lentamente até humedecer todo o substrato e deixa o excesso escorrer. Volta a verificar a terra antes da próxima rega.'
            }
        ].sort((a, b) => b.pontos - a.pontos);
        const melhor = causas[0];
        if (melhor.pontos < melhor.minimo || melhor.pontos === causas[1].pontos) {
            return {
                causa: 'Causa incerta',
                acao: 'Verifica a humidade da terra junto às raízes, a drenagem do vaso e a luz ao longo do dia. Se os sintomas continuarem, procura sinais de pragas.'
            };
        }
        return { causa: melhor.nome, acao: melhor.acao };
    }

    const api = {
        $, uid, hojeISO, adicionarDias, diasAte, esc, opt,
        NIVEIS, TIPOS,
        registar, login, getSessao, logout, atualizarPerfil,
        getCatalogo, getFoto, getColecao, adicionarAColecao, guardarPlanta,
        eliminarPlanta, marcarRega, reagendarRega, precisaRegaHoje, filtrarCatalogo, diagnosticar,
        getLembretes, adicionarLembrete, eliminarLembrete
    };

    Object.assign(window, { $, uid, hojeISO, adicionarDias, diasAte, esc, opt, api });
    window.api = api;
})();