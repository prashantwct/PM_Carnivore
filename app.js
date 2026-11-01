/* Carnivore PM Form F1 — step-by-step wizard.
 * Offline first: the draft lives in localStorage, photos in IndexedDB.
 */
(() => {
  "use strict";

  const DRAFT_KEY = "pmf1.draft.v2";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* ------------------------------------------------------------ state */
  const blank = () => ({ v: {}, lesions: [], samples: [], photos: [], step: 0 });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") || {}); }
  catch (e) { S = blank(); }
  const applyDefaults = () => FORM.forEach((st) => st.sections.forEach((sec) =>
    (sec.fields || []).forEach((f) => { if (f.def && S.v[f.k] === undefined) S.v[f.k] = f.def; })));
  applyDefaults();

  const ALL_FIELDS = [];
  const KEY_STEP = {};
  FORM.forEach((st, i) => st.sections.forEach((sec) => (sec.fields || []).forEach((f) => {
    if (f.k) { ALL_FIELDS.push(f); KEY_STEP[f.k] = i; }
  })));
  const PHOTO_TAGS = [];
  FORM.forEach((st) => st.sections.forEach((sec) => { if (sec.photos) PHOTO_TAGS.push(sec.photos); }));
  PHOTO_TAGS.push("General");

  let saveTimer = null;
  function saveNow() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(S));
      const t = new Date().toTimeString().slice(0, 5);
      $("#draftState").textContent = "Draft saved " + t;
    } catch (e) {
      $("#draftState").textContent = "Could not save draft (storage full)";
    }
  }
  function scheduleSave() {
    $("#draftState").textContent = "Saving…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }

  /* ------------------------------------------------- photo storage (IDB) */
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open("pmf1", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const idb = (mode, fn) => db().then((d) => new Promise((res, rej) => {
    const tx = d.transaction("photos", mode); const out = fn(tx.objectStore("photos"));
    tx.oncomplete = () => res(out && out.result); tx.onerror = () => rej(tx.error);
  }));
  const putPhoto = (id, blob) => idb("readwrite", (s) => s.put({ id, blob }));
  const delPhoto = (id) => idb("readwrite", (s) => s.delete(id));
  const clearPhotos = () => idb("readwrite", (s) => s.clear());
  const getPhoto = (id) => idb("readonly", (s) => s.get(id)).then((r) => r && r.blob);

  async function compress(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
    const max = 1600, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob(res, "image/jpeg", 0.82));
  }

  /* ------------------------------------------------------------ helpers */
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2600);
  }
  const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

  function stepStatus(i) {
    const st = FORM[i];
    let total = 0, done = 0;
    st.sections.forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        if (!f.k || f.type === "check") return;
        total++; if (isFilled(S.v[f.k])) done++;
      });
      if (sec.kind === "lesions") { total++; if (S.lesions.length) done++; }
      if (sec.kind === "samples") { total++; if (S.samples.length) done++; }
      if (sec.kind === "photos-all") { total++; if (S.photos.length) done++; }
    });
    if (st.id === "review") return "none";
    if (!total || !done) return "empty";
    return done >= total ? "done" : "part";
  }
  const STATUS_MARK = { empty: "○", part: "◐", done: "●", none: "" };
  const STATUS_WORD = { empty: "not started", part: "partly filled", done: "complete", none: "" };

  /* -------------------------------------------------------------- render */
  const objectUrls = [];
  function fieldHtml(f) {
    if (f.type === "gpsbtn") {
      return `<div class="fld w-full"><button type="button" class="btn ghost" data-act="gps">📍 Use my current location</button>
        <span id="gpsMsg" class="hint" role="status"></span></div>`;
    }
    const id = "f_" + f.k, val = S.v[f.k] ?? "", cls = "fld w-" + (f.w || "full");
    if (f.type === "check") {
      return `<label class="chk ${cls}"><input type="checkbox" id="${id}" data-k="${f.k}" ${val ? "checked" : ""}> ${esc(f.label)}</label>`;
    }
    let input;
    if (f.type === "textarea") {
      input = `<textarea id="${id}" data-k="${f.k}" rows="3">${esc(val)}</textarea>`;
    } else {
      const t = { date: "date", datetime: "datetime-local", number: "number" }[f.type] || "text";
      input = `<input id="${id}" data-k="${f.k}" type="${t}" ${f.type === "number" ? 'inputmode="numeric" min="0"' : ""} value="${esc(val)}" autocomplete="off">`;
    }
    const opts = (f.chips || []).map((c, i) => `<option value="${i}">${esc(typeof c === "string" ? c : c.t)}</option>`).join("");
    const sel = opts ? `<select class="sugg" data-sugg="${f.k}" aria-label="Suggestions for ${esc(f.label)}"><option value="">Suggestions ▾</option>${opts}</select>` : "";
    const now = f.now ? `<button type="button" class="chip" data-act="now" data-k="${f.k}" data-type="${f.type}">Now</button>` : "";
    const row = sel || now ? `<div class="chips">${now}${sel}</div>` : "";
    return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label>${input}
      ${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ""}${row}</div>`;
  }

  function lesionCard(l, i) {
    const inp = (f, label, ph = "") =>
      `<div class="fld w-full"><label>${label}</label><input data-rep="lesions" data-i="${i}" data-f="${f}" value="${esc(l[f])}" placeholder="${esc(ph)}"></div>`;
    return `<div class="rep" data-card="lesions-${i}">
      <div class="rep-head"><strong>Lesion ${i + 1}</strong><button type="button" class="link danger" data-act="delLesion" data-i="${i}">Remove</button></div>
      ${inp("site", "Site and side", "e.g. ventral neck, left shoulder")}
      <div class="fld w-full"><label>Type</label><input list="lesionTypes" data-rep="lesions" data-i="${i}" data-f="type" value="${esc(l.type)}"></div>
      ${inp("size", "Size (cm)", "length × width")}
      ${inp("desc", "Description and margins")}
      <div class="fld w-full"><label>Haemorrhage beneath lesion</label>
        <select data-rep="lesions" data-i="${i}" data-f="vital">
          ${["", "Present", "Absent", "Not assessable"].map((o) => `<option ${l.vital === o ? "selected" : ""}>${o}</option>`).join("")}
        </select></div>
    </div>`;
  }
  const lesionsHtml = () => `<datalist id="lesionTypes">${LESION_TYPES.map((t) => `<option value="${esc(t)}">`).join("")}</datalist>
    <div id="lesionList">${S.lesions.map(lesionCard).join("")}</div>
    <button type="button" class="btn ghost" data-act="addLesion">＋ Add a lesion</button>`;

  function sampleCard(s, i) {
    const inp = (f, label) =>
      `<div class="fld w-full"><label>${label}</label><input data-rep="samples" data-i="${i}" data-f="${f}" value="${esc(s[f])}"></div>`;
    return `<div class="rep" data-card="samples-${i}">
      <div class="rep-head"><strong>Specimen ${i + 1}</strong><button type="button" class="link danger" data-act="delSample" data-i="${i}">Remove</button></div>
      ${inp("no", "Sample no.")}${inp("type", "Sample type")}${inp("pres", "Preservative")}
      ${inp("exam", "Examination required")}${inp("lab", "Laboratory address")}
    </div>`;
  }
  const samplesHtml = () => `<div class="chips presets"><select class="sugg" data-preset aria-label="Add a common specimen"><option value="">Add a common specimen ▾</option>
      ${SAMPLE_PRESETS.map((p, i) => `<option value="${i}">${esc(p.type)} (${esc(p.exam)})</option>`).join("")}</select></div>
    <div id="sampleList">${S.samples.map(sampleCard).join("")}</div>
    <button type="button" class="btn ghost" data-act="addSample">＋ Add a blank specimen</button>`;

  function photoCard(p) {
    return `<figure class="ph" data-pid="${p.id}">
      <img alt="" data-img="${p.id}">
      <figcaption>
        <input class="cap" data-photo="${p.id}" data-pf="caption" placeholder="Caption: what, which side" value="${esc(p.caption)}">
        <label class="chk sm"><input type="checkbox" data-photo="${p.id}" data-pf="scale" ${p.scale ? "checked" : ""}> Scale in frame</label>
        <button type="button" class="link danger" data-act="delPhoto" data-id="${p.id}">Remove</button>
      </figcaption></figure>`;
  }
  const slotHtml = (tag) => `<div class="slot" data-slot="${esc(tag)}">
      <div class="slot-head"><strong>📷 ${esc(tag)}</strong>
        <span><button type="button" class="btn ghost sm" data-act="take" data-tag="${esc(tag)}">Take photo</button>
        <button type="button" class="btn ghost sm" data-act="pick" data-tag="${esc(tag)}">Choose</button></span></div>
      <div class="thumbs">${S.photos.filter((p) => p.tag === tag).map(photoCard).join("")}</div></div>`;

  function reviewHtml() {
    const gaps = [];
    const need = (k, label) => { if (!isFilled(S.v[k])) gaps.push({ label, step: KEY_STEP[k] }); };
    [["species", "Species"], ["dt_detected", "Date / time detected"], ["loc_detected", "Location detected"],
     ["dt_pm", "Date / time of PM"], ["pm_code", "PM code"], ["local_id", "Local ID (or N.A.)"],
     ["dt_death", "Estimated time of death"], ["death_basis", "Basis of the death estimate"],
     ["body_condition", "Body condition"], ["decomposition", "State of decomposition"],
     ["summary_findings", "Summary of findings"], ["diagnosis_opinion", "Diagnosis / opinion"],
    ].forEach(([k, l]) => need(k, l));
    if (!S.lesions.length && !isFilled(S.v.injuries_neg) && !isFilled(S.v.ext_injuries))
      gaps.push({ label: "External injuries (record lesions or pertinent negatives)", step: KEY_STEP.injuries_neg });
    ALL_FIELDS.forEach((f) => { if (/\[[^\]]+\]/.test(String(S.v[f.k] ?? ""))) gaps.push({ label: `${f.label}: finish the [bracketed] detail`, step: KEY_STEP[f.k] }); });
    if (!S.samples.length) gaps.push({ label: "Specimens collected (or note why none)", step: FORM.findIndex((s) => s.id === "samples") });
    if (!S.photos.length) gaps.push({ label: "Photographs", step: FORM.findIndex((s) => s.id === "photos") });
    const noScale = S.photos.filter((p) => /^IX/.test(p.tag) && !p.scale).length;
    if (noScale) gaps.push({ label: `${noScale} lesion photo(s) without a scale in frame`, step: FORM.findIndex((s) => s.id === "photos") });
    const list = gaps.length
      ? `<ul class="gaps">${gaps.map((g) => `<li><span>${esc(g.label)}</span><button type="button" class="link" data-act="goto" data-i="${g.step}">Fix</button></li>`).join("")}</ul>`
      : `<p class="ok">Nothing obvious is missing.</p>`;
    return `<div class="card"><h2>Before you finish</h2>
        <p class="hint">${gaps.length ? gaps.length + " item(s) still blank. You can still produce the PDF; blanks print as “Not recorded”." : ""}</p>${list}</div>`;
  }

  function sectionHtml(sec, stepId) {
    const head = sec.no ? `<h2><span class="no">${esc(sec.no)}</span> ${esc(sec.title)}</h2>` : `<h2>${esc(sec.title)}</h2>`;
    let body = sec.hint ? `<p class="hint tip">${esc(sec.hint)}</p>` : "";
    if (sec.kind === "lesions") body += lesionsHtml();
    if (sec.kind === "samples") body += samplesHtml();
    if (sec.kind === "photos-all") {
      body += `<p class="hint">Photos taken on earlier steps appear here too. Add captions so each photo can be read without the report.</p>` +
        PHOTO_TAGS.map(slotHtml).join("");
    }
    if (sec.kind === "review") body += reviewHtml();
    body += `<div class="fields">${(sec.fields || []).map(fieldHtml).join("")}</div>`;
    if (sec.photos) body += slotHtml(sec.photos);
    if (sec.kind === "review") {
      body += `<div class="card actions"><button type="button" class="btn primary big" data-act="pdf">⬇ Download PDF report</button>
        <button type="button" class="btn ghost danger" data-act="newcase">Start a new case</button></div>`;
    }
    return `<section class="card">${head}${body}</section>`;
  }

  let cur = 0;
  function render(i, keepScroll) {
    cur = Math.max(0, Math.min(FORM.length - 1, i));
    S.step = cur;
    objectUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    const st = FORM[cur];
    $("#stage").innerHTML = st.sections.map((sec) => sectionHtml(sec, st.id)).join("");
    $("#stepNo").textContent = `Step ${cur + 1} of ${FORM.length}`;
    $("#stepTitle").textContent = st.title;
    $("#barFill").style.width = ((cur + 1) / FORM.length * 100) + "%";
    $("#bar").setAttribute("aria-valuenow", cur + 1);
    $("#back").disabled = cur === 0;
    const last = cur === FORM.length - 1;
    $("#next").hidden = last;
    $("#next").textContent = cur === FORM.length - 2 ? "Review ›" : "Next ›";
    document.title = `${st.title} · PM Form F1`;
    if (!keepScroll) window.scrollTo(0, 0);
    hydratePhotos();
    scheduleSave();
  }

  function hydratePhotos(root = document) {
    root.querySelectorAll("img[data-img]").forEach(async (img) => {
      if (img.src) return;
      const blob = await getPhoto(img.dataset.img).catch(() => null);
      if (blob) { const u = URL.createObjectURL(blob); objectUrls.push(u); img.src = u; }
    });
  }

  function go(i) {
    if (i === cur && $("#stage").children.length) return;
    location.hash = "#" + i;
  }
  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) render(n);
  });

  /* -------------------------------------------------------------- events */
  function setField(k, v) {
    S.v[k] = v;
    const el = document.getElementById("f_" + k);
    if (el) el.value = v;
  }
  const localNow = (type) => {
    const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, type === "date" ? 10 : 16);
  };

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.k) {
      S.v[t.dataset.k] = t.type === "checkbox" ? t.checked : t.value;
    } else if (t.dataset.rep) {
      S[t.dataset.rep][+t.dataset.i][t.dataset.f] = t.value;
    } else if (t.dataset.photo) {
      const p = S.photos.find((x) => x.id === t.dataset.photo);
      if (p) p[t.dataset.pf] = t.type === "checkbox" ? t.checked : t.value;
    } else return;
    scheduleSave();
  });

  const fileCam = $("#camIn"), fileGal = $("#galIn");
  let pendingTag = "General";

  async function addFiles(files) {
    let n = 0;
    for (const f of files) {
      try {
        const blob = await compress(f);
        const id = uid();
        await putPhoto(id, blob);
        S.photos.push({ id, tag: pendingTag, caption: "", scale: false, at: f.lastModified || Date.now() });
        n++;
      } catch (err) { toast("Could not read one of the photos."); }
    }
    if (n) { toast(n + " photo" + (n > 1 ? "s" : "") + " added"); saveNow(); render(cur, true); }
  }
  fileCam.addEventListener("change", () => { addFiles([...fileCam.files]); fileCam.value = ""; });
  fileGal.addEventListener("change", () => { addFiles([...fileGal.files]); fileGal.value = ""; });

  function refreshList(id, html) { $(id).innerHTML = html; }

  document.addEventListener("change", (e) => {
    const sel = e.target.closest("select.sugg"); if (!sel || sel.value === "") return;
    const i = +sel.value; sel.value = "";
    if (sel.hasAttribute("data-preset")) {
      const p = SAMPLE_PRESETS[i];
      S.samples.push({ no: String(S.samples.length + 1), type: p.type, pres: p.pres, exam: p.exam,
        lab: (S.samples[S.samples.length - 1] || {}).lab || "" });
      refreshList("#sampleList", S.samples.map(sampleCard).join("")); scheduleSave();
      toast("Added. Check preservative and laboratory.");
      return;
    }
    const k = sel.dataset.sugg, f = ALL_FIELDS.find((x) => x.k === k); if (!f) return;
    const c0 = f.chips[i], c = typeof c0 === "string" ? { t: c0 } : c0, t = c.v ?? c.t;
    if (f.type === "textarea") {
      const cur0 = (S.v[k] || "").trim();
      setField(k, !cur0 ? t : cur0.includes(t) ? cur0 : cur0.replace(/[.;]?$/, ".") + " " + t);
    } else setField(k, t);
    if (c.set) Object.entries(c.set).forEach(([kk, vv]) => { if (!isFilled(S.v[kk])) setField(kk, vv); });
    scheduleSave();
  });

  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act, k = b.dataset.k;
    if (a === "now") {
      setField(k, localNow(b.dataset.type)); scheduleSave();
    } else if (a === "gps") {
      const msg = $("#gpsMsg");
      if (!navigator.geolocation) { msg.textContent = "This device cannot provide GPS."; return; }
      msg.textContent = "Getting your location…";
      navigator.geolocation.getCurrentPosition((p) => {
        setField("lat", p.coords.latitude.toFixed(6)); setField("long", p.coords.longitude.toFixed(6));
        msg.textContent = `Filled (±${Math.round(p.coords.accuracy)} m). Use this only if you are at the detection site.`;
        scheduleSave();
      }, (err) => {
        msg.textContent = err.code === 1 ? "Location permission is blocked. Allow it or type the coordinates."
          : "No GPS fix. Type the coordinates instead.";
      }, { enableHighAccuracy: true, timeout: 10000 });
    } else if (a === "addLesion") {
      S.lesions.push({ site: "", type: "", size: "", desc: "", vital: "" });
      refreshList("#lesionList", S.lesions.map(lesionCard).join(""));
      const last = $("#lesionList .rep:last-child input"); if (last) last.focus();
      scheduleSave();
    } else if (a === "delLesion") {
      S.lesions.splice(+b.dataset.i, 1);
      refreshList("#lesionList", S.lesions.map(lesionCard).join("")); scheduleSave();
    } else if (a === "addSample") {
      S.samples.push({ no: String(S.samples.length + 1), type: "", pres: "", exam: "", lab: "" });
      refreshList("#sampleList", S.samples.map(sampleCard).join(""));
      const last = $("#sampleList .rep:last-child input:nth-of-type(1)"); if (last) last.focus();
      scheduleSave();
    } else if (a === "delSample") {
      S.samples.splice(+b.dataset.i, 1);
      refreshList("#sampleList", S.samples.map(sampleCard).join("")); scheduleSave();
    } else if (a === "take" || a === "pick") {
      pendingTag = b.dataset.tag; (a === "take" ? fileCam : fileGal).click();
    } else if (a === "delPhoto") {
      if (!confirm("Remove this photo?")) return;
      const id = b.dataset.id;
      S.photos = S.photos.filter((p) => p.id !== id); await delPhoto(id).catch(() => {});
      saveNow(); render(cur, true);
    } else if (a === "goto") {
      go(+b.dataset.i);
    } else if (a === "pdf") {
      b.disabled = true; const old = b.textContent; b.textContent = "Building PDF…";
      try { saveNow(); await window.PM_buildPdf(S, FORM, getPhoto); toast("PDF downloaded"); }
      catch (err) { console.error(err); toast("Could not build the PDF: " + err.message); }
      b.disabled = false; b.textContent = old;
    } else if (a === "newcase") {
      if (!confirm("Start a new case? The current draft and its photos will be deleted from this phone. Download the PDF first if you need it.")) return;
      S = blank(); applyDefaults(); await clearPhotos().catch(() => {});
      localStorage.removeItem(DRAFT_KEY); location.hash = "#0"; render(0); toast("New case started");
    }
  });

  $("#back").addEventListener("click", () => go(cur - 1));
  $("#next").addEventListener("click", () => go(cur + 1));

  /* steps drawer */
  const dlg = $("#stepsDlg");
  function openSteps() {
    $("#stepList").innerHTML = FORM.map((st, i) => {
      const s = stepStatus(i);
      return `<li><button type="button" data-goto="${i}" ${i === cur ? 'aria-current="step"' : ""}>
        <span class="mark ${s}" aria-hidden="true">${STATUS_MARK[s]}</span>
        <span class="lbl"><b>${i + 1}.</b> ${esc(st.short)}</span>
        <span class="sr">${STATUS_WORD[s]}</span></button></li>`;
    }).join("");
    dlg.showModal();
  }
  $("#stepsBtn").addEventListener("click", openSteps);
  $("#closeSteps").addEventListener("click", () => dlg.close());
  $("#stepList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goto]"); if (!b) return;
    dlg.close(); go(+b.dataset.goto);
  });

  /* keep the draft if the tab is closed mid-edit */
  window.addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveNow(); });

  /* offline support */
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

  /* start */
  const h = parseInt(location.hash.slice(1), 10);
  render(!isNaN(h) ? h : S.step || 0);
  if (isNaN(h)) history.replaceState(null, "", "#" + cur);
})();
