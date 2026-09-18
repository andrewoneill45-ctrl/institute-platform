import { Link } from "react-router-dom";
import { Kick } from "@asi/design-system";
import SiteShell from "./SiteShell.jsx";

export default function Summit() {
  return (
    <SiteShell kick="The Summit" title={<>One day. The whole system <em>in the room</em></>}>
      <section className="sect"><div className="container" style={{ maxWidth: 820 }}>
        <p className="lede">Once a year the Fellowship gathers: the founding hundred, the people who run
          the system, and the people who study it. The State of the System is delivered from the front of
          the room before anyone else has seen it.</p>
        <p>The Summit is not a conference. There are no exhibition stands, no parallel tracks, no lanyard
          economy. There is one room, one day, and the year's six seminar questions brought to a head by
          the leaders who spent the year arguing them.</p>
        <p className="muted">First Summit: London, date to be announced to the founding cohort first.</p>
        <div className="ctas" style={{ marginTop: 26 }}>
          <Link to="/fellowship" className="btn solid">The Fellowship is the invitation</Link>
          <Link to="/system" className="btn line">State of the System</Link>
        </div>
      </div></section>
    </SiteShell>
  );
}
