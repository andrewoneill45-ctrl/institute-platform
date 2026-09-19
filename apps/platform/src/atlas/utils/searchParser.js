/**
 * Smart Search Parser v2
 * Understands natural language queries like:
 * - "Outstanding secondaries in Camden"
 * - "Harris academies"
 * - "Catholic schools near SW1"
 * - "Haverstock"
 * - "primary schools sunderland fsm over 40"
 * - "good or outstanding secondary london"
 */

const REGIONS = {
  'london': 'London', 'south east': 'South East', 'south west': 'South West',
  'east of england': 'East of England', 'east midlands': 'East Midlands',
  'west midlands': 'West Midlands', 'yorkshire': 'Yorkshire and The Humber',
  'yorkshire and the humber': 'Yorkshire and The Humber', 'north west': 'North West',
  'north east': 'North East',
};

const PHASE = {
  'primary': 'Primary', 'primaries': 'Primary', 'junior': 'Primary', 'infant': 'Primary',
  'secondary': 'Secondary', 'secondaries': 'Secondary', 'high school': 'Secondary', 'high schools': 'Secondary',
  'special': 'Special', 'special school': 'Special', 'special schools': 'Special',
  'all-through': 'All-through', 'all through': 'All-through',
  'nursery': 'Nursery', 'sixth form': '16 plus', 'post-16': '16 plus',
};

const OFSTED = {
  'outstanding': 'Outstanding', 'good': 'Good', 'requires improvement': 'Requires improvement',
  'ri': 'Requires improvement', 'inadequate': 'Inadequate', 'failing': 'Inadequate',
};

const FAITH = {
  'catholic': 'Roman Catholic', 'rc': 'Roman Catholic', 'roman catholic': 'Roman Catholic',
  'church of england': 'Church of England', 'c of e': 'Church of England', 'coe': 'Church of England', 'ce ': 'Church of England',
  'jewish': 'Jewish', 'muslim': 'Muslim', 'islamic': 'Muslim', 'sikh': 'Sikh',
  'hindu': 'Hindu', 'methodist': 'Methodist', 'faith': '_any_faith',
};

const TYPE_MAP = {
  'academy': 'academy', 'academies': 'academy', 'free school': 'free school',
  'free schools': 'free school', 'maintained': 'maintained', 'grammar': 'grammar',
  'grammars': 'grammar', 'grammar school': 'grammar', 'grammar schools': 'grammar',
};

const STOP_WORDS = new Set([
  'schools', 'school', 'in', 'near', 'around', 'the', 'with', 'that', 'are',
  'is', 'and', 'or', 'of', 'for', 'at', 'from', 'a', 'an', 'my', 'all',
  'show', 'me', 'find', 'search', 'list', 'what', 'which', 'where', 'how',
  'many', 'there', 'have', 'has', 'do', 'does', 'can', 'please', 'could',
  'give', 'get', 'look', 'looking', 'i', 'want', 'need', 'to', 'see',
]);

