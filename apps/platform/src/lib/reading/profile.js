/* Structure only: what the AI may see of a pupil-level table.
   Every column is reduced to its heading, its kind, how full it is and how
   varied, and only for safe, low-variety columns (grades, Y/N flags, year
   groups, subject names) a handful of its commonest values. A column that
   could identify a child (a name, a UPN, a birthdate, an address, contact
   details, an admission number, free-text notes) is sent as its heading and
   kind alone, never one value. Detection reads the values as well as the
   heading, because columns are not always honestly labelled. */

const UPN = /^[A-Z]\d{11}[A-Z0-9]$/i;
const POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
const EMAIL = /@[^\s@]+\.[a-z]{2,}/i;
const PHONE = /^\+?[\d\s()-]{10,16}$/;
const DATE = /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2})(\s|T|$)/;
/* a capitalised word or words: McCarthy, O'Brien, Smith-Jones, Mohammed Ali */
const PERSON = /^[A-Z][A-Za-z'’-]+(?:[ ,]+[A-Z][A-Za-z'’-]+){0,3}$/;
const num = (v) => { const n = parseFloat(String(v).replace(/[%,\s£]/g, "")); return isFinite(n) && /^[\s£]*-?[\d,.]+\s*%?\s*$/.test(String(v)) ? n : null; };

const HEAD = {
  name: /\b(name|forename|surname|first ?name|last ?name|legal|preferred|known as|full ?name)\b/i,
  upn: /\b(upn|unique pupil|uln|unique learner)\b/i,
  dob: /\b(dob|d\.o\.b|birth|date of birth|birthday)\b/i,
  address: /\b(address|street|road|postcode|post code|town of residence)\b/i,
  contact: /\b(email|e-mail|phone|mobile|telephone|contact|parent|carer|guardian)\b/i,
  idnum: /\b(admission|adno|adm no|mis id|pupil id|student id|candidate (no|number)|exam no)\b/i,
  notes: /\b(note|notes|comment|comments|concern|incident|description|detail|details|reason|narrative|summary)\b/i,
  /* special-category and safeguarding data: the heading tells the reader enough */
  special: /\b(ethnic\w*|religio\w*|medical|health|diagnos\w*|condition|safeguard\w*|child protection|cp plan|cin\b|looked after|cla\b|lac\b|social (care|worker)|young carer|exclusion reason|referral)\b/i,
  staff: /\b(teacher|staff|tutor|keyworker|key worker|mentor|hoy|head of year|set by|marked by)\b/i,
};
/* values that are curriculum words, not people (option blocks, pathways, routes) */
const CURRIC = /^(english|eng|maths?|mathematics|science|combined science|biology|chemistry|physics|history|geography|french|spanish|german|latin|art|art and design|music|drama|dance|pe|physical education|computing|computer science|ict|re|rs|religious (studies|education)|business|business studies|economics|sociology|psychology|media|media studies|film|photography|textiles|food|food (tech|technology|preparation)|design( and)? technology|dt|engineering|statistics|further maths|citizenship|pshe|triple|double|ebacc|open|none|other|yes|no|y|n|true|false|male|female|boy|girl|september|january|autumn|spring|summer)( \d)?$/i;
/* headings under which a capitalised value is a category, not a person */
const CATEGORY_HEAD = /\b(subject|course|qualification|measure|type|period|term|window|set|result|grade|key ?stage|phase|gender|sex|language|need|reporting|assessment|year ?group|form|reg|house|tier|band)\b/i;

