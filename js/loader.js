/* ==========================================================
   View Loader - Fetches HTML partials and injects into DOM
   ========================================================== */

async function loadViews() {
    const app = document.getElementById('app');

    // Phase 1: Load auth pages and app shell in parallel
    const [authHtml, shellHtml] = await Promise.all([
        fetch('views/auth.html').then(r => r.text()),
        fetch('views/app-shell.html').then(r => r.text())
    ]);
    app.insertAdjacentHTML('beforeend', authHtml);
    app.insertAdjacentHTML('beforeend', shellHtml);

    // Phase 2: Load all panels and modals in parallel
    const panelNames = ['dashboard', 'doctors', 'patients', 'appointments', 'records', 'users', 'profile'];
    const modalNames = ['doctor', 'patient', 'appointment', 'record'];

    const allFetches = [
        ...panelNames.map(name => fetch(`views/panels/${name}.html`).then(r => r.text())),
        ...modalNames.map(name => fetch(`views/modals/${name}.html`).then(r => r.text()))
    ];

    const results = await Promise.all(allFetches);

    // Inject panels into .main-content (inside app shell)
    const mainContent = document.querySelector('.main-content');
    for (let i = 0; i < panelNames.length; i++) {
        mainContent.insertAdjacentHTML('beforeend', results[i]);
    }

    // Inject modals into #app (body level)
    for (let i = panelNames.length; i < results.length; i++) {
        app.insertAdjacentHTML('beforeend', results[i]);
    }
}