export function parseSearchQuery(query, allSchools) {
  if (!query || !query.trim()) return null;
  const original = query.trim();
  const lower = original.toLowerCase();
const hasWord = (text, kw) =>
  new RegExp('\\b' + kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text);

  const f = {};

  // 1. Extract phase
  for (const [kw, val] of Object.entries(PHASE)) {
    if (hasWord(lower, kw)) { f.phase = val; break; }
  }

  // 2. Extract Ofsted (handle "good or outstanding")
  const ofstedMatches = [];
  for (const [kw, val] of Object.entries(OFSTED)) {
    if (hasWord(lower, kw)) ofstedMatches.push(val);
  }
  if (ofstedMatches.length === 1) f.ofsted = ofstedMatches[0];
  else if (ofstedMatches.length > 1) f.ofstedMulti = ofstedMatches;

  // 3. Extract faith
  for (const [kw, val] of Object.entries(FAITH)) {
    if (hasWord(lower, kw)) { f.faithQuery = val; break; }
  }

  // 4. Extract type
  for (const [kw, val] of Object.entries(TYPE_MAP)) {
    if (hasWord(lower, kw)) { f.typeQuery = val; break; }
  }

  // 5. Extract gender
  if (/\b(girls|girl's|all[\s-]?girls)\b/.test(lower)) f.gender = 'Girls';
  else if (/\b(boys|boy's|all[\s-]?boys)\b/.test(lower)) f.gender = 'Boys';

  // 6. Extract region
  for (const [kw, val] of Object.entries(REGIONS)) {
    if (hasWord(lower, kw)) { f.region = val; break; }
  }

  // 7. Extract numeric filters
  let m;
  m = lower.match(/(?:attainment\s*8?|a8)\s*(?:above|over|>|more than|greater than|at least|higher than)\s*([\d.]+)/); if (m) f.minAttainment8 = parseFloat(m[1]);
  m = lower.match(/(?:attainment\s*8?|a8)\s*(?:below|under|<|less than|lower than)\s*([\d.]+)/); if (m) f.maxAttainment8 = parseFloat(m[1]);
  m = lower.match(/(?:progress\s*8?|p8)\s*(?:above|over|>|more than|greater than|at least|higher than)\s*([-\d.]+)/); if (m) f.minProgress8 = parseFloat(m[1]);
  m = lower.match(/(?:progress\s*8?|p8)\s*(?:below|under|<|less than|lower than)\s*([-\d.]+)/); if (m) f.maxProgress8 = parseFloat(m[1]);
  if (lower.includes('positive progress') || lower.includes('positive p8')) f.minProgress8 = 0.01;
  if (lower.includes('negative progress') || lower.includes('negative p8')) f.maxProgress8 = -0.01;
  m = lower.match(/(?:more than|above|over|>|at least)\s*(\d+)\s*(?:pupils?|students?|children)/); if (m) f.minPupils = parseInt(m[1]);
  m = lower.match(/(?:less than|fewer than|below|under|<)\s*(\d+)\s*(?:pupils?|students?|children)/); if (m) f.maxPupils = parseInt(m[1]);
  m = lower.match(/(?:fsm|free school meals?|disadvantaged|pupil premium)\s*(?:above|over|>|more than|at least|higher than)\s*(\d+)/); if (m) f.minFSM = parseFloat(m[1]);
  m = lower.match(/(?:fsm|free school meals?|disadvantaged|pupil premium)\s*(?:below|under|<|less than|lower than)\s*(\d+)/); if (m) f.maxFSM = parseFloat(m[1]);

  // Performance keywords
  if (/\b(top|best|highest)\s+(performing|rated|achieving)\b/.test(lower)) f.minAttainment8 = f.minAttainment8 || 55;
  if (/\b(high\s+performing|above\s+average)\b/.test(lower)) f.minAttainment8 = f.minAttainment8 || 50;
  if (/\b(below\s+average|low\s+performing|struggling|underperforming)\b/.test(lower)) f.maxAttainment8 = f.maxAttainment8 || 40;

  // Size keywords
  if (/\bvery\s+large\b/.test(lower)) f.minPupils = f.minPupils || 1500;
  else if (/\blarge\b/.test(lower) && !lower.includes('by and large')) f.minPupils = f.minPupils || 1000;
  if (/\bvery\s+small\b/.test(lower)) f.maxPupils = f.maxPupils || 150;
  else if (/\bsmall\b/.test(lower)) f.maxPupils = f.maxPupils || 300;

  // 8. Extract postcode
  m = original.match(/\b([A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s*\d?[A-Za-z]{0,2})\b/);
  if (m) {
    const pc = m[1].toUpperCase().replace(/\s/g, '');
    const NOT_POSTCODES = new Set(['A8', 'P8', 'KS1', 'KS2', 'KS4', 'KS5', 'Y7', 'Y8', 'Y9', 'Y10', 'Y11']);
    const idx = original.toUpperCase().indexOf(m[1].toUpperCase());
    const before = original.slice(0, idx).toLowerCase();
    const hasContext = /(?:\bin|\bnear|\baround|\bpostcode)\s*$/.test(before);
    if (/^[A-Z]{1,2}\d/.test(pc) && pc.length <= 8 && !NOT_POSTCODES.has(pc)
        && (pc.length >= 3 || hasContext)) f.postcodeQuery = pc;
  }

  // 9. Extract trust names
  const knownTrusts = ['ark', 'harris', 'oasis', 'dixons', 'united learning', 'delta',
    'outwood', 'inspiration', 'ormiston', 'star academies', 'reach', 'astrea', 'david ross',
    'academies enterprise', 'northern education', 'greenwood', 'kemnal', 'the spencer'];
  for (const t of knownTrusts) {
    if (lower.includes(t)) { f.trustQuery = t; break; }
  }
  if (!f.trustQuery) {
    m = lower.match(/(?:trust|mat|federation)\s+(?:called|named)?\s*(.+?)(?:\s+(?:in|with|that|schools?)|$)/);
    if (m) f.trustQuery = m[1].trim();
  }

  // 10. Smart location/name detection - the key improvement
  // After extracting all structured filters, the remaining words are likely place or school names
  if (!f.region && !f.postcodeQuery && !f.trustQuery) {
    // Remove all matched keywords to find the "leftover" — likely a place or school name
    let residual = lower;
    // Remove matched keywords
    const removePatterns = [
      ...Object.keys(PHASE), ...Object.keys(OFSTED), ...Object.keys(FAITH),
      ...Object.keys(TYPE_MAP), ...Object.keys(REGIONS),
      'fsm above \\d+', 'fsm over \\d+', 'fsm below \\d+',
      'a8 above \\d+', 'a8 over \\d+', 'p8 above \\d+',
      'top performing', 'high performing', 'best performing',
      'above average', 'below average', 'low performing',
      'very large', 'very small', 'large', 'small',
      'positive progress', 'negative progress',
      'girls', 'boys',
    ];
    removePatterns
      .slice()
      .sort((a, b) => b.length - a.length)
      .forEach(p => {
        const isRegex = /\\d|\\s/.test(p);
        const body = isRegex ? p : p.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        residual = residual.replace(new RegExp('\\b(?:' + body + ')\\b', 'gi'), ' ');
      });
    // numeric residue from metric phrases
    residual = residual.replace(/\b(?:above|over|below|under|at least|more than|less than|fewer than)\s+[\d.]+%?/gi, ' ');
    residual = residual.replace(/\b\d+(?:\.\d+)?%?\b/g, ' ');
    // Remove stop words
    const words = residual.split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
    const leftover = words.join(' ').trim();

    if (leftover.length >= 2) {
      // Check if it matches known LAs, towns, or school names
      if (allSchools && allSchools.length) {
        const laSet = new Set(allSchools.map(s => (s.la || '').toLowerCase()).filter(Boolean));
        const townSet = new Set(allSchools.map(s => (s.town || '').toLowerCase()).filter(Boolean));
        const isPlace = (t) => laSet.has(t) || townSet.has(t);

        if (isPlace(leftover)) {
          f.locationQuery = leftover;
        } else {
          // Peel a known place (up to three words) off either end of the blob:
          // "st marys leeds" becomes name "st marys" in location "leeds".
          let placed = false;
          for (let n = Math.min(3, words.length - 1); n >= 1 && !placed; n--) {
            const tail = words.slice(-n).join(' ');
            const head = words.slice(0, n).join(' ');
            if (isPlace(tail)) {
              f.locationQuery = tail;
              const rest = words.slice(0, -n).join(' ').trim();
              if (rest) f.nameQuery = rest;
              placed = true;
            } else if (isPlace(head)) {
              f.locationQuery = head;
              const rest = words.slice(n).join(' ').trim();
              if (rest) f.nameQuery = rest;
              placed = true;
            }
          }
          if (!placed) {
            // Conservative partial: a place that starts with the leftover (4+ chars)
            const part = leftover.length >= 4 &&
              ([...laSet].find(la => la.startsWith(leftover)) || [...townSet].find(t => t.startsWith(leftover)));
            if (part) f.locationQuery = leftover;
            else f.fuzzyQuery = leftover;
          }
        }
      } else {
        f.fuzzyQuery = leftover;
      }
    }
  }

  // 11. If no filters at all, treat entire query as fuzzy
  if (Object.keys(f).length === 0 && original.length >= 2) {
    f.fuzzyQuery = original;
  }

  return Object.keys(f).length > 0 ? f : null;
}

export function applyFilters(schools, filters) {
  if (!filters) return schools;
  return schools.filter(s => {
    if (filters.phase && s.phase !== filters.phase) return false;
    if (filters.ofsted && s.ofsted !== filters.ofsted) return false;
    if (filters.ofstedMulti && !filters.ofstedMulti.includes(s.ofsted)) return false;
    if (filters.gender && s.gender !== filters.gender) return false;
    if (filters.region && !(s.region || '').toLowerCase().includes(filters.region.toLowerCase())) return false;

    if (filters.locationQuery) {
      const q = filters.locationQuery.toLowerCase();
      const fields = [s.la, s.town, s.name, s.postcode].filter(Boolean).map(x => x.toLowerCase());
      if (!fields.some(f => f.includes(q))) return false;
    }
    if (filters.nameQuery && !(s.name || '').toLowerCase().includes(filters.nameQuery.toLowerCase())) return false;
    if (filters.postcodeQuery) {
      const pc = (s.postcode || '').toUpperCase().replace(/\s/g, '');
      if (!pc.startsWith(filters.postcodeQuery.replace(/\s/g, ''))) return false;
    }
    if (filters.trustQuery) {
      const q = filters.trustQuery.toLowerCase();
      if (!(s.trust || '').toLowerCase().includes(q) && !(s.name || '').toLowerCase().includes(q)) return false;
    }
    if (filters.typeQuery && !(s.type || '').toLowerCase().includes(filters.typeQuery)) return false;
    if (filters.faithQuery) {
      const fa = (s.religiousCharacter || '').toLowerCase();
      if (filters.faithQuery === '_any_faith') { if (!fa || fa === 'none' || fa === 'does not apply') return false; }
      else { if (!fa.includes(filters.faithQuery.toLowerCase())) return false; }
    }
    if (filters.minAttainment8 != null && (s.attainment8 == null || s.attainment8 < filters.minAttainment8)) return false;
    if (filters.maxAttainment8 != null && (s.attainment8 == null || s.attainment8 > filters.maxAttainment8)) return false;
    if (filters.minProgress8 != null) {
      const p8 = s.p8_prev ?? s.progress8;
      if (p8 == null || p8 < filters.minProgress8) return false;
    }
    if (filters.maxProgress8 != null) {
      const p8 = s.p8_prev ?? s.progress8;
      if (p8 == null || p8 > filters.maxProgress8) return false;
    }
    if (filters.minPupils != null && (s.pupils == null || s.pupils < filters.minPupils)) return false;
    if (filters.maxPupils != null && (s.pupils == null || s.pupils > filters.maxPupils)) return false;
    if (filters.minFSM != null && (s.fsm_pct == null || s.fsm_pct < filters.minFSM)) return false;
    if (filters.maxFSM != null && (s.fsm_pct == null || s.fsm_pct > filters.maxFSM)) return false;

    if (filters.fuzzyQuery) {
      const q = filters.fuzzyQuery.toLowerCase();
      const all = [s.name, s.la, s.town, s.trust, s.postcode, s.region, s.type, s.religiousCharacter]
        .filter(Boolean).map(x => x.toLowerCase());
      const blob = all.join(' ');
      // Direct substring match
      if (blob.includes(q)) return true;
      // All words match somewhere
      const words = q.split(/\s+/).filter(w => w.length > 1);
      if (words.length > 1 && words.every(w => blob.includes(w))) return true;
      // Partial word match (each query word starts a word in the blob)
      if (words.every(w => all.some(t => t.split(/\s+/).some(tw => tw.startsWith(w))))) return true;
      return false;
    }
    return true;
  });
}

export function describeFilters(filters) {
  if (!filters) return '';
  if (filters.fuzzyQuery) return '"' + filters.fuzzyQuery + '"';
  const p = [];
  if (filters.ofsted) p.push(filters.ofsted);
  if (filters.ofstedMulti) p.push(filters.ofstedMulti.join(' or '));
  if (filters.phase) p.push(filters.phase.toLowerCase());
  if (filters.typeQuery) p.push(filters.typeQuery);
  if (filters.faithQuery && filters.faithQuery !== '_any_faith') p.push(filters.faithQuery);
  p.push('schools');
  if (filters.locationQuery) p.push('in ' + filters.locationQuery);
  if (filters.region) p.push('in ' + filters.region);
  if (filters.postcodeQuery) p.push('near ' + filters.postcodeQuery);
  if (filters.trustQuery) p.push('(' + filters.trustQuery + ')');
  if (filters.minAttainment8) p.push('A8 ≥ ' + filters.minAttainment8);
  if (filters.maxAttainment8) p.push('A8 ≤ ' + filters.maxAttainment8);
  if (filters.minProgress8) p.push('P8 ≥ ' + filters.minProgress8);
  if (filters.minFSM) p.push('FSM ≥ ' + filters.minFSM + '%');
  if (filters.gender) p.push(filters.gender.toLowerCase());
  return p.join(' ');
}
