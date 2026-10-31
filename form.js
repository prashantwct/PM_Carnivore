/* Form definition — single source of truth for the wizard AND the PDF.
 *
 * Section numbering follows the MPFD carnivore post-mortem report:
 *   I Administrative · II Animal · III History · IV Measurements · V Nails ·
 *   VI Whiskers · VII Teeth · VIII General condition · IX External injuries ·
 *   X Mucous membranes · XI Detailed PM (1–9) · XII Summary · XIII Opinion ·
 *   XIV Specimens · XV Photo annexure.
 *
 * Field:   { k, label, type?, w?, hint?, chips?, def?, now? }
 *   type   text (default) | textarea | date | datetime | number | check | gpsbtn
 *   w      full (default) | half | third
 *   chips  quick-fill buttons; string or { t, set:{otherKey:value} }
 * Section: { no, title, group?, fields?, kind?, photos?, hint? }
 *   kind   lesions | samples | photos-all | review
 *   photos tag for the camera slot shown under the section
 */
// Short label on the button, full phrase written into the field.
const NA_DECOMP = { t: "Not assessable", v: "Not assessable owing to decomposition" };
const ORGAN = ["Putrefied", "N.A.D.", NA_DECOMP, "N.A."];

const FORM = [
  { id: "case", short: "Case", title: "Case details", sections: [
    { no: "I", title: "Administrative details", fields: [
      { k: "ref_no", label: "Ref. letter no.", w: "half" },
      { k: "ref_date", label: "Ref. letter date", type: "date", w: "half" },
      { k: "ref_from", label: "Ref. letter from", def: "Range Officer" },
      { k: "circle", label: "Circle", w: "third" },
      { k: "division", label: "Division", w: "third" },
      { k: "range", label: "Range", w: "third" },
      { k: "por_no", label: "POR no.", w: "half" },
      { k: "comptt_no", label: "Compt. no.", w: "half" },
      { k: "pm_place", label: "PM place" },
      { k: "beat", label: "Beat", w: "third" },
      { k: "local_range", label: "Range (local)", w: "third" },
      { k: "local_div", label: "Division (local)", w: "third", def: "Betul" },
      { k: "pm_code", label: "PM code", w: "half" },
      { k: "dispatch_no", label: "PM dispatch no.", w: "half" },
      { k: "dispatch_date", label: "PM dispatch date", type: "date", w: "half" },
    ] },
  ] },

  { id: "animal", short: "Animal", title: "Description of the animal", sections: [
    { no: "II", title: "Description of the animal", photos: "II Scene and carcass", fields: [
      { k: "species", label: "Species", w: "half", chips: [
        { t: "Tiger", set: { zoo_name: "Panthera tigris" } },
        { t: "Leopard", set: { zoo_name: "Panthera pardus" } },
        { t: "Sloth bear", set: { zoo_name: "Melursus ursinus" } },
        { t: "Wolf", set: { zoo_name: "Canis lupus pallipes" } },
        { t: "Dhole", set: { zoo_name: "Cuon alpinus" } },
        { t: "Striped hyena", set: { zoo_name: "Hyaena hyaena" } },
      ] },
      { k: "zoo_name", label: "Zoological name", w: "half" },
      { k: "dt_detected", label: "Date / time detected", type: "datetime", now: true },
      { k: "loc_detected", label: "Location detected" },
      { k: "lat", label: "Latitude", w: "half" },
      { k: "long", label: "Longitude", w: "half" },
      { type: "gpsbtn" },
      { k: "sex", label: "Sex", w: "half", chips: ["Male", "Female", "Unknown"] },
      { k: "age", label: "Age (approx.)", w: "half", chips: ["Cub", "Sub-adult", "Adult", "Old"] },
      { k: "temp", label: "Ambient temperature", w: "half" },
      { k: "dt_pm", label: "Date / time of post-mortem", type: "datetime", w: "half", now: true },
      { k: "dt_death", label: "Estimated time of death",
        hint: "e.g. Approximately 36–48 hours before PM" },
      { k: "death_basis", label: "Basis of the estimate", type: "textarea",
        hint: "Rigor, decomposition stage, larval activity, ambient temperature, last known sighting." },
      { k: "other_info", label: "Other relevant information", type: "textarea",
        hint: "Scene findings: wire, snare, water, carcass position, who held custody until the PM." },
    ] },
  ] },

  { id: "history", short: "History", title: "History and identification", sections: [
    { no: "III", title: "History and identification", fields: [
      { k: "sickness_dur", label: "Duration of sickness before death", chips: ["N.A.", "Not known"] },
      { k: "signs", label: "Clinical signs and symptoms observed", type: "textarea", chips: ["N.A.", "Not known"] },
      { k: "treatment", label: "Treatment given, if any", type: "textarea", chips: ["None", "N.A."] },
      { k: "local_id", label: "Animal identification (local ID)",
        hint: "Collar no., stripe-pattern ID, camera-trap match. Write N.A. only if truly unidentified.",
        chips: ["N.A."] },
    ] },
  ] },

  { id: "measure", short: "Measures", title: "Measurements and teeth", sections: [
    { no: "IV", title: "Body measurements", photos: "IV Measurements", fields: [
      { k: "body_len", label: "i. Body length, nose to tail (cm)", w: "half" },
      { k: "tail_len", label: "ii. Tail length (cm)", w: "half" },
      { k: "shoulder_h", label: "iii. Shoulder height (cm)", w: "third" },
      { k: "neck_g", label: "iv. Neck girth (cm)", w: "third" },
      { k: "chest_g", label: "v. Chest girth (cm)", w: "third" },
      { k: "fore_r_len", label: "vi. Fore limb, right (cm)", w: "half" },
      { k: "fore_l_len", label: "vi. Fore limb, left (cm)", w: "half" },
      { k: "hind_r_len", label: "vii. Hind limb, right (cm)", w: "half" },
      { k: "hind_l_len", label: "vii. Hind limb, left (cm)", w: "half" },
      { k: "meas_note", label: "Measurement note", type: "textarea",
        hint: "Bloating inflates girths and body length. Say so if the carcass was bloated." },
    ] },
    { no: "V", title: "Nails", fields: [
      { k: "nails", label: "Nails (fore and hind, right and left)", chips: ["All claws present and intact"] },
    ] },
    { no: "VI", title: "Whiskers", fields: [
      { k: "whiskers", label: "Whiskers", chips: ["Present and intact"] },
    ] },
    { no: "VII", title: "Teeth", photos: "VII Teeth", hint:
        "Adult tiger or leopard: 2 upper + 2 lower canines and 6 upper + 6 lower incisors. " +
        "If fewer, say whether the alveolus shows an old or fresh loss.", fields: [
      { k: "u_can_no", label: "Upper canines present", type: "number", w: "half" },
      { k: "l_can_no", label: "Lower canines present", type: "number", w: "half" },
      { k: "u_inc_no", label: "Upper incisors present", type: "number", w: "half" },
      { k: "l_inc_no", label: "Lower incisors present", type: "number", w: "half" },
      { k: "u_absent", label: "Upper canines absent", type: "check", w: "half" },
      { k: "l_absent", label: "Lower canines absent", type: "check", w: "half" },
      { k: "teeth_note", label: "Teeth note", type: "textarea",
        hint: "Fractures, wear, deposits or staining on a tooth (sample it if present).",
        chips: ["All canines and incisors intact", "No fractures observed"] },
    ] },
  ] },

  { id: "condition", short: "Condition", title: "General condition", sections: [
    { no: "VIII", title: "General condition", fields: [
      { k: "body_condition", label: "i. Body condition",
        hint: "A bloated carcass cannot be scored reliably; say so and describe fat reserves in XI.1.",
        chips: ["Good", "Moderate", "Poor", "Not reliably assessable (bloated)"] },
      { k: "skin_coat", label: "ii. Skin and coat", chips: ["Normal", "Putrefied", "Skin slippage present"] },
      { k: "rigor_mortis", label: "iii. Rigor mortis", chips: ["Present", "Passed off", "Not assessable"] },
      { k: "maggots", label: "iv. Maggots", chips: ["Absent", "Present", "Present, extensive"] },
      { k: "decomposition", label: "v. State of decomposition",
        chips: ["Fresh", "Early", "Moderate", "Advanced"] },
    ] },
  ] },

  { id: "external", short: "External", title: "External injuries", sections: [
    { no: "IX", title: "External injuries", kind: "lesions", photos: "IX External injuries", hint:
        "Photograph every lesion with a scale in the same plane as the skin. " +
        "Record side, size and margins; compare groove width with the wire diameter.", fields: [
      { k: "injuries_neg", label: "Pertinent negatives", type: "textarea",
        hint: "Tap to add what was looked for and not found.",
        chips: ["No ligature or constriction groove", "No canine puncture wounds",
                "No claw marks", "No projectile wounds", "Claws and canines intact"] },
      { k: "ext_injuries", label: "Additional notes on external injuries", type: "textarea" },
    ] },
    { no: "X", title: "Mucous membranes", fields: [
      { k: "mm_ocular", label: "i. Ocular", chips: [NA_DECOMP, "Pale", "Congested"] },
      { k: "mm_oral", label: "ii. Oral", chips: ["Maggots were present", "Pale", "Congested"] },
    ] },
  ] },

  { id: "int1", short: "Internal 1: digestive", title: "Digestive system and cavities", sections: [
    { no: "XI.1", group: "XI. Detailed post-mortem examination", title: "Subcutaneous tissue", fields: [
      { k: "sub_fat", label: "Subcutaneous fat",
        chips: [NA_DECOMP, "Adequate", "Scanty"] },
    ] },
    { no: "XI.2", group: "XI. Detailed post-mortem examination", title: "Body cavities", fields: [
      { k: "body_cavities", label: "Pleural, pericardial and peritoneal cavities", type: "textarea",
        hint: "Fluid or blood, quantity, clotted or not; haemorrhage on the cavity surfaces." },
    ] },
    { no: "XI.3", group: "XI. Detailed post-mortem examination", title: "Digestive system",
      photos: "XI.3 Digestive system", fields: [
      { k: "dig_oral", label: "i. Oral cavity", chips: ORGAN },
      { k: "dig_tongue", label: "ii. Tongue", chips: ORGAN },
      { k: "dig_pharynx", label: "iii. Pharynx", chips: ORGAN },
      { k: "dig_oesophagus", label: "iv. Oesophagus", chips: ORGAN },
      { k: "dig_stomach", label: "v. Stomach", chips: ORGAN,
        hint: "Contents. Any growths or nodules: number, size, site. Sampled or not." },
      { k: "dig_small", label: "vi. Small intestine", chips: ORGAN },
      { k: "dig_large", label: "vii. Large intestine", chips: ORGAN,
        hint: "Rectal prolapse in a decomposed carcass is usually gas pressure; note it." },
      { k: "dig_liver", label: "viii. Liver and gall bladder", chips: ORGAN },
    ] },
  ] },

  { id: "int2", short: "Internal 2: respiratory, heart", title: "Respiratory and heart", sections: [
    { no: "XI.4", group: "XI. Detailed post-mortem examination", title: "Respiratory system",
      photos: "XI.4 Respiratory system", fields: [
      { k: "resp_nasal", label: "i. Nasal cavity", chips: ORGAN },
      { k: "resp_trachea", label: "ii. Trachea", chips: ORGAN },
      { k: "resp_lungs", label: "iii. Lungs", chips: ORGAN },
    ] },
    { no: "XI.5", group: "XI. Detailed post-mortem examination", title: "Cardiovascular system",
      photos: "XI.5 Cardiovascular system", fields: [
      { k: "card_sac", label: "i. Pericardial sac", chips: ORGAN },
      { k: "card_muscle", label: "ii. Heart muscle", chips: ORGAN,
        hint: "If ruptured: seen in situ before handling or found after evisceration? Size, site, " +
              "and haemorrhage at the margins (ante-mortem) or not." },
      { k: "card_chambers", label: "iii. Heart chambers", chips: ORGAN,
        hint: "Blood: quantity, colour, clotted or unclotted." },
      { k: "card_spleen", label: "iv. Spleen", chips: ORGAN },
    ] },
  ] },

  { id: "int3", short: "Internal 3: uro-genital, other", title: "Uro-genital and injuries", sections: [
    { no: "XI.6", group: "XI. Detailed post-mortem examination", title: "Uro-genital system",
      photos: "XI.6 Uro-genital system", fields: [
      { k: "uro_urine", label: "i. Urine: colour, quantity, other observation", chips: ["Bladder empty", "N.A."] },
      { k: "uro_bladder", label: "ii. Urinary bladder", chips: ORGAN },
      { k: "uro_kidneys", label: "iii. Kidneys (both)", chips: ORGAN },
      { k: "uro_male", label: "iv. Reproductive organs: penis and testes", chips: ["N.A.", "Putrefied", "N.A.D."] },
      { k: "uro_uterus", label: "Reproductive organs: uterus",
        hint: "Gravid (number of foetuses), non-gravid, or not assessable.", chips: ["N.A.", "Putrefied", "Non-gravid"] },
      { k: "uro_mammary", label: "Reproductive organs: mammary glands",
        chips: ["N.A.", "Non-lactating", "Lactating", "Not assessable"] },
    ] },
    { no: "XI.7", group: "XI. Detailed post-mortem examination", title: "Internal injuries",
      photos: "XI.7 Internal injuries", fields: [
      { k: "inj_muscle", label: "i. Muscles", type: "textarea",
        hint: "Site, side and character of any haemorrhage (head, neck, paravertebral, limbs). " +
              "Dependent-side hypostasis is not haemorrhage." },
      { k: "inj_bones", label: "ii. Bones", chips: ["N.A.D.", "N.A.D. No fractures observed"] },
    ] },
    { no: "XI.8", group: "XI. Detailed post-mortem examination", title: "Nervous system", fields: [
      { k: "nerv_brain", label: "Brain and meninges", chips: ORGAN },
    ] },
    { no: "XI.9", group: "XI. Detailed post-mortem examination", title: "Other findings", fields: [
      { k: "other_findings", label: "Other findings", type: "textarea",
        hint: "Lesions seen on the reflected skin or in the subcutis, on the muscle surface, or anything not covered above." },
    ] },
  ] },

  { id: "opinion", short: "Opinion", title: "Summary and opinion", sections: [
    { no: "XII", title: "Summary of major findings", fields: [
      { k: "summary_findings", label: "Summary of major findings", type: "textarea",
        hint: "Findings that bear on the cause of death. Decomposition changes (bloating, slippage, " +
              "putrefaction) are not findings of cause; list them separately." },
    ] },
    { no: "XIII", title: "Diagnosis / opinion", fields: [
      { k: "diagnosis_opinion", label: "Diagnosis / opinion", type: "textarea",
        hint: "State the supporting findings. Use “consistent with” while histopathology or " +
              "toxicology is pending." },
    ] },
  ] },

  { id: "samples", short: "Specimens", title: "Laboratory specimens", sections: [
    { no: "XIV", title: "Specimens collected for laboratory investigations", kind: "samples" },
  ] },

  { id: "photos", short: "Photos", title: "Photo annexure", sections: [
    { no: "XV", title: "Photo annexure", kind: "photos-all" },
  ] },

  { id: "review", short: "Review", title: "Review and sign", sections: [
    { no: "", title: "Sign-off", kind: "review", fields: [
      { k: "sign_date", label: "Date", type: "date", w: "half", now: true },
      { k: "sign_place", label: "Place", w: "half" },
      { k: "vo1_name", label: "Wildlife Health Officer (VO 1): name" },
      { k: "vo2_name", label: "Veterinary Officer 2: name" },
    ] },
  ] },
];

const LESION_TYPES = ["Linear groove / burn", "Crater", "Round lesion", "Avulsion", "Laceration",
  "Puncture", "Abrasion", "Ligature mark"];

const SAMPLE_PRESETS = [
  { type: "Skin at lesion margin", pres: "10% neutral buffered formalin", exam: "Histopathology (vital reaction)" },
  { type: "Skin from control site", pres: "10% neutral buffered formalin", exam: "Histopathology (control)" },
  { type: "Heart muscle", pres: "10% neutral buffered formalin", exam: "Histopathology" },
  { type: "Liver", pres: "Frozen (-20 °C)", exam: "Toxicology" },
  { type: "Kidney", pres: "Frozen (-20 °C)", exam: "Toxicology" },
  { type: "Stomach contents", pres: "Frozen (-20 °C)", exam: "Toxicology" },
  { type: "Tooth deposit / suspected metal", pres: "Dry, sealed, labelled", exam: "SEM-EDX / metal analysis" },
];
