const STORAGE_KEY = "uctobot_render_state_v1";
const EUR = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" });
const D = new Intl.DateTimeFormat("sk-SK");

const NAV = [
  ["dashboard", "Dashboard", "Prehlad firmy"],
  ["invoices", "Faktury", "Vydane a prijate"],
  ["clients", "Klienti", "Odberatelia"],
  ["suppliers", "Dodavatelia", "Dodavatelska databaza"],
  ["expenses", "Vydavky", "Naklady a blocky"],
  ["bank", "Banka", "Pohyby a sparovanie"],
  ["vat", "DPH", "Vstup/vystup"],
  ["tax", "Danove priznanie", "DPFO / DPPO"],
  ["journal", "Uctovny dennik", "Najma s.r.o."],
  ["templates", "Sablony", "Sluzby a klienti"],
  ["assistant", "AI asistent", "Fakturacia cez chat"],
  ["settings", "Nastavenia", "Profil subjektu"],
  ["export", "Export", "CSV / JSON"]
];

const ROLE_CONFIG = {
  admin: { label: "Admin", sections: NAV.map(([id]) => id) },
  user: { label: "User", sections: ["dashboard", "invoices", "assistant", "export"] }
};

function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function esc(v = "") { return String(v ?? "").replace(/[&<>"]/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[s])); }
function money(n) { return EUR.format(Number(n || 0)); }
function num(n) { return Number(n || 0); }
function fmtDate(s) { return s ? D.format(new Date(s)) : ""; }
function csv(v) { const s = String(v ?? ""); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s; }

function seed() {
  const p1 = { id: uid("profile"), type: "szco", businessName: "Milan Novak - konzultant", ico: "52123456", dic: "1087654321", icDph: "", address: "Hlavna 12, 900 31 Stupava", iban: "SK12 1100 0000 0029 1234 5678", registerText: "Zivnostensky register Okresneho uradu Bratislava", vatPayer: false, vatPeriod: "quarterly", accountingMode: "simple", taxRate: 0.15 };
  const p2 = { id: uid("profile"), type: "sro", businessName: "Demo Solutions s.r.o.", ico: "55667788", dic: "2123456789", icDph: "SK2123456789", address: "Karadzicova 8, 821 08 Bratislava", iban: "SK55 0900 0000 0051 2345 6789", registerText: "Obchodny register Mestskeho sudu Bratislava III, oddiel Sro, vlozka 123456/B", vatPayer: true, vatPeriod: "monthly", accountingMode: "double", taxRate: 0.21 };
  const c1 = { id: uid("client"), name: "ABC Trade s.r.o.", ico: "50111222", dic: "2120099999", icDph: "SK2120099999", address: "Prievozska 10, Bratislava", email: "fakturacia@abctrade.sk", phone: "", defaultDueDays: 14, defaultService: "Konzultacne sluzby" };
  const c2 = { id: uid("client"), name: "Green Project a.s.", ico: "36333444", dic: "2020888888", icDph: "SK2020888888", address: "Mlynske nivy 1, Bratislava", email: "office@greenproject.sk", phone: "", defaultDueDays: 21, defaultService: "Projektove sluzby" };
  const s1 = { id: uid("supplier"), name: "Slovak Telekom, a.s.", ico: "35763469", dic: "2020273893", icDph: "SK2020273893", address: "Bajkalska 28, Bratislava", category: "Telekomunikacie", defaultAccount: "518/321" };
  const s2 = { id: uid("supplier"), name: "Office Market s.r.o.", ico: "44221100", dic: "2020555555", icDph: "SK2020555555", address: "Trnavska cesta 4, Bratislava", category: "Kancelarske potreby", defaultAccount: "501/321" };
  const inv1 = makeInvoice({ profileId: p2.id, kind: "issued", counterpartyId: c1.id, counterpartyName: c1.name, desc: "Konzultacne sluzby za april 2026", amount: 2000, vatRate: 23, dueDays: 14, number: "2026-001" });
  const inv2 = makeInvoice({ profileId: p2.id, kind: "issued", counterpartyId: c2.id, counterpartyName: c2.name, desc: "Projektova analyza", amount: 1250, vatRate: 23, dueDays: 21, number: "2026-002" });
  inv1.status = "paid";
  const exp1 = { id: uid("expense"), profileId: p2.id, supplierId: s1.id, supplierName: s1.name, date: today(), category: "Telekomunikacie", amountWithoutVat: 48.78, vatRate: 23, vatAmount: 11.22, amountTotal: 60, note: "Internet a telefon" };
  const exp2 = { id: uid("expense"), profileId: p2.id, supplierId: s2.id, supplierName: s2.name, date: today(), category: "Kancelarske potreby", amountWithoutVat: 162.6, vatRate: 23, vatAmount: 37.4, amountTotal: 200, note: "Papier, tonery" };
  return {
    activeSection: "dashboard",
    activeProfileId: p2.id,
    sessionRole: "",
    profiles: [p1, p2],
    clients: [c1, c2],
    suppliers: [s1, s2],
    invoices: [inv1, inv2],
    expenses: [exp1, exp2],
    bank: [
      { id: uid("bank"), profileId: p2.id, date: today(), amount: inv1.total, counterparty: c1.name, variableSymbol: inv1.variableSymbol, note: "Uhrada faktury", matchedInvoiceId: inv1.id, status: "matched" },
      { id: uid("bank"), profileId: p2.id, date: today(), amount: -60, counterparty: s1.name, variableSymbol: "", note: "Telekom", matchedInvoiceId: "", status: "unmatched" }
    ],
    templates: [
      { id: uid("tpl"), profileId: p2.id, name: "Konzultacie 2000 EUR", clientName: c1.name, description: "Konzultacne sluzby", amount: 2000, vatRate: 23, dueDays: 14 },
      { id: uid("tpl"), profileId: p2.id, name: "Projektova analyza", clientName: c2.name, description: "Projektova analyza a navrh riesenia", amount: 1250, vatRate: 23, dueDays: 21 }
    ],
    journal: [],
    chat: [{ role: "bot", text: "Som uctovny asistent. Skus napisat: Vytvor fakturu pre ABC Trade s.r.o. na 2000 eur za konzultacne sluzby." }]
  };
}

function makeInvoice({ profileId, kind, counterpartyId = "", counterpartyName, desc, amount, vatRate = 23, dueDays = 14, number }) {
  const base = num(amount);
  const vat = Math.round(base * num(vatRate)) / 100;
  const total = Math.round((base + vat) * 100) / 100;
  const invoiceNumber = number || nextNumber(kind);
  return {
    id: uid("inv"),
    profileId,
    kind,
    invoiceNumber,
    counterpartyId,
    counterpartyName: counterpartyName || "Neznamy klient",
    issueDate: today(),
    deliveryDate: today(),
    dueDate: addDays(today(), dueDays),
    status: "issued",
    variableSymbol: invoiceNumber.replace(/\D/g, "").slice(-10),
    items: [{ description: desc || "Sluzby", quantity: 1, unit: "ks", unitPrice: base, vatRate: num(vatRate), amountWithoutVat: base, vatAmount: vat, total }],
    amountWithoutVat: base,
    vatAmount: vat,
    total,
    emailSent: false
  };
}

let state = load();

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function role() { return ROLE_CONFIG[state.sessionRole] ? state.sessionRole : ""; }
function isAdmin() { return role() === "admin"; }
function isUser() { return role() === "user"; }
function allowedSections() { return role() ? ROLE_CONFIG[role()].sections : []; }
function canAccess(sectionId) { return allowedSections().includes(sectionId); }
function ensureActiveSection() {
  const allowed = allowedSections();
  if (!allowed.length) return;
  if (!allowed.includes(state.activeSection)) state.activeSection = allowed[0];
}
function requireAdmin() {
  if (isAdmin()) return true;
  alert("Tato akcia je dostupna len pre demo Admin rolu.");
  return false;
}
function profile() { return state.profiles.find((p) => p.id === state.activeProfileId) || state.profiles[0]; }
function activeInvoices() { const p = profile(); return state.invoices.filter((i) => i.profileId === p.id); }
function activeExpenses() { const p = profile(); return state.expenses.filter((e) => e.profileId === p.id); }
function activeBank() { const p = profile(); return state.bank.filter((b) => b.profileId === p.id); }
function activeTemplates() { const p = profile(); return state.templates.filter((t) => t.profileId === p.id); }
function activeJournal() { const p = profile(); return state.journal.filter((j) => j.profileId === p.id); }
function issuedInvoices() { return activeInvoices().filter((i) => i.kind === "issued"); }
function receivedInvoices() { return activeInvoices().filter((i) => i.kind === "received"); }
function nextNumber(kind = "issued") { const prefix = kind === "issued" ? "2026-" : "DF-2026-"; const count = state?.invoices?.filter((i) => i.kind === kind).length + 1 || 1; return `${prefix}${String(count).padStart(3, "0")}`; }
function addJournalForInvoice(inv) {
  if (profile().type !== "sro") return;
  const isIssued = inv.kind === "issued";
  state.journal.push({ id: uid("j"), profileId: inv.profileId, date: inv.issueDate, document: inv.invoiceNumber, text: isIssued ? `Vystavena faktura ${inv.counterpartyName}` : `Prijata faktura ${inv.counterpartyName}`, debit: isIssued ? "311" : "518", credit: isIssued ? "602" : "321", amount: inv.amountWithoutVat, source: "auto" });
  if (inv.vatAmount) {
    state.journal.push({ id: uid("j"), profileId: inv.profileId, date: inv.issueDate, document: inv.invoiceNumber, text: isIssued ? "DPH vystup" : "DPH vstup", debit: isIssued ? "311" : "343", credit: isIssued ? "343" : "321", amount: inv.vatAmount, source: "auto" });
  }
}
function badge(status) { if (status === "paid" || status === "matched") return `<span class="badge ok">${status === "paid" ? "Zaplatene" : "Sparovane"}</span>`; if (status === "overdue" || status === "unmatched") return `<span class="badge bad">${status === "overdue" ? "Po splatnosti" : "Nesparovane"}</span>`; if (status === "draft") return "<span class=\"badge warn\">Koncept</span>"; return "<span class=\"badge info\">Vystavene</span>"; }
function currentStatus(inv) { if (inv.status === "paid" || inv.status === "cancelled") return inv.status; return new Date(inv.dueDate) < new Date(today()) ? "overdue" : inv.status; }
function totals() {
  const issued = issuedInvoices();
  const exps = activeExpenses();
  const revenue = issued.reduce((s, i) => s + i.amountWithoutVat, 0);
  const vatOut = issued.reduce((s, i) => s + i.vatAmount, 0);
  const costs = exps.reduce((s, e) => s + e.amountWithoutVat, 0) + receivedInvoices().reduce((s, i) => s + i.amountWithoutVat, 0);
  const vatIn = exps.reduce((s, e) => s + e.vatAmount, 0) + receivedInvoices().reduce((s, i) => s + i.vatAmount, 0);
  const profit = revenue - costs;
  return { revenue, vatOut, costs, vatIn, profit, vatDue: vatOut - vatIn, unpaid: issued.filter((i) => currentStatus(i) !== "paid").reduce((s, i) => s + i.total, 0), overdue: issued.filter((i) => currentStatus(i) === "overdue").length };
}

function render() {
  if (!role()) {
    document.getElementById("app").innerHTML = loginScreen();
    return;
  }
  ensureActiveSection();
  const p = profile();
  const nav = NAV.filter(([id]) => canAccess(id)).map(([id, label, desc]) => `<button class="${state.activeSection === id ? "active" : ""}" data-nav="${id}"><strong>${label}</strong><span>${desc}</span></button>`).join("");
  document.getElementById("app").innerHTML = `<div class="app"><aside class="sidebar"><div class="brand"><div class="logo">UB</div><div><div class="brand-title">UctoBot</div><div class="brand-sub">Render static MVP</div></div></div><nav class="nav">${nav}</nav><div class="footer-note">Prihlaseny rezim: ${ROLE_CONFIG[role()].label}. Data su ulozene lokalne v prehliadaci.</div></aside><main class="main"><div class="topbar"><div><h1>${title()}</h1><p>${esc(p.businessName)} - ${p.type.toUpperCase()} - ${p.vatPayer ? "platitel DPH" : "neplatitel DPH"}</p></div><div class="profile-switch no-print"><span class="role-badge ${isAdmin() ? "admin" : "user"}">${ROLE_CONFIG[role()].label}</span><select id="profileSelect">${state.profiles.map((x) => `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(x.businessName)}</option>`).join("")}</select><select id="roleSelect"><option value="admin" ${isAdmin() ? "selected" : ""}>Admin</option><option value="user" ${isUser() ? "selected" : ""}>User</option></select><button class="btn ghost" data-action="logout">Odhlasit</button><button class="btn ghost" data-action="reset-demo">Reset demo</button></div></div>${section()}</main></div>`;
}
function loginScreen() {
  return `<div class="login-shell"><section class="login-card"><div class="brand login-brand"><div class="logo">UB</div><div><div class="brand-title">UctoBot</div><div class="brand-sub">Vyber si demo pristup pre Render preview</div></div></div><h1>Spustit demo</h1><p class="login-copy">Admin ma plny pristup k sprave firmy. User je read-only demo rola pre bezne prehliadanie dashboardu, faktur a AI asistenta.</p><div class="login-actions"><button class="btn primary" data-action="login-admin">Vstupit ako Admin</button><button class="btn blue" data-action="login-user">Vstupit ako User</button></div></section></div>`;
}
function title() { return (NAV.find((n) => n[0] === state.activeSection) || NAV[0])[1]; }
function section() {
  if (!canAccess(state.activeSection)) return accessDenied();
  const map = { dashboard, invoices, clients, suppliers, expenses, bank, vat, tax, journal, templates, assistant, settings, export: exportPage };
  return (map[state.activeSection] || dashboard)();
}
function accessDenied() { return `<div class="notice">Tato sekcia nie je dostupna pre aktualnu rolu.</div>`; }
function readonlyBanner(text = "Si prihlaseny ako User. Tato cast je len na prehliadanie.") { return `<div class="notice">${esc(text)}</div>`; }
function stat(label, value, help) { return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-help">${help}</div></div>`; }
function panel(titleText, desc, body, right = "") { return `<section class="panel"><div class="panel-head"><div><h2>${titleText}</h2>${desc ? `<p class="desc">${desc}</p>` : ""}</div>${right}</div>${body}</section>`; }

function dashboard() {
  const t = totals();
  const warns = [];
  if (profile().type === "sro") warns.push("s.r.o. rezim pouziva podvojne uctovnictvo. Nejasne pripady oznac na kontrolu uctovnikom.");
  if (t.overdue) warns.push(`Mas ${t.overdue} faktur po splatnosti.`);
  return `<div class="grid grid-4">${stat("Vynosy bez DPH", money(t.revenue), "vydane faktury")}${stat("Naklady bez DPH", money(t.costs), "vydavky + prijate faktury")}${stat("Zisk pred zdanenim", money(t.profit), "orientacne")}${stat("DPH na uhradu", money(t.vatDue), "vystup minus vstup")}</div><br>${warns.map((w) => `<div class="notice">${esc(w)}</div>`).join("<br>")}<br><div class="grid grid-2">${panel("Posledne faktury", "Najnovsie vystavene/prijate doklady", invoiceTable(activeInvoices().slice(0, 5), true))}${panel("Cashflow", "Banka a nezaplatene faktury", `<div class="grid grid-2">${stat("Nezaplatene", money(t.unpaid), "vydane faktury")}${stat("Bankove pohyby", String(activeBank().length), "zaevidovane transakcie")}</div>`)}</div>`;
}

function invoiceForm(kind = "issued") { return `<form class="form" data-form="invoice"><div class="form-row"><label>Typ<select name="kind"><option value="issued" ${kind === "issued" ? "selected" : ""}>Vydana faktura</option><option value="received" ${kind === "received" ? "selected" : ""}>Prijata faktura</option></select></label><label>Klient / dodavatel<input name="counterpartyName" required placeholder="ABC Trade s.r.o."></label><label>Popis sluzby/tovaru<input name="desc" required placeholder="Konzultacne sluzby"></label><label>Suma bez DPH<input name="amount" type="number" step="0.01" required placeholder="2000"></label></div><div class="form-row"><label>DPH %<input name="vatRate" type="number" value="${profile().vatPayer ? 23 : 0}"></label><label>Splatnost dni<input name="dueDays" type="number" value="14"></label><label>Cislo faktury<input name="number" placeholder="nechat prazdne = automaticky"></label><label>&nbsp;<button class="btn primary" type="submit">Vytvorit fakturu</button></label></div></form>`; }
function invoices() {
  if (isUser()) return `<div class="grid">${readonlyBanner("User moze faktury prehliadat a exportovat, ale nema pravo ich menit.")}${panel("Faktury", "Read-only rezim pre bezneho pouzivatela.", invoiceTable(activeInvoices(), true))}</div>`;
  return `<div class="grid">${panel("Nova faktura", "Vytvor fakturu rucne alebo cez AI chat.", invoiceForm())}${panel("Faktury", "Tlac/PDF, platby, export.", invoiceTable(activeInvoices()))}</div>`;
}
function invoiceTable(list, compact = false) { if (!list.length) return "<div class=\"empty\">Zatial tu nie su ziadne faktury.</div>"; return `<div class="table-wrap"><table><thead><tr><th>Cislo</th><th>Typ</th><th>Partner</th><th>Splatnost</th><th>Suma</th><th>Stav</th>${compact ? "" : "<th>Akcie</th>"}</tr></thead><tbody>${list.map((inv) => `<tr><td><strong>${esc(inv.invoiceNumber)}</strong><br><small>VS: ${esc(inv.variableSymbol)}</small></td><td>${inv.kind === "issued" ? "Vydana" : "Prijata"}</td><td>${esc(inv.counterpartyName)}<br><small>${esc(inv.items?.[0]?.description || "")}</small></td><td>${fmtDate(inv.dueDate)}</td><td><strong>${money(inv.total)}</strong><br><small>bez DPH ${money(inv.amountWithoutVat)}</small></td><td>${badge(currentStatus(inv))}</td>${compact ? "" : `<td><div class="actions"><button class="btn ghost" data-action="print-invoice" data-id="${inv.id}">PDF</button><button class="btn ghost" data-action="paid-invoice" data-id="${inv.id}">Zaplatene</button><button class="btn danger" data-action="delete-invoice" data-id="${inv.id}">Zmazat</button></div></td>`}</tr>`).join("")}</tbody></table></div>`; }

function clients() { return isUser() ? accessDenied() : `<div class="grid">${panel("Novy klient", "Uloz si fakturacne udaje odberatela.", partyForm("client"))}${panel("Klienti", "Databaza odberatelov.", partyTable(state.clients, "client"))}</div>`; }
function suppliers() { return isUser() ? accessDenied() : `<div class="grid">${panel("Novy dodavatel", "Uloz si dodavatelov a predvolene uctovanie.", partyForm("supplier"))}${panel("Dodavatelia", "Databaza dodavatelov.", partyTable(state.suppliers, "supplier"))}</div>`; }
function partyForm(type) { const supplier = type === "supplier"; return `<form class="form" data-form="${type}"><div class="form-row"><label>Nazov<input name="name" required></label><label>ICO<input name="ico"></label><label>DIC<input name="dic"></label><label>IC DPH<input name="icDph"></label></div><div class="form-row"><label>Adresa<input name="address"></label><label>E-mail<input name="email"></label><label>${supplier ? "Kategoria" : "Predvolena sluzba"}<input name="extra"></label><label>&nbsp;<button class="btn primary" type="submit">Ulozit</button></label></div></form>`; }
function partyTable(list, type) { if (!list.length) return "<div class=\"empty\">Ziadne zaznamy.</div>"; return `<div class="table-wrap"><table><thead><tr><th>Nazov</th><th>ICO / DIC</th><th>Kontakt</th><th>Extra</th><th>Akcie</th></tr></thead><tbody>${list.map((x) => `<tr><td><strong>${esc(x.name)}</strong><br><small>${esc(x.address || "")}</small></td><td>${esc(x.ico || "")}<br><small>${esc(x.dic || "")}</small></td><td>${esc(x.email || "")}<br><small>${esc(x.phone || "")}</small></td><td>${esc(x.defaultService || x.category || x.defaultAccount || "")}</td><td><button class="btn danger" data-action="delete-party" data-type="${type}" data-id="${x.id}">Zmazat</button></td></tr>`).join("")}</tbody></table></div>`; }

function expenses() { return isUser() ? accessDenied() : `<div class="grid">${panel("Novy vydavok", "Blocek alebo nakladova polozka.", `<form class="form" data-form="expense"><div class="form-row"><label>Dodavatel<input name="supplierName" required></label><label>Kategoria<input name="category" value="Prevadzkove naklady"></label><label>Suma s DPH<input name="amountTotal" type="number" step="0.01" required></label><label>DPH %<input name="vatRate" type="number" value="23"></label></div><label>Poznamka<textarea name="note"></textarea></label><button class="btn primary" type="submit">Pridat vydavok</button></form>`)}${panel("Vydavky", "Evidovane vydavky a naklady.", expenseTable())}</div>`; }
function expenseTable() { const list = activeExpenses(); if (!list.length) return "<div class=\"empty\">Ziadne vydavky.</div>"; return `<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Dodavatel</th><th>Kategoria</th><th>Suma</th><th>DPH</th><th>Akcie</th></tr></thead><tbody>${list.map((e) => `<tr><td>${fmtDate(e.date)}</td><td>${esc(e.supplierName)}</td><td>${esc(e.category)}</td><td><strong>${money(e.amountTotal)}</strong><br><small>bez DPH ${money(e.amountWithoutVat)}</small></td><td>${money(e.vatAmount)}</td><td><button class="btn danger" data-action="delete-expense" data-id="${e.id}">Zmazat</button></td></tr>`).join("")}</tbody></table></div>`; }

function bank() { return isUser() ? accessDenied() : `<div class="grid">${panel("Novy bankovy pohyb", "Pridaj pohyb alebo ho importuj neskor z CSV.", `<form class="form" data-form="bank"><div class="form-row"><label>Datum<input name="date" type="date" value="${today()}"></label><label>Suma<input name="amount" type="number" step="0.01" required></label><label>Protiucet / partner<input name="counterparty"></label><label>VS<input name="variableSymbol"></label></div><label>Poznamka<textarea name="note"></textarea></label><button class="btn primary" type="submit">Pridat a skusit sparovat</button></form>`)}${panel("Bankove pohyby", "Automaticke parovanie podla VS a sumy.", bankTable(), `<button class="btn ghost" data-action="auto-pair">Automaticky parovat</button>`)}</div>`; }
function bankTable() { const list = activeBank(); if (!list.length) return "<div class=\"empty\">Ziadne bankove pohyby.</div>"; return `<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Partner</th><th>VS</th><th>Suma</th><th>Stav</th><th>Poznamka</th></tr></thead><tbody>${list.map((b) => `<tr><td>${fmtDate(b.date)}</td><td>${esc(b.counterparty)}</td><td>${esc(b.variableSymbol)}</td><td><strong>${money(b.amount)}</strong></td><td>${badge(b.status)}</td><td>${esc(b.note || "")}</td></tr>`).join("")}</tbody></table></div>`; }

function vat() { return isUser() ? accessDenied() : (() => { const t = totals(); return `<div class="grid grid-3">${stat("Vystupna DPH", money(t.vatOut), "z vydanych faktur")}${stat("Vstupna DPH", money(t.vatIn), "z vydavkov/prijatych faktur")}${stat("DPH vysledok", money(t.vatDue), t.vatDue >= 0 ? "orientacne na uhradu" : "orientacny nadmerny odpocet")}</div><br>${panel("DPH kontrola", "Nie je to oficialne DPH priznanie. Sluzi ako podklad.", `<div class="notice">Pred podanim skontroluj sadzby DPH, datum dodania, reverse-charge, zahranicne plnenia a kontrolny vykaz.</div>`)}`; })(); }
function tax() { return isUser() ? accessDenied() : (() => { const p = profile(); const t = totals(); const rate = p.taxRate || (p.type === "sro" ? 0.21 : 0.15); const taxBase = Math.max(0, t.profit); const tax = taxBase * rate; return `<div class="grid grid-4">${stat("Vynosy", money(t.revenue), "bez DPH")}${stat("Naklady", money(t.costs), "bez DPH")}${stat("Zaklad dane", money(taxBase), "orientacne")}${stat(p.type === "sro" ? "DPPO" : "DPFO", money(tax), `${Math.round(rate * 100)} % sadzba`)}</div><br>${panel("Checklist pred podanim", "Aplikacia nepodava priznanie automaticky.", `<ul><li>Skontrolovat vsetky prijmy/faktury.</li><li>Skontrolovat vydavky a danovu uznatelnost.</li><li>Pri s.r.o. skontrolovat uctovny dennik, rozvahu a vysledovku.</li><li>Skontrolovat preddavky, odpocitatelne/pripocitatelne polozky.</li><li>Finalne podanie potvrdit manualne alebo uctovnikom.</li></ul>`)}`; })(); }
function journal() { if (isUser()) return accessDenied(); if (profile().type !== "sro") return "<div class=\"notice\">Uctovny dennik je primarne pre s.r.o. / podvojne uctovnictvo. Pre SZCO pouzivaj jednoduchu evidenciu prijmov a vydavkov.</div>"; const list = activeJournal(); return panel("Uctovny dennik", "Automaticky generovane zapisy z faktur.", list.length ? `<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Doklad</th><th>Text</th><th>MD</th><th>DAL</th><th>Suma</th><th>Zdroj</th></tr></thead><tbody>${list.map((j) => `<tr><td>${fmtDate(j.date)}</td><td>${esc(j.document)}</td><td>${esc(j.text)}</td><td>${esc(j.debit)}</td><td>${esc(j.credit)}</td><td>${money(j.amount)}</td><td>${esc(j.source)}</td></tr>`).join("")}</tbody></table></div>` : "<div class=\"empty\">Zapisy vzniknu automaticky pri vytvoreni faktur.</div>", `<button class="btn ghost" data-action="export-journal">CSV</button>`); }
function templates() { return isUser() ? accessDenied() : `<div class="grid">${panel("Nova sablona", "Uloz si typicku sluzbu a klienta.", `<form class="form" data-form="template"><div class="form-row"><label>Nazov sablony<input name="name" required></label><label>Klient<input name="clientName" required></label><label>Popis<input name="description" required></label><label>Suma bez DPH<input name="amount" type="number" step="0.01" required></label></div><div class="form-row"><label>DPH %<input name="vatRate" type="number" value="${profile().vatPayer ? 23 : 0}"></label><label>Splatnost dni<input name="dueDays" type="number" value="14"></label><label>&nbsp;<button class="btn primary" type="submit">Ulozit sablonu</button></label></div></form>`)}${panel("Sablony", "Jednym klikom vytvoris fakturu.", templateTable())}</div>`; }
function templateTable() { const list = activeTemplates(); if (!list.length) return "<div class=\"empty\">Ziadne sablony.</div>"; return `<div class="table-wrap"><table><thead><tr><th>Nazov</th><th>Klient</th><th>Popis</th><th>Suma</th><th>Akcie</th></tr></thead><tbody>${list.map((t) => `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.clientName)}</td><td>${esc(t.description)}</td><td>${money(t.amount)}</td><td><div class="actions"><button class="btn primary" data-action="apply-template" data-id="${t.id}">Vytvorit fakturu</button><button class="btn danger" data-action="delete-template" data-id="${t.id}">Zmazat</button></div></td></tr>`).join("")}</tbody></table></div>`; }
function assistant() { return `<div class="grid grid-2"><section class="panel"><div class="panel-head"><div><h2>AI/chat asistent</h2><p class="desc">Lokalny parser prikazov. Neskor sa da vymenit za OpenAI API.</p></div></div><div class="chat-box" id="chatBox">${state.chat.map((m) => `<div class="msg ${m.role === "user" ? "user" : "bot"}">${esc(m.text)}</div>`).join("")}</div><form class="form" data-form="chat" style="margin-top:12px"><textarea name="message" placeholder="Vytvor fakturu pre ABC Trade s.r.o. na 2000 eur za konzultacne sluzby"></textarea><button class="btn primary" type="submit">Odoslat</button></form></section>${panel("Priklady prikazov", "", `<ul><li>Vytvor fakturu pre ABC Trade s.r.o. na 2000 eur za konzultacne sluzby.</li><li>Ukaz faktury po splatnosti.</li><li>Kolko mam zaplatit DPH?</li><li>Pridaj vydavok Telekom 60 eur internet.</li></ul>`)}</div>`; }
function settings() { if (isUser()) return accessDenied(); const p = profile(); return panel("Profil subjektu", "Udaje pouzivane na fakturach a vypoctoch.", `<form class="form" data-form="profile"><div class="form-row"><label>Typ<select name="type"><option value="szco" ${p.type === "szco" ? "selected" : ""}>SZCO</option><option value="sro" ${p.type === "sro" ? "selected" : ""}>s.r.o.</option></select></label><label>Nazov<input name="businessName" value="${esc(p.businessName)}"></label><label>ICO<input name="ico" value="${esc(p.ico)}"></label><label>DIC<input name="dic" value="${esc(p.dic)}"></label></div><div class="form-row"><label>IC DPH<input name="icDph" value="${esc(p.icDph)}"></label><label>IBAN<input name="iban" value="${esc(p.iban)}"></label><label>DPH<select name="vatPayer"><option value="true" ${p.vatPayer ? "selected" : ""}>Platitel</option><option value="false" ${!p.vatPayer ? "selected" : ""}>Neplatitel</option></select></label><label>Sadzba dane<input name="taxRate" type="number" step="0.01" value="${p.taxRate}"></label></div><label>Adresa<input name="address" value="${esc(p.address)}"></label><label>Register<input name="registerText" value="${esc(p.registerText)}"></label><button class="btn primary" type="submit">Ulozit nastavenia</button></form>`); }
function exportPage() { return `<div class="grid grid-2">${panel("Exporty", "Stiahni si data z aplikacie.", `<div class="actions"><button class="btn primary" data-action="export-json">Export celej firmy JSON</button><button class="btn ghost" data-action="export-invoices">Faktury CSV</button><button class="btn ghost" data-action="export-journal">Uctovny dennik CSV</button></div>`)}${panel("Render hosting", "Aktualna verzia je static app.", `<ul><li>Build Command: <code>echo "Static app - no build required"</code></li><li>Publish Directory: <code>public</code></li><li>Blueprint: <code>render.yaml</code></li></ul><div class="notice">Pre produkcny SaaS treba databazu, login a serverove API.</div>`)}</div>`; }

function submitForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const type = form.dataset.form;
  const p = profile();
  if (["invoice", "client", "supplier", "expense", "bank", "template", "profile"].includes(type) && !requireAdmin()) return;
  if (type === "invoice") { const inv = makeInvoice({ profileId: p.id, kind: data.kind, counterpartyName: data.counterpartyName, desc: data.desc, amount: data.amount, vatRate: data.vatRate, dueDays: num(data.dueDays) || 14, number: data.number || undefined }); state.invoices.unshift(inv); addJournalForInvoice(inv); save(); render(); return; }
  if (type === "client") { state.clients.unshift({ id: uid("client"), name: data.name, ico: data.ico, dic: data.dic, icDph: data.icDph, address: data.address, email: data.email, phone: "", defaultDueDays: 14, defaultService: data.extra }); save(); render(); return; }
  if (type === "supplier") { state.suppliers.unshift({ id: uid("supplier"), name: data.name, ico: data.ico, dic: data.dic, icDph: data.icDph, address: data.address, email: data.email, category: data.extra, defaultAccount: "" }); save(); render(); return; }
  if (type === "expense") { const total = num(data.amountTotal); const rate = num(data.vatRate); const base = rate ? total / (1 + rate / 100) : total; const vat = total - base; state.expenses.unshift({ id: uid("expense"), profileId: p.id, supplierName: data.supplierName, date: today(), category: data.category, amountWithoutVat: Math.round(base * 100) / 100, vatRate: rate, vatAmount: Math.round(vat * 100) / 100, amountTotal: total, note: data.note }); save(); render(); return; }
  if (type === "bank") { const b = { id: uid("bank"), profileId: p.id, date: data.date || today(), amount: num(data.amount), counterparty: data.counterparty, variableSymbol: data.variableSymbol, note: data.note, matchedInvoiceId: "", status: "unmatched" }; tryPair(b); state.bank.unshift(b); save(); render(); return; }
  if (type === "template") { state.templates.unshift({ id: uid("tpl"), profileId: p.id, name: data.name, clientName: data.clientName, description: data.description, amount: num(data.amount), vatRate: num(data.vatRate), dueDays: num(data.dueDays) || 14 }); save(); render(); return; }
  if (type === "profile") { Object.assign(p, { type: data.type, businessName: data.businessName, ico: data.ico, dic: data.dic, icDph: data.icDph, iban: data.iban, vatPayer: data.vatPayer === "true", taxRate: num(data.taxRate), address: data.address, registerText: data.registerText, accountingMode: data.type === "sro" ? "double" : "simple" }); save(); render(); return; }
  if (type === "chat") { handleChat(data.message); form.reset(); }
}
function tryPair(b) { const inv = activeInvoices().find((i) => i.variableSymbol && b.variableSymbol && i.variableSymbol === b.variableSymbol && Math.abs(Math.abs(num(b.amount)) - num(i.total)) < 0.02); if (inv) { b.matchedInvoiceId = inv.id; b.status = "matched"; if (b.amount > 0 && inv.kind === "issued") inv.status = "paid"; if (b.amount < 0 && inv.kind === "received") inv.status = "paid"; } }
function handleChat(text = "") {
  const raw = text.trim();
  if (!raw) return;
  state.chat.push({ role: "user", text: raw });
  const lower = raw.toLowerCase();
  if (lower.includes("po splatnosti")) {
    const over = issuedInvoices().filter((i) => currentStatus(i) === "overdue");
    state.chat.push({ role: "bot", text: over.length ? `Faktury po splatnosti:\n${over.map((i) => `${i.invoiceNumber} - ${i.counterpartyName} - ${money(i.total)}`).join("\n")}` : "Nemas ziadne faktury po splatnosti." });
  } else if (lower.includes("dph")) {
    const t = totals();
    state.chat.push({ role: "bot", text: `Orientacny DPH vysledok: ${money(t.vatDue)}. Vystupna DPH ${money(t.vatOut)}, vstupna DPH ${money(t.vatIn)}.` });
  } else if (lower.includes("vydav")) {
    const amount = (raw.match(/(\d+[\s\d]*(?:[,.]\d+)?)/) || [])[1];
    const name = (raw.match(/vydavok\s+(.+?)\s+(?:na\s+)?\d/i) || [])[1] || "Dodavatel";
    const total = num(String(amount || 0).replace(/\s/g, "").replace(",", "."));
    const base = total / 1.23;
    state.expenses.unshift({ id: uid("expense"), profileId: profile().id, supplierName: name, date: today(), category: "AI vydavok", amountWithoutVat: Math.round(base * 100) / 100, vatRate: 23, vatAmount: Math.round((total - base) * 100) / 100, amountTotal: total, note: "Vytvorene cez chat" });
    state.chat.push({ role: "bot", text: `Pridal som vydavok ${name} v sume ${money(total)}.` });
  } else if (lower.includes("fakt")) {
    const amount = (raw.match(/(\d+[\s\d]*(?:[,.]\d+)?)/) || [])[1];
    const client = (raw.match(/pre\s+(.+?)\s+na\s+\d/i) || raw.match(/klienta\s+(.+?)\s+na\s+\d/i) || [])[1] || "Novy klient";
    const desc = (raw.match(/za\s+(.+)$/i) || raw.match(/predmet.*?je\s+(.+)$/i) || [])[1] || "Sluzby";
    const inv = makeInvoice({ profileId: profile().id, kind: "issued", counterpartyName: client.trim(), desc: desc.trim(), amount: num(String(amount || 0).replace(/\s/g, "").replace(",", ".")), vatRate: profile().vatPayer ? 23 : 0, dueDays: 14 });
    state.invoices.unshift(inv);
    addJournalForInvoice(inv);
    state.chat.push({ role: "bot", text: `Vytvoril som fakturu ${inv.invoiceNumber} pre ${inv.counterpartyName} na ${money(inv.total)}. Mozes ju stiahnut cez tlacidlo PDF v sekcii Faktury.` });
  } else {
    state.chat.push({ role: "bot", text: "Tomuto prikazu zatial nerozumiem. Skus naprklad: Vytvor fakturu pre ABC s.r.o. na 2000 eur za sluzby." });
  }
  save();
  render();
  setTimeout(() => {
    const box = document.getElementById("chatBox");
    if (box) box.scrollTop = box.scrollHeight;
  }, 0);
}
function download(filename, content, type = "text/plain") { const blob = new Blob([content], { type }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }
function printInvoice(id) {
  const inv = state.invoices.find((i) => i.id === id);
  if (!inv) return;
  const p = state.profiles.find((x) => x.id === inv.profileId) || profile();
  const cp = [...state.clients, ...state.suppliers].find((x) => x.id === inv.counterpartyId || x.name === inv.counterpartyName) || {};
  const html = `<!doctype html><html><head><title>Faktura ${esc(inv.invoiceNumber)}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:42px}h1{font-size:32px;margin:0}.muted{color:#64748b}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:28px 0}.box{border:1px solid #e2e8f0;border-radius:14px;padding:18px}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:12px;border-bottom:1px solid #e2e8f0;text-align:left}th{background:#f8fafc}.right{text-align:right}.total{font-size:24px;font-weight:700}.footer{margin-top:38px;color:#64748b;font-size:12px}@media print{button{display:none}}</style></head><body><button onclick="print()">Tlacit / ulozit PDF</button><h1>Faktura ${esc(inv.invoiceNumber)}</h1><div class="muted">Variabilny symbol: ${esc(inv.variableSymbol)}</div><div class="grid"><div class="box"><strong>Dodavatel</strong><br>${esc(p.businessName)}<br>${esc(p.address)}<br>ICO: ${esc(p.ico)}<br>DIC: ${esc(p.dic)}<br>${p.icDph ? `IC DPH: ${esc(p.icDph)}<br>` : ""}IBAN: ${esc(p.iban)}<br>${esc(p.registerText)}</div><div class="box"><strong>Odberatel</strong><br>${esc(cp.name || inv.counterpartyName)}<br>${esc(cp.address || "")}<br>${cp.ico ? `ICO: ${esc(cp.ico)}<br>` : ""}${cp.dic ? `DIC: ${esc(cp.dic)}<br>` : ""}${cp.icDph ? `IC DPH: ${esc(cp.icDph)}<br>` : ""}</div></div><div class="grid"><div>Datum vystavenia: <strong>${fmtDate(inv.issueDate)}</strong><br>Datum dodania: <strong>${fmtDate(inv.deliveryDate)}</strong><br>Datum splatnosti: <strong>${fmtDate(inv.dueDate)}</strong></div><div class="right">Celkom na uhradu<br><span class="total">${money(inv.total)}</span></div></div><table><thead><tr><th>Polozka</th><th>Mnozstvo</th><th>Cena bez DPH</th><th>DPH</th><th>Spolu</th></tr></thead><tbody>${inv.items.map((it) => `<tr><td>${esc(it.description)}</td><td>${it.quantity} ${esc(it.unit)}</td><td>${money(it.amountWithoutVat)}</td><td>${money(it.vatAmount)}</td><td>${money(it.total)}</td></tr>`).join("")}</tbody></table><p class="right">Zaklad dane: ${money(inv.amountWithoutVat)}<br>DPH: ${money(inv.vatAmount)}<br><strong>Spolu: ${money(inv.total)}</strong></p><div class="footer">Vygenerovane aplikaciou UctoBot. MVP dokument bez certifikacie uctovneho softveru.</div></body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}
function exportInvoices() { const rows = [["cislo", "typ", "partner", "vystavene", "splatnost", "bez_dph", "dph", "spolu", "stav"], ...activeInvoices().map((i) => [i.invoiceNumber, i.kind, i.counterpartyName, i.issueDate, i.dueDate, i.amountWithoutVat, i.vatAmount, i.total, currentStatus(i)])]; download("uctobot-faktury.csv", rows.map((r) => r.map(csv).join(";")).join("\n"), "text/csv;charset=utf-8"); }
function exportJournal() { const rows = [["datum", "doklad", "text", "md", "dal", "suma", "zdroj"], ...activeJournal().map((j) => [j.date, j.document, j.text, j.debit, j.credit, j.amount, j.source])]; download("uctobot-uctovny-dennik.csv", rows.map((r) => r.map(csv).join(";")).join("\n"), "text/csv;charset=utf-8"); }
function exportJSON() { const p = profile(); const data = { profile: p, invoices: activeInvoices(), expenses: activeExpenses(), bank: activeBank(), journal: activeJournal(), exportedAt: new Date().toISOString() }; download(`uctobot-${p.ico || "firma"}-export.json`, JSON.stringify(data, null, 2), "application/json"); }

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const { action, id, type } = b.dataset;
  if (b.dataset.nav) { state.activeSection = b.dataset.nav; save(); render(); return; }
  if (action === "login-admin") { state.sessionRole = "admin"; save(); render(); return; }
  if (action === "login-user") { state.sessionRole = "user"; save(); render(); return; }
  if (action === "logout") { state.sessionRole = ""; save(); render(); return; }
  if (action === "reset-demo") { if (confirm("Naozaj resetovat demo data?")) { const currentRole = role(); state = seed(); state.sessionRole = currentRole; save(); render(); } return; }
  if (action === "print-invoice") printInvoice(id);
  if (action === "paid-invoice") { if (!requireAdmin()) return; const inv = state.invoices.find((i) => i.id === id); if (inv) inv.status = "paid"; save(); render(); }
  if (action === "delete-invoice") { if (!requireAdmin()) return; state.invoices = state.invoices.filter((i) => i.id !== id); save(); render(); }
  if (action === "delete-party") { if (!requireAdmin()) return; if (type === "client") state.clients = state.clients.filter((x) => x.id !== id); else state.suppliers = state.suppliers.filter((x) => x.id !== id); save(); render(); }
  if (action === "delete-expense") { if (!requireAdmin()) return; state.expenses = state.expenses.filter((x) => x.id !== id); save(); render(); }
  if (action === "delete-template") { if (!requireAdmin()) return; state.templates = state.templates.filter((x) => x.id !== id); save(); render(); }
  if (action === "apply-template") { if (!requireAdmin()) return; const t = state.templates.find((x) => x.id === id); if (t) { const inv = makeInvoice({ profileId: profile().id, kind: "issued", counterpartyName: t.clientName, desc: t.description, amount: t.amount, vatRate: t.vatRate, dueDays: t.dueDays }); state.invoices.unshift(inv); addJournalForInvoice(inv); save(); render(); } }
  if (action === "auto-pair") { if (!requireAdmin()) return; activeBank().forEach(tryPair); save(); render(); }
  if (action === "export-invoices") exportInvoices();
  if (action === "export-journal") exportJournal();
  if (action === "export-json") exportJSON();
});
document.addEventListener("submit", (e) => { e.preventDefault(); submitForm(e.target); });
document.addEventListener("change", (e) => {
  if (e.target.id === "profileSelect") { state.activeProfileId = e.target.value; save(); render(); }
  if (e.target.id === "roleSelect") { state.sessionRole = e.target.value; save(); render(); }
});

render();
