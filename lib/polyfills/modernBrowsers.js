// O Next usa URL.canParse internamente, mas esse método chegou depois de parte
// da faixa de navegadores oficialmente suportada pelo Next 16. Mantemos apenas
// essa compatibilidade e evitamos enviar os polyfills legados sinalizados pelo
// Lighthouse para recursos já nativos nos navegadores-alvo do projeto.
if (!('canParse' in URL)) {
  URL.canParse = function canParse(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

