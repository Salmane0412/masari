/* مساري — أيقونات خطية بسيطة (SVG) بدل الرموز النصية */
(function (root) {
  const P = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    plan: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 13.5h3M7.5 17h6"/>',
    map: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    library: '<path d="M2.5 5.5h6a3.5 3.5 0 0 1 3.5 3.5v11a3 3 0 0 0-3-3H2.5z"/><path d="M21.5 5.5h-6A3.5 3.5 0 0 0 12 9v11a3 3 0 0 1 3-3h6.5z"/>',
    more: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    tasks: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12.5l3 3 5-6.5"/>',
    fin: '<path d="M16.5 7.5V5a1.5 1.5 0 0 0-1.5-1.5H5A2 2 0 0 0 3 5.5"/><rect x="3" y="6" width="18" height="14.5" rx="2.5"/><path d="M21 11h-4a2 2 0 0 0 0 4h4"/>',
    reco: '<path d="M12 20.5s-7.5-4.4-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.9-7.5 10.3-7.5 10.3z"/>',
    gym: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    health: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    focus: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    tests: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
    stats: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    study: '<path d="M2 9.5L12 4.5l10 5-10 5z"/><path d="M6 11.5v5c3.5 2.5 8.5 2.5 12 0v-5M22 9.5v6"/>',
    career: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    faidas: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    code: '<circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l8.5-8.5M15.5 7.5l3 3"/>',
    guide: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 17h.01"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    lesson: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    salat: '<path d="M12 3c2.5 2 4 3.6 4 5.5V10H8V8.5C8 6.6 9.5 5 12 3z"/><path d="M5 21V12h14v9M9 21v-4a3 3 0 0 1 6 0v4M3 21h18"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    back: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };
  root.ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.lesson}</svg>`;
})(window);