export function profileColumn(header, values, i) {
  const h = String(header || "").trim();
  const vals = values.map((v) => String(v ?? "").trim());
  const filled = vals.filter(Boolean);
  const n = vals.length || 1;
  const distinct = new Set(filled.map((v) => v.toLowerCase()));
  const ratio = filled.length ? distinct.size / filled.length : 0;
  const share = (re) => (filled.length ? filled.filter((v) => re.test(v)).length / filled.length : 0);
  const numShare = filled.length ? filled.filter((v) => num(v) != null).length / filled.length : 0;
  const avgLen = filled.length ? filled.reduce((a, v) => a + v.length, 0) / filled.length : 0;
  const col = { i, header: h.slice(0, 80), fill: Math.round((100 * filled.length) / n) / 100, distinct: distinct.size };

  /* identifiers: by heading, or by what the values look like */
  let id = null;
  if (HEAD.upn.test(h) || share(UPN) > 0.5) id = "upn";
  else if (HEAD.dob.test(h)) id = "dob";
  else if (HEAD.address.test(h) || share(POSTCODE) > 0.3) id = "address";
  else if (share(EMAIL) > 0.2 || (HEAD.contact.test(h) && (share(PHONE) > 0.3 || share(EMAIL) > 0.1 || avgLen > 6 && ratio > 0.4))) id = "contact";
  else if (HEAD.idnum.test(h) && ratio > 0.5) id = "id-number";
  /* a heading that says name is a name, however often the values repeat
     (siblings, common surnames); categorical headings ("Subject name") are not */
  else if (HEAD.name.test(h) && !CATEGORY_HEAD.test(h) && numShare < 0.3) id = "name";
  /* and values shaped like names are names, whatever the heading says */
  else if (!CATEGORY_HEAD.test(h) && share(PERSON) > 0.6 && share(CURRIC) < 0.5 && ratio > 0.15 && filled.length >= 5) id = "name";
  else if (share(DATE) > 0.6 && ratio > 0.3) id = "date-of-birth-like";
  else if (HEAD.special.test(h)) id = "special-category";
  else if (HEAD.staff.test(h) && numShare < 0.5) id = "staff-name";
  else if (HEAD.notes.test(h) && avgLen > 12) id = "free-text";
  else if (avgLen > 40) id = "free-text";
  if (id) {
    col.identifier = id;
    col.type = id === "upn" || id === "id-number" ? "code" : id === "dob" || id === "date-of-birth-like" ? "date" : "text";
    return col; /* heading and kind only: no values, ever */
  }

  if (!filled.length) { col.type = "empty"; return col; }
  if (share(DATE) > 0.6) { col.type = "date"; return col; }
  if (numShare > 0.8) {
    col.type = "number";
    const xs = filled.map(num).filter((x) => x != null).sort((a, b) => a - b);
    col.numeric = { min: xs[0], max: xs[xs.length - 1], median: xs[Math.floor(xs.length / 2)], integers: Math.round((100 * xs.filter((x) => Number.isInteger(x)).length) / xs.length) / 100 };
  } else col.type = "text";

  /* safe samples: low-variety, short values only (grades, flags, subjects, year groups) */
  const lowVariety = distinct.size <= 40 || ratio <= 0.3;
  if (lowVariety && avgLen <= 20) {
    const freq = {};
    filled.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
    const categorical = CATEGORY_HEAD.test(h);
    col.samples = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([v]) => v.slice(0, 24))
      /* never a UPN; never something shaped like a person's name unless the
         heading says the column holds categories (subjects, measures, groups) */
      .filter((v) => !UPN.test(v) && (categorical || CURRIC.test(v) || !PERSON.test(v)));
    if (!col.samples.length) delete col.samples;
  } else col.note = "high-variety values withheld";
  return col;
}

/* a whole table: the heading row plus every body row, profiled column by column */
export function profileTable(table, { fileName = "" } = {}) {
  const rows = table.rows || [];
  const head = rows[0] || [];
  const body = rows.slice(1);
  const width = Math.max(head.length, ...body.slice(0, 200).map((r) => r.length));
  const columns = [];
  for (let i = 0; i < width; i++) columns.push(profileColumn(head[i], body.map((r) => r[i]), i));
  return {
    file: String(fileName).replace(/[A-Z]\d{11}[A-Z0-9]/gi, "[UPN]").slice(0, 140),
    sheet: String(table.name || "").slice(0, 60),
    rows: body.length,
    titleRowsSkipped: table.skipped || 0,
    columns,
  };
}

/* the gate: nothing pupil-identifying may appear anywhere in what is sent */
export function leaksFrom(profile, table) {
  const sent = JSON.stringify(profile);
  const leaks = [];
  const rows = (table.rows || []).slice(1);
  const idCols = profile.columns.filter((c) => c.identifier).map((c) => c.i);
  for (const r of rows) {
    for (const i of idCols) {
      const v = String(r[i] ?? "").trim();
      if (v.length >= 3 && sent.includes(v)) leaks.push({ col: i, value: v.slice(0, 3) + "…" });
    }
    for (const c of r) if (UPN.test(String(c).trim()) && sent.includes(String(c).trim())) leaks.push({ upn: true });
  }
  return leaks;
}
