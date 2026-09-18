import { Link } from "react-router-dom";
import { Kick, INSTRUMENTS } from "@asi/design-system";
import SiteShell from "./SiteShell.jsx";

export default function Fellowship() {
  return (
    <SiteShell kick="The Fellowship" title={<>Joined, <em>not bought</em></>}>
      <section className="sect"><div className="container" style={{ maxWidth: 820 }}>
        <p className="lede">Membership is per school. We open with a founding cohort of one hundred,
          chosen for what they are doing rather than what they can pay. Scarcity at the start is deliberate:
          the second hundred should be asking to get in.</p>
        <p>Fellowship brings the seminar rooms, the numbered Positions before publication, the annual
          State of the System ahead of the sector, a place at the Summit, and the three instruments:
          the whole system seen, your own school known, the plan in motion.</p>
      </div></section>

      <section className="sect alt"><div className="container">
        <Kick>The instruments</Kick>
        <h2>See. Know. Act.</h2>
        <div className="trio">
          {INSTRUMENTS.map(i => (
            <div className="card" key={i.name}>
              <div className="kick" style={{ marginBottom: 6 }}>{i.verb}</div>
              <h3>{i.name}</h3>
              <p>{i.blurb}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 26, maxWidth: 820 }}>Three tools, used in sequence: first you see the whole
          system and your true place in it; then you examine your own school honestly; then you act on what
          you have learned. That sequence is the Institute's method, and no other organisation in education
          can offer it.</p>
      </div></section>

      <section className="sect"><div className="container" style={{ maxWidth: 820 }}>
        <Kick>The covenant</Kick>
        <h2>Your data is <em>yours</em></h2>
        <p>A school's Lens data belongs to that school. It is never published, never ranked, never shared,
          and never seen by the Institute without permission. This is stated publicly and kept absolutely,
          because trust is what makes the Fellowship possible: and it is written into the terms of
          membership, not left as a promise.</p>
        <div className="ctas" style={{ marginTop: 26 }}>
          <Link to="/signin?join=1" className="btn solid">Request a place in the founding hundred</Link>
          <Link to="/insights" className="btn line">Read the national evidence first</Link>
        </div>
      </div></section>
    </SiteShell>
  );
}
