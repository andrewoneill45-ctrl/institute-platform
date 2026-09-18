import { Link } from "react-router-dom";
import { Wordmark, Kick, CREED, INSTRUMENTS } from "@asi/design-system";
import { SiteNav } from "./SiteShell.jsx";

export default function Home() {
  return (
    <>
      <SiteNav />

      <header className="hero"><div className="container">
        <h1>Where England's school leaders come to <em>think</em> and gain <em>insight</em></h1>
        <p className="sub">An institute in the older sense of the word: a small and serious body that convenes
          the system's most consequential leaders, reads the national evidence without fear or favour,
          and publishes what it finds. Its work is written to be read in staffrooms and at the centre
          of government alike.</p>
        <div className="ctas">
          <Link to="/signin" className="btn solid">Enter the Fellowship</Link>
          <Link to="/insights" className="btn line">National insights</Link>
        </div>
      </div></header>

      <section className="sect" id="beliefs"><div className="container">
        <Kick>What we believe</Kick>
        <h2>Five things we hold to be true</h2>
        <div className="creed">{CREED.map((t, i) => <p key={i}>{t}</p>)}</div>
      </div></section>

      <section className="sect" id="instruments"><div className="container">
        <Kick>The instruments</Kick>
        <h2>See. Know. Act.</h2>
        <p className="lede">Three tools, used in sequence. First you see the whole system and your true place
          in it. Then you examine your own school honestly. Then you act on what you have learned.</p>
        <div className="trio">
          {INSTRUMENTS.map((t) => (
            <div className="card" key={t.name}>
              <span className="verb">{t.verb}</span>
              <h3>{t.name}</h3>
              <p>{t.blurb}</p>
            </div>
          ))}
        </div>
      </div></section>

      <footer className="footer"><div className="container" style={{ display: "flex", justifyContent: "space-between", padding: 0 }}>
        <span>The All Saints Institute · a trading subsidiary of All Saints Catholic College</span>
        <span>© 2026</span>
      </div></footer>
    </>
  );
}
