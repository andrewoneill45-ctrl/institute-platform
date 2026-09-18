import { Link } from "react-router-dom";
import { Kick } from "@asi/design-system";
import SiteShell from "./SiteShell.jsx";

const HEADLINES = [
  ["3,237", "secondary schools read together, one method, no black boxes"],
  ["−3.7", "Attainment 8 points per ten points of disadvantage: the gradient"],
  ["271", "majority-disadvantaged schools in the top half of national attainment"],
  ["55%", "of secondaries still below their 2019 attainment; London alone has recovered"],
];

export default function System() {
  return (
    <SiteShell kick="State of the System" title={<>The annual reading of <em>the whole system</em></>}>
      <section className="sect"><div className="container" style={{ maxWidth: 820 }}>
        <p className="lede">The Institute's flagship: one report, each year, that reads every school in
          England at once and says plainly what it finds. Launched at the Summit, given to members first,
          then published to the nation.</p>
        <p>It is written to be read in staffrooms and at the centre of government alike: the disadvantage
          gradient, the uneven recovery, inclusion measured honestly, and the schools whose results the
          system should be studying rather than merely ranking.</p>
      </div></section>

      <section className="sect alt"><div className="container">
        <Kick>2026 · headline findings</Kick>
        <h2>What the data says <em>this year</em></h2>
        <div className="stat-grid">
          {HEADLINES.map(([n, t]) => (
            <div className="card" key={t}><div className="stat-n">{n}</div><p className="muted" style={{ margin: 0 }}>{t}</p></div>
          ))}
        </div>
        <div className="ctas" style={{ marginTop: 28 }}>
          <Link to="/insights" className="btn solid">Interrogate the evidence live</Link>
          <Link to="/summit" className="btn line">Attend the launch</Link>
        </div>
      </div></section>
    </SiteShell>
  );
}
