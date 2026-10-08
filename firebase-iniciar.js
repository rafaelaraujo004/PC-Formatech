// site.html carrega o Firebase com defer; esta linha precisa rodar depois
// do firebase-config.js e antes de site-config.js/theme-system.js, que usam o db.
initFirebase();
