/* Display-only enhancement. Authentication, messages, and API remain in index.html. */
(() => {
  'use strict';
  const storageKey = 'lumi.display.v1';
  const defaults = { theme: 'system', accent: 'sage', fontSize: 16, width: 'comfortable', spacing: 'comfortable', reduceMotion: false, customColors: { light: {}, dark: {} } };
  const colorFields = [
    ['page','전체 배경','--page'], ['surface','설정창·카드 배경','--surface'],
    ['sidebar','사이드바 배경','--sidebar'], ['ink','기본 글자','--ink'],
    ['muted','보조 글자','--muted'], ['line','테두리','--line'],
    ['botBg','루미 말풍선','--bot-bg'], ['botText','루미 글자','--bot-text'],
    ['userBg','내 말풍선','--user-bg'], ['userText','내 글자','--user-text'],
    ['inputBg','입력창 배경','--input-bg'], ['accent','버튼·포인트','--accent'],
    ['accentInk','버튼 글자','--accent-ink']
  ];
  const validHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const emptyColors = () => ({light: {}, dark: {}});
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
  const colorPanel = document.createElement('fieldset');
  colorPanel.className = 'custom-color-panel';
  colorPanel.innerHTML = '<legend>자유 색상 설정</legend><p id="color-mode-note" class="settings-note"></p><div class="custom-color-grid"></div><p id="color-contrast-note" class="color-warning" role="status"></p><button type="button" class="quiet-button" id="reset-colors">현재 테마의 색상만 초기화</button>';
  const colorControls = new Map();
  for (const [key,label] of colorFields) {
    const row = document.createElement('div');
    row.className = 'custom-color-row';
    const title = document.createElement('label');
    title.htmlFor = `color-${key}`;
    title.textContent = label;
    const picker = document.createElement('input');
    picker.type = 'color'; picker.id = `color-${key}`;
    const hex = document.createElement('input');
    hex.type = 'text'; hex.id = `hex-${key}`; hex.maxLength = 7;
    hex.setAttribute('aria-label',`${label} HEX 코드`);
    hex.autocomplete = 'off'; hex.spellcheck = false; hex.placeholder = '#000000';
    const reset = document.createElement('button');
    reset.type = 'button'; reset.className = 'color-reset'; reset.textContent = '↶';
    reset.setAttribute('aria-label',`${label} 기본 색상으로`);
    row.append(title,picker,hex,reset);
    colorPanel.querySelector('.custom-color-grid').appendChild(row);
    colorControls.set(key,{picker,hex});
    picker.addEventListener('input',() => updateColor(key,picker.value));
    hex.addEventListener('input',() => {
      const value = hex.value.trim();
      if (!validHex(value)) { hex.setAttribute('aria-invalid','true'); return; }
      hex.removeAttribute('aria-invalid'); updateColor(key,value);
    });
    hex.addEventListener('blur',syncColorControls);
    reset.addEventListener('click',() => {
      delete settings.customColors[resolvedTheme()][key]; apply(); syncColorControls(); save();
    });
  }
  settingsForm.querySelector('.settings-preview').before(colorPanel);
  const sample = document.createElement('div');
  sample.className = 'color-chat-preview';
  const botSample = document.createElement('p'); botSample.className = 'color-preview-bot';
  botSample.textContent = '루미 · 오늘은 어떤 이야기를 나눌까요?';
  const userSample = document.createElement('p'); userSample.className = 'color-preview-user';
  userSample.textContent = '나 · 내 취향에 맞게 꾸며 봤어!';
  sample.append(botSample,userSample);
  settingsForm.querySelector('.settings-preview').appendChild(sample);
  let settings = { ...defaults };
  let lastTrigger;
  function sanitize(value) {
    const v = value && typeof value === 'object' ? value : {};
    const customColors = emptyColors();
    for (const mode of ['light','dark']) for (const [key] of colorFields) {
      const color = v.customColors?.[mode]?.[key];
      if (validHex(color)) customColors[mode][key] = color.toLowerCase();
    }
    return {
      theme: ['light','dark','system'].includes(v.theme) ? v.theme : defaults.theme,
      accent: Object.hasOwn(palettes,v.accent) ? v.accent : defaults.accent,
      fontSize: Number.isInteger(v.fontSize) && v.fontSize >= 14 && v.fontSize <= 22 ? v.fontSize : defaults.fontSize,
      width: Object.hasOwn(widths,v.width) ? v.width : defaults.width,
      spacing: Object.hasOwn(spacings,v.spacing) ? v.spacing : defaults.spacing,
      reduceMotion: v.reduceMotion === true,
      customColors
    };
  }
  try { settings = sanitize(JSON.parse(localStorage.getItem(storageKey))); } catch { /* Private mode or invalid saved preferences: use defaults. */ }
  function resolvedTheme() { return settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme; }
  function apply() {
    const theme = resolvedTheme();
    colorFields.forEach(([, ,property]) => root.style.removeProperty(property));
    root.dataset.theme = theme;
    root.dataset.reduceMotion = String(settings.reduceMotion);
    const palette = palettes[settings.accent][theme];
    ['--accent','--accent-soft','--accent-ink'].forEach((key,i) => root.style.setProperty(key,palette[i]));
    root.style.setProperty('--chat-font',`${settings.fontSize}px`);
    root.style.setProperty('--chat-width',`${widths[settings.width]}px`);
    root.style.setProperty('--message-gap',`${spacings[settings.spacing][0]}px`);
    root.style.setProperty('--message-padding',`${spacings[settings.spacing][1]}px`);
    for (const [key,,property] of colorFields) {
      const color = settings.customColors[theme][key];
      if (color) root.style.setProperty(property,color);
    }
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--page').trim();
    document.querySelector('#font-size-value').value = `${settings.fontSize}px`;
    updateContrastNote();
  }
  function cssHex(property) {
    const probe = document.createElement('span');
    probe.style.color = `var(${property})`; probe.hidden = true; document.body.appendChild(probe);
    const color = getComputedStyle(probe).color; probe.remove();
    const values = color.match(/[\d.]+/g)?.map(Number);
    if (!values || values.length < 3 || (values.length > 3 && values[3] === 0)) {
      return property === '--bot-bg' ? cssHex('--page') : '#000000';
    }
    return '#' + values.slice(0,3).map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
  }
  function syncColorControls() {
    for (const [key,,property] of colorFields) {
      const color = settings.customColors[resolvedTheme()][key] || cssHex(property);
      const controls = colorControls.get(key);
      controls.picker.value = color;
      if (document.activeElement !== controls.hex) controls.hex.value = color.toUpperCase();
      controls.hex.removeAttribute('aria-invalid');
    }
    document.querySelector('#color-mode-note').textContent = `${resolvedTheme() === 'dark' ? '다크' : '라이트'} 테마의 색상을 편집 중이에요. 색상 칸 또는 #HEX 코드를 사용하세요.`;
  }
  function updateColor(key,color) {
    settings.customColors[resolvedTheme()][key] = color.toLowerCase();
    apply(); syncColorControls(); save();
  }
  function updateContrastNote() {
    function luminance(hex) {
      const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
      return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
    }
    const pairs = [['--page','--ink'],['--bot-bg','--bot-text'],['--user-bg','--user-text'],['--accent','--accent-ink']];
    const lowContrast = pairs.some(([a,b]) => {
      const x = luminance(cssHex(a)), y = luminance(cssHex(b));
      return (Math.max(x,y)+.05)/(Math.min(x,y)+.05) < 4.5;
    });
    document.querySelector('#color-contrast-note').textContent = lowContrast ? '일부 배경과 글자의 대비가 낮아 읽기 어려울 수 있어요. 색상은 그대로 적용돼요.' : '';
  }
  function syncControls() {
    settingsForm.elements.theme.value = settings.theme;
    settingsForm.elements.accent.value = settings.accent;
    settingsForm.elements.fontSize.value = settings.fontSize;
    settingsForm.elements.width.value = settings.width;
    settingsForm.elements.spacing.value = settings.spacing;
    settingsForm.elements.reduceMotion.checked = settings.reduceMotion;
    syncColorControls();
  }
  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify(settings)); }
    catch { note.textContent = '현재 브라우저에서 설정 저장이 차단되어 있어요. 이번 화면에는 적용되지만 새로고침하면 초기화될 수 있어요.'; }
  }
  settingsForm.addEventListener('submit',event => event.preventDefault());
  settingsForm.addEventListener('input',event => {
    if (colorPanel.contains(event.target)) return;
    if (event.target.name === 'accent') {
      delete settings.customColors[resolvedTheme()].accent;
      delete settings.customColors[resolvedTheme()].accentInk;
    }
    settings = sanitize({ ...settings, theme: settingsForm.elements.theme.value, accent: settingsForm.elements.accent.value,
      fontSize: Number(settingsForm.elements.fontSize.value), width: settingsForm.elements.width.value,
      spacing: settingsForm.elements.spacing.value, reduceMotion: settingsForm.elements.reduceMotion.checked });
    apply(); syncColorControls(); save();
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
  document.querySelector('#reset-display').addEventListener('click',() => { settings = { ...defaults, customColors: emptyColors() }; apply(); syncControls(); save(); });
  document.querySelector('#reset-colors').addEventListener('click',() => { settings.customColors[resolvedTheme()] = {}; apply(); syncColorControls(); save(); });
  media.addEventListener('change',() => { apply(); syncColorControls(); });
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
