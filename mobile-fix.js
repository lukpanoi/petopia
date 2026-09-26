(() => {
  const nav = document.getElementById('nav');
  const btn = document.getElementById('menuBtn');
  if (!nav || !btn) return;

  const isThai = () => document.documentElement.lang === 'th';

  function setMenu(open) {
    nav.classList.toggle('menuopen', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? (isThai() ? 'ปิดเมนู' : 'Close menu') : (isThai() ? 'เปิดเมนู' : 'Open menu'));
    btn.textContent = open ? '×' : '☰';
  }

  function closeMenu() {
    setMenu(false);
  }
  window.petopiaCloseMenu = closeMenu;

  btn.type = 'button';
  btn.setAttribute('aria-controls', 'primaryNav');
  btn.onclick = null;
  closeMenu();

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu(!nav.classList.contains('menuopen'));
  });

  nav.querySelectorAll('[data-page], #langBtn, #favBtn, #cartBtn, #loginBtn, #profileBtn, #logoutBtn').forEach((item) => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 780) closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (window.innerWidth <= 780 && nav.classList.contains('menuopen') && !nav.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('menuopen')) {
      closeMenu();
      btn.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 780) closeMenu();
  });
})();
