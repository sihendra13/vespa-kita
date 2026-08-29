(function() {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    return;
  }
  const dismissedSession = sessionStorage.getItem('pwa_banner_dismissed_session');
  if (dismissedSession) {
    return;
  }

  let deferredPrompt;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; background:var(--aspal-2, #1E2124); padding:12px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.6); box-shadow:0 10px 30px rgba(0,0,0,0.8);">
      <img src="/icon-192.png" style="width:44px; height:44px; border-radius:8px;">
      <div style="flex:1;">
        <div style="font-family:var(--mono, monospace); font-size:11px; color:var(--mint, #6FA89A); text-transform:uppercase; font-weight:bold; letter-spacing:0.05em;">VespaKita App</div>
        <div style="font-size:12px; color:#FFFFFF; line-height:1.3; margin-top:4px;">Instal aplikasi VespaKita untuk pengalaman yang lebih menyenangkan.</div>
      </div>
      <button id="pwa-install-btn" style="background:var(--merah, #C2272D); color:#fff; border:none; padding:8px 14px; border-radius:6px; font-family:var(--body, sans-serif); font-weight:600; font-size:13px; cursor:pointer;">Install</button>
      <button id="pwa-close-btn" style="background:transparent; border:none; color:var(--chrome, #A9A49B); font-size:22px; cursor:pointer; padding:0 0 0 8px; line-height:1;">&times;</button>
    </div>
  `;
  
  Object.assign(banner.style, {
    position: 'fixed',
    top: '80px',
    left: '16px',
    right: '16px',
    zIndex: '9999',
    transform: 'translateY(-250%)',
    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    maxWidth: '400px',
    margin: '0 auto'
  });

  const iosModal = document.createElement('div');
  iosModal.innerHTML = `
    <div id="pwa-ios-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10000; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(5px);">
      <div style="background:var(--aspal, #15171A); padding:32px 24px; border-radius:16px; width:100%; max-width:320px; text-align:center; position:relative; border:1px solid rgba(255,255,255,0.1); box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        <button id="pwa-ios-close" style="position:absolute; top:12px; right:12px; background:transparent; border:none; color:var(--chrome, #A9A49B); font-size:28px; cursor:pointer; line-height:1; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">&times;</button>
        <img src="/icon-192.png" style="width:56px; height:56px; border-radius:12px; margin:0 auto 16px;">
        <div style="font-family:var(--display, sans-serif); font-size:20px; margin-bottom:8px; color:#fff; text-transform:uppercase;">Install Aplikasi</div>
        <p style="color:var(--chrome, #A9A49B); font-size:14px; margin-bottom:24px; line-height:1.6;">Agar lebih praktis, ikuti 2 langkah mudah ini:</p>
        
        <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:12px; text-align:left;">
          <div style="color:#fff; font-size:13px; margin-bottom:12px; display:flex; align-items:flex-start; gap:12px;">
            <div style="background:var(--merah, #C2272D); color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; flex-shrink:0;">1</div>
            <div>Tekan tombol <b>Share</b> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom; margin:0 2px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> di bar bagian bawah Safari.</div>
          </div>
          <div style="color:#fff; font-size:13px; display:flex; align-items:flex-start; gap:12px;">
            <div style="background:var(--merah, #C2272D); color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; flex-shrink:0;">2</div>
            <div>Geser menu ke atas, lalu pilih <b>Tambah ke Layar Utama</b> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom; margin:0 2px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
  document.body.appendChild(iosModal);

  const showBanner = () => {
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 2000);
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  if (isIOS) {
    showBanner();
  }

  document.getElementById('pwa-close-btn').addEventListener('click', () => {
    banner.style.transform = 'translateY(-250%)';
    sessionStorage.setItem('pwa_banner_dismissed_session', 'true');
  });

  const iosModalEl = document.getElementById('pwa-ios-modal');
  document.getElementById('pwa-ios-close').addEventListener('click', () => {
    iosModalEl.style.display = 'none';
  });

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (isIOS) {
      iosModalEl.style.display = 'flex';
      banner.style.transform = 'translateY(-250%)';
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        banner.style.transform = 'translateY(-250%)';
      }
      deferredPrompt = null;
    } else {
      alert("Gunakan menu browser (titik tiga) lalu pilih 'Install App' atau 'Add to Home Screen'.");
    }
  });
})();
