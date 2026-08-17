(function () {
  const form = document.getElementById('unlock');
  const openBtn = document.getElementById('open');
  const input = document.getElementById('passphrase');
  const error = document.getElementById('error');

  openBtn.addEventListener('click', () => {
    openBtn.hidden = true;
    document.querySelector('.hint').hidden = true;
    form.hidden = false;
    input.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const pass = input.value.trim();
    if (!pass) return;

    try {
      const res = await fetch('wunderpaket.enc');
      if (!res.ok) throw new Error('Verschlüsseltes Paket konnte nicht geladen werden.');
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);

      const salt = bytes.slice(0, 16);
      const iv = bytes.slice(16, 28);
      const data = bytes.slice(28);

      const enc = new TextEncoder();
      const keyMat = await crypto.subtle.importKey('raw', enc.encode(pass), { name: 'PBKDF2' }, false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMat,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      const html = new TextDecoder().decode(dec);

      document.open();
      document.write(html);
      document.close();

      if (window.initWunderpaket) {
        window.initWunderpaket();
      }
    } catch (err) {
      error.textContent = 'Falscher Code! Bitte versuche es erneut.';
      input.value = '';
      input.focus();
    }
  });
})();
