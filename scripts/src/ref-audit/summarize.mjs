// Runs inside page.evaluate — returns a structural summary of the current DOM
export const SUMMARIZE = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = el => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const icons = el => [...el.querySelectorAll('[class*="ms-Icon--"]')].map(i => (i.className.toString().match(/ms-Icon--([\w]+)/) || [])[1]).filter(Boolean);
  const rect = el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const out = {};
  out.url = location.href; out.title = document.title;
  out.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,.mud-typography-h4,.mud-typography-h5,.mud-typography-h6,.page-title')].filter(vis).map(h => ({ tag: h.tagName, text: txt(h), rect: rect(h) })).slice(0, 40);
  out.tabs = [...document.querySelectorAll('fluent-tab, .mud-tab, .nav-tabs .nav-link, [role="tab"], .e-tab .e-tab-text, .mud-expand-panel-header, .accordion-button')].filter(vis).map(t => ({ tag: t.tagName.toLowerCase(), text: txt(t), active: t.getAttribute('aria-selected') === 'true' || /(^|\s)(active|selected|mud-tab-active)(\s|$)/.test((t.className || '').toString()), icons: icons(t), rect: rect(t) })).slice(0, 60);
  out.buttons = [...document.querySelectorAll('button, fluent-button, fluent-anchor, .mud-button-root, [role="button"], a.btn')].filter(vis).map(b => ({ tag: b.tagName.toLowerCase(), text: txt(b), title: b.getAttribute('title') || b.getAttribute('aria-label'), icons: icons(b), cls: (b.className || '').toString().slice(0, 100), appearance: b.getAttribute('appearance'), rect: rect(b) })).slice(0, 150);
  out.links = [...document.querySelectorAll('a[href]')].filter(vis).map(a => ({ href: a.getAttribute('href'), text: txt(a), icons: icons(a) })).slice(0, 100);
  out.tables = [...document.querySelectorAll('table')].filter(vis).map(t => ({ headers: [...t.querySelectorAll('thead th, thead td, tr:first-child th')].map(txt), rows: t.querySelectorAll('tbody tr').length, firstRow: [...(t.querySelector('tbody tr')?.children || [])].map(txt), cls: (t.className || '').toString().slice(0, 80) })).slice(0, 15);
  out.fields = [...document.querySelectorAll('input, select, textarea, fluent-text-field, fluent-select, fluent-combobox, fluent-number-field, fluent-text-area, fluent-checkbox, fluent-switch, fluent-radio-group, .mud-input-control, .mud-select, .e-input-group')].filter(vis).map(f => {
    const ctl = f.closest('.mud-input-control, .form-group, .mb-3, .col, fluent-text-field, fluent-select, fluent-number-field, fluent-combobox') || f.parentElement;
    const isFluent = /^FLUENT-/.test(f.tagName);
    const own = isFluent ? [...f.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.getAttribute('slot') && n.tagName !== 'FLUENT-OPTION')).map(n => n.textContent).join(' ').trim() : '';
    const label = own || f.getAttribute('title') || ctl?.querySelector('label, .mud-input-label, legend')?.textContent?.trim() || f.getAttribute('aria-label') || f.getAttribute('placeholder') || '';
    const cls = (f.className || '').toString();
    const required = /custom-required/.test(cls) || f.hasAttribute('required');
    const options = (isFluent && /SELECT|COMBOBOX/.test(f.tagName)) || f.tagName === 'SELECT' ? [...f.querySelectorAll('fluent-option, option')].map(o => o.textContent.trim()).slice(0, 15) : undefined;
    return { tag: f.tagName.toLowerCase(), type: f.getAttribute('type'), label: label.slice(0, 60), required, options, cls: cls.slice(0, 80), placeholder: (f.getAttribute('placeholder') || f.querySelector('input')?.getAttribute('placeholder') || '').slice(0, 60), value: (f.value ?? f.querySelector('input')?.value ?? '').toString().slice(0, 40), rect: rect(f) };
  }).slice(0, 150);
  out.cards = [...document.querySelectorAll('.mud-card, .card, .mud-paper, fluent-card')].filter(vis).map(c => ({ text: txt(c).slice(0, 120), rect: rect(c) })).slice(0, 60);
  out.iconsAll = [...new Set([...document.querySelectorAll('[class*="ms-Icon--"]')].filter(vis).map(i => (i.className.toString().match(/ms-Icon--([\w]+)/) || [])[1]))];
  out.text = document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 8000);
  out.dialogs = [...document.querySelectorAll('.mud-dialog, .blazored-modal, fluent-dialog, .modal.show, .e-dialog, .mud-popover-open')].filter(vis).map(d => ({ title: txt(d.querySelector('.mud-dialog-title, .blazored-modal-title, .modal-title, h1,h2,h3,h4,h5') || d).slice(0, 80), text: txt(d).slice(0, 400), rect: rect(d) }));
  return out;
};
