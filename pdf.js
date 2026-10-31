/* PDF report. Built from the same FORM definition as the wizard, so the
 * printed sections and numbering always match what was entered. */
window.PM_buildPdf = async function (S, FORM, getPhotoBlob) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const PW = 210, PH = 297, M = 14;
  const GREEN = [27, 94, 32], PALE = [232, 240, 233], GREY = [120, 120, 120];

  // Standard PDF fonts cover Latin-1 and common punctuation only. Anything
  // else would print as garbage, so replace it with "?" and make that visible.
  const ok = /[\u0009\u000A -~ -ÿ–—‘’“”•…]/;
  const clean = (s) => String(s ?? "").split("").map((c) => (ok.test(c) ? c : "?")).join("");

  const p2 = (n) => String(n).padStart(2, "0");
  const fmtDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v.slice(8)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : v);
  const fmtDT = (v) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) ? `${fmtDate(v.slice(0, 10))} ${v.slice(11, 16)}` : v);
  const fmtMs = (ms) => { const d = new Date(ms); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };

  function shown(f) {
    const v = S.v[f.k];
    if (f.type === "check") return v ? "Yes" : "No";
    if (v === undefined || v === null || String(v).trim() === "") return null;
    if (f.type === "date") return clean(fmtDate(v));
    if (f.type === "datetime") return clean(fmtDT(v));
    return clean(v);
  }
  const NR = { content: "Not recorded", styles: { textColor: GREY, fontStyle: "italic" } };

  const base = () => ({
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : 30,
    margin: { left: M, right: M, bottom: 18 },
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9.5, cellPadding: 2, lineColor: [150, 150, 150], lineWidth: 0.2, valign: "top", textColor: 20 },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold", halign: "left" },
  });

  /* ---- title block */
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text("POST-MORTEM EXAMINATION REPORT", PW / 2, 15, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("Carnivores - Form F1", PW / 2, 21, { align: "center" });
  const sub = [S.v.pm_code && "PM code: " + S.v.pm_code, S.v.species, S.v.dt_pm && "PM: " + fmtDT(S.v.dt_pm)]
    .filter(Boolean).map(clean).join("   |   ");
  if (sub) { doc.setFontSize(9); doc.setTextColor(90); doc.text(sub, PW / 2, 26, { align: "center" }); doc.setTextColor(0); }

  /* ---- sections */
  let lastGroup = null;
  for (const st of FORM) {
    for (const sec of st.sections) {
      if (sec.kind === "review" || sec.kind === "photos-all") continue;
      const title = sec.group ? `${sec.no.split(".")[1]}. ${sec.title}` : `${sec.no}. ${sec.title}`;

      const head = [];
      if (sec.group && sec.group !== lastGroup) {
        head.push([{ content: clean(sec.group), colSpan: 2, styles: { fillColor: GREEN } }]);
        head.push([{ content: clean(title), colSpan: 2, styles: { fillColor: PALE, textColor: 20 } }]);
      } else if (sec.group) {
        head.push([{ content: clean(title), colSpan: 2, styles: { fillColor: PALE, textColor: 20 } }]);
      } else {
        head.push([{ content: clean(title), colSpan: 2 }]);
      }
      lastGroup = sec.group || null;

      if (sec.kind === "lesions") {
        doc.autoTable({
          ...base(),
          head: [[{ content: clean(title), colSpan: 6 }], ["No.", "Site / side", "Type", "Size (cm)", "Description / margins", "Haemorrhage beneath"]],
          body: S.lesions.length
            ? S.lesions.map((l, i) => [i + 1, clean(l.site), clean(l.type), clean(l.size), clean(l.desc), clean(l.vital)]
                .map((c) => (c === "" ? NR : c)))
            : [[{ content: "No lesions recorded", colSpan: 6, styles: { textColor: GREY, fontStyle: "italic" } }]],
          columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 22 }, 5: { cellWidth: 28 } },
          didParseCell: (d) => { if (d.section === "head" && d.row.index === 1) { d.cell.styles.fillColor = PALE; d.cell.styles.textColor = 20; } },
        });
      }
      if (sec.kind === "samples") {
        doc.autoTable({
          ...base(),
          head: [[{ content: clean(title), colSpan: 6 }], ["S.No", "Sample no.", "Sample type", "Preservative", "Examination required", "Laboratory address"]],
          body: S.samples.length
            ? S.samples.map((s, i) => [i + 1, clean(s.no), clean(s.type), clean(s.pres), clean(s.exam), clean(s.lab)]
                .map((c) => (c === "" ? NR : c)))
            : [[{ content: "No specimen recorded", colSpan: 6, styles: { textColor: GREY, fontStyle: "italic" } }]],
          columnStyles: { 0: { cellWidth: 12 } },
          didParseCell: (d) => { if (d.section === "head" && d.row.index === 1) { d.cell.styles.fillColor = PALE; d.cell.styles.textColor = 20; } },
        });
      }

      const fields = (sec.fields || []).filter((f) => f.k);
      if (fields.length) {
        const rows = fields.map((f) => [{ content: clean(f.label), styles: { fontStyle: "bold", fillColor: [247, 247, 247] } }, shown(f) ?? NR]);
        const opts = { ...base(), body: rows, columnStyles: { 0: { cellWidth: 62 } } };
        if (sec.kind === "lesions" || sec.kind === "samples") { opts.startY = doc.lastAutoTable.finalY; }
        else opts.head = head;
        doc.autoTable(opts);
      }
    }
  }

  /* ---- declaration */
  const nm = (k, d) => (S.v[k] && String(S.v[k]).trim() ? "Dr. " + clean(S.v[k]).replace(/^Dr\.?\s*/i, "") : d);
  doc.autoTable({
    ...base(),
    head: [[{ content: "Date and place", colSpan: 2 }]],
    body: [
      [{ content: "Date", styles: { fontStyle: "bold", fillColor: [247, 247, 247] } }, S.v.sign_date ? clean(fmtDate(S.v.sign_date)) : NR],
      [{ content: "Place", styles: { fontStyle: "bold", fillColor: [247, 247, 247] } }, S.v.sign_place ? clean(S.v.sign_place) : NR],
    ],
    columnStyles: { 0: { cellWidth: 62 } },
  });
  doc.autoTable({
    ...base(),
    theme: "plain",
    startY: doc.lastAutoTable.finalY + 6,
    body: [
      [{ content: "", styles: { minCellHeight: 20 } }, { content: "", styles: { minCellHeight: 20 } }],
      [nm("vo1_name", "(Dr. ........................)") + "\nWildlife Health Officer (VO 1)",
       nm("vo2_name", "(Dr. ........................)") + "\nVeterinary Officer 2"],
    ],
    styles: { fontSize: 10, halign: "center", cellPadding: 1.5, fontStyle: "bold" },
    didDrawCell: (d) => { if (d.row.index === 1) { doc.setDrawColor(0); doc.setLineWidth(0.3); doc.line(d.cell.x + 8, d.cell.y, d.cell.x + d.cell.width - 8, d.cell.y); } },
  });

  /* ---- photo annexure */
  const dataUrl = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  const dims = (u) => new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res([4, 3]); i.src = u; });
  const tagOrder = [];
  FORM.forEach((st) => st.sections.forEach((sec) => { if (sec.photos) tagOrder.push(sec.photos); }));
  tagOrder.push("General");
  const photos = [...S.photos].sort((a, b) => tagOrder.indexOf(a.tag) - tagOrder.indexOf(b.tag));

  if (photos.length) {
    let slot = 2, n = 0;
    for (const p of photos) {
      const blob = await getPhotoBlob(p.id);
      if (!blob) continue;
      if (slot === 2) {
        doc.addPage(); slot = 0;
        doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0);
        doc.text("XV. PHOTO ANNEXURE", PW / 2, 15, { align: "center" });
      }
      n++;
      const top = 22 + slot * 128;
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(clean(`Photo ${n}. ${p.caption || "(no caption)"}`), M, top, { maxWidth: PW - 2 * M });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(90);
      doc.text(clean(`${p.tag}  |  Recorded ${fmtMs(p.at)}  |  Scale in frame: ${p.scale ? "Yes" : "No"}`), M, top + 5.5);
      doc.setTextColor(0);
      const u = await dataUrl(blob), [w, h] = await dims(u);
      const bw = PW - 2 * M, bh = 106, k = Math.min(bw / w, bh / h);
      doc.addImage(u, "JPEG", M + (bw - w * k) / 2, top + 9, w * k, h * k);
      doc.setDrawColor(190); doc.rect(M, top + 9, bw, bh);
      slot++;
    }
  }

  /* ---- footer on every page */
  const total = doc.getNumberOfPages();
  const code = clean(S.v.pm_code || "draft");
  for (let i = 1; i <= total; i++) {
    doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(110);
    doc.text(`PM code: ${code}   |   Page ${i} of ${total}`, PW / 2, PH - 8, { align: "center" });
  }

  const stamp = (S.v.dt_pm || new Date().toISOString()).slice(0, 10).replace(/-/g, "");
  const name = String(S.v.pm_code || S.v.species || "draft").replace(/[^A-Za-z0-9_-]+/g, "_");
  doc.save(`PM_F1_${name}_${stamp}.pdf`);
};
