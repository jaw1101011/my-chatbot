/* Display-only enhancement. Authentication, messages, and API remain in index.html. */
(() => {
  'use strict';
  const storageKey = 'lumi.display.v1';
  const defaults = { theme: 'system', accent: 'sage', fontSize: 16, width: 'comfortable', spacing: 'comfortable', reduceMotion: false };
  const palettes = {
    sage: { light: ['#38745d','#e7efe8','#ffffff'], dark: ['#a1d0b3','#2c4436','#182a1e'] },
    lavender: { light: ['#7460aa','#eee9f6','#ffffff'], dark: ['#c2b0ec','#3b3250','#241934'] },
    blue: { light: ['#3f6fac','#e7eef8','#ffffff'], dark: ['#a3c5f3','#2b3c51','#172a41'] },
    rose: { light: ['#a15370','#f6e9ee','#ffffff'], dark: ['#edb2c6','#4b303d','#351c27'] }
  };
  const widths = { narrow: 640, comfortable: 800, wide: 1040 };
  const spacings = { compact: [12,12], comfortable: [24,18], relaxed: [36,22] };
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const dialog = document.querySelector('#display-settings');
  const settingsForm = document.querySelector('#display-form');
  const note = document.querySelector('#settings-storage-note');
  let settings = { ...defaults };
  let lastTrigger;
  function sanitize(value) {
    const v = value && typeof value === 'object' ? value : {};
    return {
      theme: ['light','dark','system'].includes(v.theme) ? v.theme : defaults.theme,
      accent: Object.hasOwn(palettes,v.accent) ? v.accent : defaults.accent,
      fontSize: Number.isInteger(v.fontSize) && v.fontSize >= 14 && v.fontSize <= 22 ? v.fontSize : defaults.fontSize,
      width: Object.hasOwn(widths,v.width) ? v.width : defaults.width,
      spacing: Object.hasOwn(spacings,v.spacing) ? v.spacing : defaults.spacing,
      reduceMotion: v.reduceMotion === true
    };
  }
  try { settings = sanitize(JSON.parse(localStorage.getItem(storageKey))); } catch { /* Private mode or invalid saved preferences: use defaults. */ }
  function apply() {
    const theme = settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme;
    root.dataset.theme = theme;
    root.dataset.reduceMotion = String(settings.reduceMotion);
    const palette = palettes[settings.accent][theme];
    ['--accent','--accent-soft','--accent-ink'].forEach((key,i) => root.style.setProperty(key,palette[i]));
    root.style.setProperty('--chat-font',`${settings.fontSize}px`);
    root.style.setProperty('--chat-width',`${widths[settings.width]}px`);
    root.style.setProperty('--message-gap',`${spacings[settings.spacing][0]}px`);
    root.style.setProperty('--message-padding',`${spacings[settings.spacing][1]}px`);
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1b201e' : '#fcfcfa';
    document.querySelector('#font-size-value').value = `${settings.fontSize}px`;
  }
  function syncControls() {
    settingsForm.elements.theme.value = settings.theme;
    settingsForm.elements.accent.value = settings.accent;
    settingsForm.elements.fontSize.value = settings.fontSize;
    settingsForm.elements.width.value = settings.width;
    settingsForm.elements.spacing.value = settings.spacing;
    settingsForm.elements.reduceMotion.checked = settings.reduceMotion;
  }
  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify(settings)); }
    catch { note.textContent = '현재 브라우저에서 설정 저장이 차단되어 있어요. 이번 화면에는 적용되지만 새로고침하면 초기화될 수 있어요.'; }
  }
  settingsForm.addEventListener('submit',event => event.preventDefault());
  settingsForm.addEventListener('input',() => {
    settings = sanitize({ theme: settingsForm.elements.theme.value, accent: settingsForm.elements.accent.value,
      fontSize: Number(settingsForm.elements.fontSize.value), width: settingsForm.elements.width.value,
      spacing: settingsForm.elements.spacing.value, reduceMotion: settingsForm.elements.reduceMotion.checked });
    apply(); save();
  });
  document.querySelectorAll('[data-open-settings]').forEach(button => button.addEventListener('click',() => {
    lastTrigger = button; syncControls(); dialog.showModal();
  }));
  function closeSettings() { dialog.close(); }
  document.querySelector('#close-settings').addEventListener('click',closeSettings);
  document.querySelector('#done-settings').addEventListener('click',closeSettings);
  dialog.addEventListener('close',() => lastTrigger?.focus());
  dialog.addEventListener('click',event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSettings();
  });
  document.querySelector('#reset-display').addEventListener('click',() => { settings = { ...defaults }; apply(); syncControls(); save(); });
  media.addEventListener('change',apply);
  window.addEventListener('storage',event => {
    if (event.key !== storageKey) return;
    try { settings = sanitize(JSON.parse(event.newValue)); apply(); syncControls(); } catch { /* Ignore malformed changes from another tab. */ }
  });
  const sidebarToggle = document.querySelector('#open-sidebar');
  const backdrop = document.querySelector('#sidebar-backdrop');
  function setSidebar(open) {
    document.body.classList.toggle('sidebar-open',open);
    backdrop.classList.toggle('hidden',!open);
    sidebarToggle.setAttribute('aria-expanded',String(open));
    if (open) document.querySelector('#close-sidebar').focus();
  }
  sidebarToggle.addEventListener('click',() => setSidebar(true));
  document.querySelector('#close-sidebar').addEventListener('click',() => { setSidebar(false); sidebarToggle.focus(); });
  backdrop.addEventListener('click',() => setSidebar(false));
  document.addEventListener('keydown',event => { if (event.key === 'Escape' && document.body.classList.contains('sidebar-open') && !dialog.open) { setSidebar(false); sidebarToggle.focus(); } });
  document.querySelector('#conversation-list').addEventListener('click',event => {
    const button = event.target.closest('.conversation-button');
    if (!button) return;
    document.querySelectorAll('.conversation-button').forEach(item => item.removeAttribute('aria-current'));
    button.setAttribute('aria-current','true'); setSidebar(false);
  });
  document.querySelector('#new-chat').addEventListener('click',() => setSidebar(false));
  apply(); syncControls();
})();
