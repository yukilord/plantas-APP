(function () {
    const { $ } = window.api;

    const ICONS = {
        home: '<path d="M3 11l9-8 9 8M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
        compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
        leaf: '<path d="M5 20C4 11 9 4 20 4c0 11-7 16-15 16zM5 20l9-9"/>',
        drop: '<path d="M12 3s6.5 6.6 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
        sprout: '<path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
        note: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
        card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'
    };

    const ic = (n) =>
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

    const NAV = [
        ['hoje', 'Hoje', 'home'],
        ['descobrir', 'Descobrir', 'compass'],
        null,
        ['colecao', 'Coleção', 'leaf'],
        ['lembretes', 'Regas', 'drop']
    ];
    const POSICAO = { hoje: 0, descobrir: 1, colecao: 3, lembretes: 4 };

    const ATALHOS = [
        ["navegar('lembretes-pessoais')", 'Lembretes', 'leaf', -94, -82, 0],
        ["novaPlanta()", 'Nova', 'sprout', 0, -124, 1],
        ["navegar('perfil')", 'Perfil', 'user', 94, -82, 2]
    ];

    // Entradas extra que só aparecem na barra lateral do computador
    // (no telemóvel estão na roda de atalhos do botão +).
    const EXTRA = [
        ['lembretes-pessoais', 'Lembretes', 'note', ''],
        ['diagnostico', 'Diagnóstico', 'search', ''],
        ['cartao', 'Cartão de férias', 'card', ''],
        ['perfil', 'Perfil', 'user', 'fim']
    ];
    const ecraGrande = window.matchMedia('(min-width: 900px)');

    function initHeader() {
        $('dock').innerHTML =
            '<div class="ind" id="ind"></div>' +
            NAV.map((n) => n
                ? `<button data-n="${n[0]}" onclick="navegar('${n[0]}')">${ic(n[2])}<span>${n[1]}</span></button>`
                : '<button class="fab" id="fab" aria-label="Nova planta e atalhos" onclick="alternarFan()"><i>' + ic('plus') + '</i><span class="dk-t">Nova planta</span></button>'
            ).join('') +
            '<div class="dk dk-sep"></div>' +
            EXTRA.map((n) => `<button class="dk ${n[3]}" data-n="${n[0]}" onclick="navegar('${n[0]}')">${ic(n[2])}<span>${n[1]}</span></button>`).join('') +
            '<div class="fan" id="fan">' + ATALHOS.map((a) =>
                `<button class="fi" style="--x:${a[3]}px;--y:${a[4]}px;--k:${a[5]}" onclick="${a[0]}">${ic(a[2])}<span>${a[1]}</span></button>`
            ).join('') + '</div>';
        $('vl').onclick = () => fan(0);
        // No computador o botão + cria logo uma planta; no telemóvel abre a roda de atalhos.
        window.alternarFan = () => (ecraGrande.matches ? window.novaPlanta() : fan());
        ecraGrande.addEventListener('change', () => fan(0));
    }

    function fan(v) {
        const aberta = v === undefined ? !$('fan').classList.contains('o') : !!v;
        $('fan').classList.toggle('o', aberta);
        $('fab').classList.toggle('o', aberta);
        $('vl').classList.toggle('o', aberta);
    }

    function marcarNav(ecra) {
        document.querySelectorAll('.dock > button[data-n]').forEach((b) => b.classList.toggle('on', b.dataset.n === ecra));
        const i = POSICAO[ecra], ind = $('ind');
        ind.style.opacity = i === undefined ? 0 : 1;
        if (i !== undefined) ind.style.setProperty('--i', i);
    }

    window.herbanarioHeader = { ic, initHeader, fan, marcarNav };
})();
