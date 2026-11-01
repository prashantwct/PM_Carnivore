# Carnivore PM Form F1

Step-by-step post-mortem examination form for wild carnivores. Works offline on a phone,
saves a draft as you type, and produces a PDF laid out like the MPFD post-mortem report.

## Using it

13 steps, one screen each. **☰ Steps** shows every step with ○ not started, ◐ partly filled, ● complete.

| Step | Report sections |
|---|---|
| 1 Case | I Administrative details |
| 2 Animal | II Description, time-of-death estimate and its basis, other relevant information |
| 3 History | III History and identification |
| 4 Measures | IV Measurements, V Nails, VI Whiskers, VII Teeth |
| 5 Condition | VIII General condition, state of decomposition |
| 6 External | IX External injuries (one card per lesion), X Mucous membranes |
| 7–9 Internal | XI.1–XI.9 Detailed post-mortem examination |
| 10 Opinion | XII Summary, XIII Diagnosis / opinion |
| 11 Specimens | XIV Specimens (common ones are one tap) |
| 12 Photos | XV Photo annexure |
| 13 Review | Gaps list with jump-to links, date, place, signatories, PDF |

Helpers: **Suggestions ▾** dropdowns on most fields (findings drawn from reviewed carnivore post-mortems; in text areas several can be combined; `[brackets]` mark a detail to complete, and the review step flags any left), "Now" for date/time, GPS
button, per-section camera slots with captions and a *scale in frame* tick, and a review list
of anything still blank. Blank fields print as "Not recorded".

The draft (text in localStorage, photos in IndexedDB) stays on the phone until you use
**Start a new case**. Download the PDF before you do.

## Running

```
pip install -r requirements.txt
python app.py            # http://localhost:5000  (FLASK_DEBUG=1 for debug mode)
```

The app is static, so any static host also works. `jsPDF` and `jspdf-autotable` are vendored
in `vendor/`, so nothing is fetched from a CDN and the form works with no signal once loaded.

## Hosting on GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`. The app is then at
`https://prashantwct.github.io/pm_carnivore/` (HTTPS, needed for GPS and offline use). Open it once
on the phone with signal, then *Add to Home Screen*.

## Changing the form

`form.js` is the single definition of steps, sections, fields, dropdown suggestions (`SUGG`) and hints. The wizard and
the PDF both read it, so editing a label or adding a field there changes both. Bump `VERSION`
in `sw.js` after any change so installed copies pick it up.

## Known limits

- The PDF uses standard fonts (Latin-1). Text in Devanagari or other scripts prints as `?`.
  Typing names in English avoids this; embedding a Unicode font would lift it.
- Sections XI.8 (Nervous system) and XI.9 (Other findings) are labelled from the report
  layout as best understood. Correct them in `form.js` if the official form differs.
