/* The school profile, transplanted: clicking a pin now opens THE full picture
   — the same page Prizm renders (tiles, report card, standing, similar intake,
   trend, the record, inclusion, the money) — so Atlas can never fall behind
   the dataset again. The panel keeps its own actions: PDF, compare, similar
   schools, and the road into Prizm. */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import React, { useEffect, useState } from 'react';
import { exportSchoolPDF } from '../utils/pdfReport';
import { getDataset, getEarly } from '../../lib/dataset.js';
import { attachOfsted, computeSchoolDash } from '../../member/prizm/engine.js';
import { schoolDashHtml, attachTipCard, PZ_CSS } from '../../member/prizm/render.js';
import './SchoolProfile.css';

/* decile → house colour, used by the map's markers */
export function decileColor(d) {
  if (d == null) return '#A79FB5';
  if (d >= 8) return '#6A0CA0';
  if (d >= 5) return '#C6A035';
  return '#B4475A';
}

const SchoolProfile = ({ school, allSchools, onClose, onCompare, onOpenSchool }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const s = school;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState('');
  const [dash, setDash] = useState(null);

  useEffect(() => {
    let live = true;
    setDash(null);
    if (!s) return undefined;
    Promise.all([getDataset(), getEarly()]).then(([{ raw, ofsted }, early]) => {
      if (!live) return;
      attachOfsted(raw, ofsted);
      setDash(computeSchoolDash(raw, s.urn, { early }));
    }).catch(() => { if (live) setDash(null); });
    return () => { live = false; };
  }, [s && s.urn]);

  /* hover cards on the charts; clicking a school inside them opens its profile */
  useEffect(() => attachTipCard(document, (u) => { if (onOpenSchool) onOpenSchool(u); }), [onOpenSchool]);

  if (!s) return null;
  const mine = user?.urn ? Number(s.urn) === user.urn : (user?.school && s.name && user.school.toLowerCase() === s.name.toLowerCase());

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-panel" onClick={e => e.stopPropagation()}>
        <style>{PZ_CSS}</style>
        <button className="sp-close" onClick={onClose} aria-label="Close">✕</button>

        {mine && (
          <Link to="/members/lens" style={{ display: 'block', background: '#F4EEFA', border: '1px solid rgba(106,12,160,.25)', borderLeft: '3px solid #C6A035', borderRadius: 10, padding: '10px 14px', margin: '0 0 14px', color: '#4B0875', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            This is your school · open it in Lens →
          </Link>
        )}

        <div className="sp-actions">
          <button className="sp-btn sp-btn-primary" disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true);
              try { await exportSchoolPDF(s, allSchools, (msg) => setPdfStatus(msg)); } catch { setPdfStatus('The PDF could not be built.'); }
              setPdfLoading(false); setTimeout(() => setPdfStatus(''), 3000);
            }}>
            {pdfLoading ? 'Building…' : 'School report PDF'}
          </button>
          {onCompare && <button className="sp-btn" onClick={() => onCompare(s)}>+ Compare</button>}
          {s.onFindSimilar && <button className="sp-btn" onClick={() => s.onFindSimilar(s)}>Similar schools</button>}
          <button className="sp-btn" onClick={() => navigate(`/members/prizm?spec=${encodeURIComponent(JSON.stringify({ scope: { type: 'urns', urns: [String(s.urn)] } }))}`)}>
            Open in Prizm
          </button>
          {pdfStatus && <span className="sp-status">{pdfStatus}</span>}
        </div>

        {dash
          ? <div className="pz-report sp-dash" dangerouslySetInnerHTML={{ __html: schoolDashHtml(dash) }} />
          : <div className="sp-loading">the full picture is arriving…</div>}
      </div>
    </div>
  );
};

export default SchoolProfile;
