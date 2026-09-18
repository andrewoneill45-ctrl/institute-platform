import { Kick } from "@asi/design-system";
import SiteShell from "./SiteShell.jsx";

const FORTHCOMING = [
  ["002", "The Inclusion Premium", "The case for funding inclusion as an outcome, not a cost."],
  ["003", "What the coast is owed", "Place, recovery, and the schools furthest from the centre."],
  ["004", "The SEND settlement", "After reform: what schools should actually do differently."],
];

export default function Positions() {
  return (
    <SiteShell kick="Positions" title={<>Short papers that <em>take a side</em></>}>
      <section className="sect"><div className="container" style={{ maxWidth: 820 }}>
        <p className="lede">Written in plain English, anchored in national data, published under the
          Institute's mark. Over time the numbered series becomes a body of doctrine that people cite,
          contest and wait for.</p>
      </div></section>

      <section className="sect alt"><div className="container" style={{ maxWidth: 820 }}>
        <Kick>Position 001 · September 2026</Kick>
        <h2>The gradient is <em>not destiny</em></h2>
        <p>Across 3,237 English secondary schools, every ten percentage points of disadvantage in a
          school's intake costs, on average, 3.7 points of Attainment 8. The correlation is strong
          (r&nbsp;=&nbsp;−0.54) and it is the single most reliable fact about our system: tell me a
          school's free school meals rate and I will guess its results, and I will usually be right.</p>
        <p>Usually: but not always, and the exceptions are the point. Two hundred and seventy-one schools
          with majority-disadvantaged intakes sit in the top half of the national attainment distribution.
          They are not statistical noise; they are concentrated, visible, and disproportionately doing the
          system's hardest job. The gradient describes the system we have. It does not prescribe the
          system we must keep.</p>
        <p>Meanwhile the recovery since 2019 has been uneven to the point of unfairness: a majority of
          secondary schools remain below their pre-pandemic attainment, London is the only region to have
          recovered outright, and the gap widens with distance from the capital. A system serious about
          the gradient would fund what the 271 have learned and take it to the coast and the north first.</p>
        <p className="muted" style={{ fontSize: 13 }}>Method: Institute analysis of DfE published KS4 data,
          2025 provisional, with the January 2026 school census. Every figure in this paper can be
          interrogated live in <a href="/insights">Insights</a>. Nothing is a black box.</p>
      </div></section>

      <section className="sect"><div className="container" style={{ maxWidth: 820 }}>
        <Kick>Forthcoming</Kick>
        <h2>The series continues</h2>
        {FORTHCOMING.map(([n, t, d]) => (
          <div key={n} style={{ padding: "18px 0", borderBottom: "1px solid var(--hair)" }}>
            <div className="kick" style={{ marginBottom: 4 }}>Position {n}</div>
            <h3 style={{ margin: "0 0 4px" }}>{t}</h3>
            <p className="muted" style={{ margin: 0 }}>{d}</p>
          </div>
        ))}
      </div></section>
    </SiteShell>
  );
}
