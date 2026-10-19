/* The front page — the film, told by scrolling. One dark stage pins under the
   nav while a field of light re-forms itself scene by scene: who we are, what
   we do, each instrument, the papers, and the invitation. It ends on the
   register-interest form; a light band below carries the work itself.
   The timed version of the same film lives at /film/ for events and sharing. */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SiteNav } from "./SiteShell.jsx";
import { Wordmark } from "@asi/design-system";
import { mountFilm, SCENES, SCROLL_SCREENS, CONSTELLATION_COUNTS } from "./film/engine.js";

const INK = "#221233", MUTED = "#6F6580", GOLDK = "#8a6d1c", PAPER = "#FBFAF7";

const CSS = `
.fh { --navh: 71px; --stage: #12071C; --s-ink: #F3EEF8; --s-body: rgba(236,228,244,.8); --s-gold: #DDB65E; --s-lilac: #C4A4E8;
  color: ${INK}; background: ${PAPER}; font-family: Inter, sans-serif;
  --h1: clamp(32px, min(4.2vw, 7vh), 70px); --hero: clamp(42px, min(5.4vw, 9vh), 92px); --name: clamp(52px, min(7.4vw, 12vh), 124px);
  --h2: clamp(19px, min(1.9vw, 3.2vh), 30px); --body: clamp(15px, 1.15vw, 18px); --eye: 11.5px; --lab: clamp(17px, 1.35vw, 22px); --labs: 12px; }
.fh[data-mode="P"] { --h1: clamp(28px, 8.2vw, 42px); --hero: clamp(36px, 10.4vw, 52px); --name: clamp(46px, 13vw, 66px);
  --h2: 18px; --body: 15px; --eye: 10.5px; --lab: 15px; --labs: 11px; }

.fh-run { position: relative; background: var(--stage); height: calc(${SCROLL_SCREENS + 1} * (100svh - var(--navh))); }
.fh-stage { position: sticky; top: var(--navh); height: calc(100svh - var(--navh)); overflow: hidden; isolation: isolate; color: var(--s-ink); }
.fh-stage::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: radial-gradient(60% 70% at 72% 42%, rgba(106,12,160,.36), transparent 70%), radial-gradient(50% 60% at 10% 100%, rgba(106,12,160,.18), transparent 70%); }
.fh-stage::after { content: ""; position: absolute; inset: 0; z-index: 3; pointer-events: none; box-shadow: inset 0 0 160px rgba(0,0,0,.5); }
.fh-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }

.fh .scene { position: absolute; inset: 0; z-index: 2; pointer-events: none; visibility: hidden; transition: visibility 0s linear .9s; }
.fh .scene.on { visibility: visible; transition-delay: 0s; }
.fh .scene.on .hit { pointer-events: auto; }
.fh .cap { position: absolute; display: flex; flex-direction: column; gap: clamp(10px, 1.4vh, 16px); }
.fh .cap.side { left: max(6%, 28px); top: 50%; transform: translateY(-50%); width: 40%; }
.fh .cap.top { left: max(6%, 28px); top: 8%; width: 70%; }
.fh .cap.mid { left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(78%, 900px); text-align: center; align-items: center; }
.fh[data-mode="P"] .cap.side, .fh[data-mode="P"] .cap.top { left: 20px; right: 20px; top: 5%; width: auto; transform: none; }
.fh[data-mode="P"] .cap.mid { width: calc(100% - 40px); }
.fh[data-mode="P"] .cap { gap: 10px; }

.fh .rv { opacity: 0; transform: translateY(14px); filter: blur(4px); transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform 1.1s cubic-bezier(.2,.7,.2,1), filter .9s; }
.fh .rv.in { opacity: 1; transform: none; filter: none; }
.fh .eye { font: 600 var(--eye)/1.2 Inter, sans-serif; letter-spacing: .22em; text-transform: uppercase; color: var(--s-gold); margin: 0; }
.fh .h1 { font: 300 var(--h1)/1.06 Fraunces, Georgia, serif; font-variation-settings: "opsz" 144; letter-spacing: -.02em; color: var(--s-ink); margin: 0; text-wrap: balance; }
.fh .h1.big { font-size: var(--hero); line-height: 1.02; }
.fh .h1 em, .fh .h1 .soft { font-style: italic; color: var(--s-lilac); }
.fh .name { font: 300 var(--name)/.92 Fraunces, Georgia, serif; font-variation-settings: "opsz" 144; letter-spacing: -.03em; color: var(--s-ink); margin: 0; }
.fh .h2 { font: italic 400 var(--h2)/1.2 Fraunces, Georgia, serif; color: var(--s-lilac); margin: 0; text-wrap: balance; }
.fh .body { font: 400 var(--body)/1.6 Inter, sans-serif; color: var(--s-body); margin: 0; max-width: 36em; text-wrap: pretty; }
.fh .small-caps { font: 500 var(--eye)/1.5 Inter, sans-serif; letter-spacing: .3em; text-transform: uppercase; color: var(--s-body); }

.fh .ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
.fh .cta { border-radius: 999px; padding: 15px 28px; font: 600 14px/1 Inter, sans-serif; text-decoration: none; cursor: pointer; border: none; }
.fh .cta.gold { background: var(--s-gold); color: #241238; }
.fh .cta.gold:hover { background: #E8C676; }
.fh .cta.line { background: transparent; color: var(--s-ink); border: 1px solid rgba(243,238,248,.35); }
.fh .cta.line:hover { border-color: var(--s-ink); }
.fh .cta:focus-visible, .fh .rail button:focus-visible, .fh-form input:focus-visible { outline: 2px solid var(--s-gold); outline-offset: 3px; }
.fh .cue { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px;
  font: 600 10px/1 Inter, sans-serif; letter-spacing: .26em; color: rgba(236,228,244,.55); }
.fh .cue i { width: 1px; height: 34px; background: linear-gradient(rgba(221,182,94,.9), transparent); animation: fhcue 2.2s ease-in-out infinite; transform-origin: top; }
@keyframes fhcue { 0% { transform: scaleY(0); } 50% { transform: scaleY(1); } 100% { transform: scaleY(1); opacity: 0; } }
.fh[data-mode="P"] .cue { display: none; }

.fh .pl { position: absolute; display: flex; flex-direction: column; gap: 4px; width: max-content; max-width: 22%; }
.fh[data-mode="P"] .pl { max-width: 25%; }
.fh .pl b { font: 400 var(--lab)/1.1 Fraunces, Georgia, serif; color: var(--s-ink); }
.fh .pl span { font: 400 var(--labs)/1.4 Inter, sans-serif; color: var(--s-body); }
.fh .pl.a-l { transform: translate(0, -50%); } .fh .pl.a-r { transform: translate(-100%, -50%); text-align: right; }
.fh .pl.a-t { transform: translate(-50%, -100%); text-align: center; align-items: center; } .fh .pl.a-b { transform: translate(-50%, 0); text-align: center; align-items: center; }
.fh .yl { position: absolute; transform: translate(0, -50%); font: 600 var(--labs)/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgba(236,228,244,.55); transition: color .6s, opacity .6s; }
.fh .yl.hot { color: var(--s-gold); } .fh .yl.in.dim { opacity: .12; }

.fh .pill { display: inline-flex; align-items: center; gap: 10px; align-self: flex-start; padding: 11px 18px; border-radius: 999px;
  border: 1px solid rgba(221,182,94,.45); background: rgba(221,182,94,.08); font: 400 var(--body)/1.25 Inter, sans-serif; color: var(--s-ink); }
.fh .pill .tag { font-weight: 600; color: var(--s-gold); font-size: .78em; letter-spacing: .08em; text-transform: uppercase; flex: none; }
.fh .caret { display: inline-block; width: 1px; height: 1.1em; background: var(--s-gold); animation: fhblink 1s steps(1) infinite; flex: none; }
@keyframes fhblink { 50% { opacity: 0; } }
.fh .note { font: 400 var(--labs)/1.4 Inter, sans-serif; color: var(--s-gold); }
.fh[data-mode="P"] .note { display: none; }
.fh .chips { display: flex; gap: 8px; flex-wrap: wrap; }
.fh .chip { font: 500 var(--labs)/1 Inter, sans-serif; letter-spacing: .05em; padding: 9px 15px; border-radius: 999px; border: 1px solid rgba(236,228,244,.25); color: var(--s-body); transition: all .5s; }
.fh .chip.on { background: var(--s-ink); color: #2A0F40; border-color: var(--s-ink); }
.fh .stance { position: relative; font: italic 400 var(--body)/1.4 Fraunces, Georgia, serif; color: var(--s-ink); min-height: 1.5em; }
.fh .stance span { position: absolute; left: 0; top: 0; transition: opacity .5s; } .fh .stance span.off { opacity: 0; }
.fh .legend { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.fh .legend li { display: flex; align-items: center; gap: 10px; font: 500 var(--labs)/1.3 Inter, sans-serif; color: var(--s-ink); }
.fh .legend i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.fh .ccard { align-self: flex-start; display: flex; gap: 22px; padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(221,182,94,.4); background: rgba(18,7,28,.6); }
.fh .ccard div { display: flex; flex-direction: column; gap: 3px; }
.fh .ccard b { font: 400 calc(var(--h2) * 1.25)/1 Fraunces, Georgia, serif; color: var(--s-gold); font-variant-numeric: tabular-nums; }
.fh .ccard span { font: 500 var(--labs)/1.3 Inter, sans-serif; color: var(--s-body); }
.fh .frame { position: absolute; border: 1px solid rgba(236,228,244,.16); border-radius: 14px; background: linear-gradient(rgba(255,255,255,.035), rgba(255,255,255,0)); }
.fh .frame .ft { position: absolute; left: 4%; top: 4%; display: flex; flex-direction: column; gap: 4px; }
.fh .frame .ft b { font: 400 var(--lab)/1.2 Fraunces, Georgia, serif; color: var(--s-ink); }
.fh .frame .ft span { font: 500 var(--labs)/1.2 Inter, sans-serif; color: var(--s-body); letter-spacing: .08em; }
.fh .frame .badge { position: absolute; right: 4%; top: 4%; opacity: .85; }

.fh .papers { position: absolute; }
.fh .paper { position: absolute; left: 50%; top: 50%; width: 46%; aspect-ratio: 1 / 1.414; max-width: 100%; background: #F7F4FA; border-radius: 5px; padding: 6% 6.5%;
  box-shadow: 0 24px 48px rgba(0,0,0,.45); display: flex; flex-direction: column; gap: 4%; opacity: 0; box-sizing: border-box;
  transform: translate(-50%, -40%); transition: transform 1.3s cubic-bezier(.2,.7,.2,1), opacity .8s; }
.fh .paper .pn { font: 600 clamp(8px, .7vw, 11px)/1 Inter, sans-serif; letter-spacing: .24em; color: #6A0CA0; }
.fh .paper .pt { font: 400 clamp(11px, 1.05vw, 17px)/1.25 Fraunces, Georgia, serif; color: #2A0F40; text-wrap: balance; }
.fh .paper .pw { margin-top: auto; }
.fh .papers.in .paper { opacity: 1; }
.fh .papers.in .paper:nth-child(1) { transform: translate(-118%, -46%) rotate(-9deg); }
.fh .papers.in .paper:nth-child(2) { transform: translate(-80%, -52%) rotate(-3deg); transition-delay: .15s; }
.fh .papers.in .paper:nth-child(3) { transform: translate(-40%, -48%) rotate(3deg); transition-delay: .3s; }
.fh .papers.in .paper:nth-child(4) { transform: translate(-2%, -44%) rotate(9deg); transition-delay: .45s; }

.fh-form { display: flex; gap: 10px; width: 100%; max-width: 520px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
.fh-form input { flex: 1 1 240px; min-width: 0; border: 1px solid rgba(243,238,248,.3); border-radius: 999px; padding: 15px 22px; font: 400 15px Inter, sans-serif;
  background: rgba(255,255,255,.06); color: var(--s-ink); box-sizing: border-box; }
.fh-form input::placeholder { color: rgba(236,228,244,.5); }
.fh .done { font: 400 var(--h2)/1.3 Fraunces, Georgia, serif; color: var(--s-gold); }
.fh .fail { font: 400 13px/1.4 Inter, sans-serif; color: #F0A8A0; }

.fh .rail { position: absolute; right: max(18px, env(safe-area-inset-right, 0px)); top: 50%; transform: translateY(-50%); z-index: 4; display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; }
.fh .rail button { position: relative; display: block; width: 26px; height: 22px; background: none; border: none; cursor: pointer; padding: 0; }
.fh .rail button::after { content: ""; position: absolute; right: 9px; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: rgba(236,228,244,.32); transition: all .4s; }
.fh .rail button[aria-current="true"]::after { background: var(--s-gold); transform: scale(1.5); }
.fh .rail button span { position: absolute; right: 30px; top: 50%; transform: translateY(-50%); white-space: nowrap; font: 500 11.5px Inter, sans-serif; color: var(--s-ink); opacity: 0; transition: opacity .3s; pointer-events: none; }
.fh .rail button:hover span, .fh .rail button:focus-visible span { opacity: .9; }
.fh .bar { position: absolute; left: 0; top: 0; height: 2px; background: var(--s-gold); z-index: 4; width: 0; }
.fh[data-mode="P"] .rail { display: none; }
.fh[data-mode="L"] .bar { display: none; }

/* the light band: the work itself */
.fh .work { padding-block: clamp(70px, 10vw, 120px) clamp(60px, 8vw, 100px); padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)); }
.fh .work-in { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
.fh .wk { font-size: 11.5px; letter-spacing: .22em; font-weight: 600; color: ${GOLDK}; margin: 0 0 14px; }
.fh .work h2 { font: 400 clamp(32px, 4.4vw, 60px)/1.06 Fraunces, Georgia, serif; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
.fh .work h2 em { color: #6A0CA0; }
.fh .work .lede { font-size: 16px; line-height: 1.65; color: ${MUTED}; max-width: 62ch; margin: 16px 0 0; }
.fh .pgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.fh .pcard { display: flex; flex-direction: column; gap: 12px; min-height: 230px; padding: 24px 22px; border-radius: 6px; background: #fff; border: 1px solid rgba(34,18,51,.1);
  box-shadow: 0 2px 6px rgba(34,18,51,.04), 0 20px 50px rgba(34,18,51,.07); text-decoration: none; color: ${INK}; transition: transform .5s cubic-bezier(.22,.9,.28,1), box-shadow .5s; }
.fh .pcard:hover { transform: translateY(-5px); box-shadow: 0 3px 8px rgba(34,18,51,.06), 0 30px 70px rgba(34,18,51,.13); }
.fh .pcard .pn { font-size: 10.5px; letter-spacing: .24em; font-weight: 600; color: #6A0CA0; }
.fh .pcard .pt { font: 400 21px/1.22 Fraunces, Georgia, serif; text-wrap: balance; }
.fh .pcard .pw { margin-top: auto; }
.fh .split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }
.fh .ins { display: flex; flex-direction: column; gap: 8px; padding: 28px 30px; border-radius: 16px; text-decoration: none; color: ${INK}; background: #F4EEFA; border: 1px solid rgba(106,12,160,.14); transition: border-color .4s; }
.fh .ins:hover { border-color: rgba(106,12,160,.4); }
.fh .ins b { font: 400 24px/1.2 Fraunces, Georgia, serif; }
.fh .ins span { font-size: 14px; line-height: 1.6; color: ${MUTED}; }
.fh .ins i { font-style: normal; font-size: 13px; font-weight: 600; color: #4B0875; margin-top: 6px; }
.fh .foot { border-top: 1px solid rgba(34,18,51,.1); padding-block: 26px; padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)); }
.fh .foot-in { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; font-size: 12.5px; color: ${MUTED}; }
.fh .foot a { color: ${MUTED}; text-decoration: none; } .fh .foot a:hover { color: #4B0875; }
@media (max-width: 900px) { .fh .pgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .fh .split { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .fh .pgrid { grid-template-columns: 1fr; } .fh .pcard { min-height: 0; } }
@media (prefers-reduced-motion: reduce) { .fh .rv, .fh .paper { transition: none; filter: none; } .fh .caret, .fh .cue i { animation: none; } }
`;

const PAPERS = [
  ["001", "The state of the system"],
  ["002", "Young people not in work or education"],
  ["003", "Variation between and within trusts"],
  ["004", "The Year 8 reading check"],
];

export default function Home() {
  const rootRef = useRef(null), runRef = useRef(null), stageRef = useRef(null), canvasRef = useRef(null), barRef = useRef(null);
  const filmRef = useRef(null), emailRef = useRef(null);
  const [scene, setScene] = useState(0);
  const [reg, setReg] = useState("idle"); /* idle | sending | done | failed */

  useEffect(() => {
    const root = rootRef.current;
    const nav = root.querySelector(".nav");
    const setNav = () => root.style.setProperty("--navh", (nav ? nav.offsetHeight : 0) + "px");
    setNav();
    const ro = new ResizeObserver(setNav); nav && ro.observe(nav);
    const film = mountFilm({ root, run: runRef.current, stage: stageRef.current, canvas: canvasRef.current, onScene: setScene });
    filmRef.current = film;
    let hashT = 0;
    if (window.location.hash === "#join") hashT = setTimeout(() => film.goTo("join", 0.15), 250);
    const onScroll = () => {
      const run = runRef.current, r = run.getBoundingClientRect(), D = run.offsetHeight - stageRef.current.offsetHeight;
      const p = Math.max(0, Math.min(1, ((parseFloat(root.style.getPropertyValue("--navh")) || 0) - r.top) / D));
      if (barRef.current) barRef.current.style.width = p * 100 + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => { clearTimeout(hashT); film.destroy(); ro.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  const go = (id, at) => (e) => { e && e.preventDefault(); filmRef.current && filmRef.current.goTo(id, at); };

  async function register(e) {
    e.preventDefault();
    const email = emailRef.current && emailRef.current.value.trim();
    if (!email) return;
    setReg("sending");
    try {
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "register-interest", email }).toString() });
      setReg(res.ok ? "done" : "failed");
    } catch { setReg("failed"); }
  }

  const wm = (size, color = "#F3EEF8", mark = "#C4A4E8") => <Wordmark size={size} color={color} markColor={mark} />;

  return (
    <div className="fh" ref={rootRef} data-mode="L">
      <style>{CSS}</style>
      <SiteNav />

      <div className="fh-run" ref={runRef}>
        <div className="fh-stage" ref={stageRef} data-mode="L">
          <canvas ref={canvasRef} aria-hidden="true" />
          <div className="bar" ref={barRef} />

          {/* 0 · welcome */}
          <section className="scene" data-scene="hero" aria-label="Welcome">
            <div className="cap side">
              <p className="eye rv" data-at="0">The All Saints Institute</p>
              <h1 className="h1 big rv" data-at=".1">Where England&rsquo;s school leaders <span className="soft">come to think.</span></h1>
              <p className="body rv" data-at=".3">A small and serious institute, run from inside an exceptional school. We convene the people who shape schooling, read the national evidence without fear or favour, and build the tools schools use every day.</p>
              <div className="ctas rv" data-at=".45">
                <a className="cta gold hit" href="#join" onClick={go("join", 0.15)}>Register interest</a>
                <a className="cta line hit" href="/film/">Watch the film</a>
              </div>
            </div>
            <div className="cue rv" data-at="1.2" aria-hidden="true">SCROLL<i /></div>
          </section>

          {/* 1 · every school */}
          <section className="scene" data-scene="universe" aria-label="Every school">
            <div className="cap mid">
              <h2 className="h1 rv" data-at=".1">Every school is <em>a universe.</em></h2>
              <p className="body rv" data-at=".35">Hundreds of children. Thousands of decisions. Every single day.</p>
            </div>
          </section>

          {/* 2 · hidden in plain sight */}
          <section className="scene" data-scene="hidden" aria-label="In plain sight">
            <div className="cap top">
              <h2 className="h1 rv" data-at=".1">Most of what matters is hidden <em>in plain sight.</em></h2>
              <p className="body rv" data-at=".35">In spreadsheets, in folders, in systems that never talk to each other. The pupils who need you most sit in the long tail.</p>
            </div>
          </section>

          {/* 3 · what we do */}
          <section className="scene" data-scene="what" aria-label="What we do">
            <div className="cap top">
              <p className="eye rv" data-at="0">What we do</p>
              <h2 className="h1 rv" data-at=".1">The think tank that lives <em>inside a school.</em></h2>
            </div>
            <div className="pl a-t rv" data-at="1.0" data-place="q-top"><b>Convene</b><span>Seminars and the Education Summit</span></div>
            <div className="pl a-l rv" data-at="2.1" data-place="q-right"><b>Develop</b><span>Leadership, built on the maximal gains</span></div>
            <div className="pl a-b rv" data-at="3.2" data-place="q-bottom"><b>Publish</b><span>Position papers and The State of the System</span></div>
            <div className="pl a-r rv" data-at="4.3" data-place="q-left"><b>Build</b><span>Instruments schools use every day</span></div>
          </section>

          {/* 4 · Atlas */}
          <section className="scene" data-scene="atlas" aria-label="Atlas">
            <div className="cap side">
              <p className="eye rv" data-at="0">Instrument 1 of 5</p>
              <h2 className="name rv" data-at=".1">Atlas</h2>
              <p className="h2 rv" data-at=".3">See the whole system.</p>
              <p className="body rv" data-at=".5">Every school in England, mapped and measured. Compare any school with the schools most like it, then ask what it means.</p>
              <div className="pill rv" data-at=".9"><span className="tag">Ask Prism</span><span data-role="ptext" /><span className="caret" /></div>
              <p className="note rv" data-at="3">Answered live from the national dataset</p>
            </div>
          </section>

          {/* 5 · Prizm */}
          <section className="scene" data-scene="prizm" aria-label="Prizm">
            <div className="cap side">
              <p className="eye rv" data-at="0">Instrument 2 of 5</p>
              <h2 className="name rv" data-at=".1">Prizm</h2>
              <p className="h2 rv" data-at=".3">Ask for the report you need.</p>
              <p className="body rv" data-at=".5">Describe it in a sentence. Prizm builds it there and then, ready to read on screen or take into the room.</p>
            </div>
            <div className="frame rv" data-at=".2" data-place="frame">
              <div className="ft"><b>Your report</b><span>BUILT ON REQUEST</span></div>
              <div className="badge">{wm(18)}</div>
            </div>
          </section>

          {/* 6 · Lens */}
          <section className="scene" data-scene="lens" aria-label="Lens">
            <div className="cap side">
              <p className="eye rv" data-at="0">Instrument 3 of 5</p>
              <h2 className="name rv" data-at=".1">Lens</h2>
              <p className="h2 rv" data-at=".3">Know your own school.</p>
              <p className="body rv" data-at=".5">Bring your evidence into one private room. Lens reads it, tests it and tells you the truth. Your data stays yours.</p>
              <div className="chips rv" data-at=".9"><span className="chip on" data-role="c1">Critical friend</span><span className="chip" data-role="c2">Advocate</span></div>
              <p className="stance rv" data-at="1"><span data-role="st1">The honest examiner.</span><span data-role="st2" className="off">Rehearse your strongest case.</span></p>
            </div>
          </section>

          {/* 7 · Orbit */}
          <section className="scene" data-scene="orbit" aria-label="Orbit">
            <div className="cap side">
              <p className="eye rv" data-at="0">Instrument 4 of 5</p>
              <h2 className="name rv" data-at=".1">Orbit</h2>
              <p className="h2 rv" data-at=".3">A plan you can hold in your head.</p>
              <p className="body rv" data-at=".5">No more than three objectives, with clear strategies beneath them. Orbit draws on what Lens has found. The tactics stay yours.</p>
              <ul className="legend rv" data-at="1">
                <li><i style={{ background: "#9648D2" }} />Outcomes for every pupil</li>
                <li><i style={{ background: "#C4A4E8" }} />Teaching of the highest quality</li>
                <li><i style={{ background: "#F3EEF8" }} />Leadership at every level</li>
              </ul>
            </div>
          </section>

          {/* 8 · Constellation */}
          <section className="scene" data-scene="constellation" aria-label="Constellation">
            <div className="cap side">
              <p className="eye rv" data-at="0">Instrument 5 of 5</p>
              <h2 className="name rv" data-at=".1">Constellation</h2>
              <p className="h2 rv" data-at=".3">Every child, live.</p>
              <p className="body rv" data-at=".5">Upload what you already have. Constellation turns it into a living picture of the school, then shows you the pupils slipping out of sight.</p>
              <div className="ccard rv" data-at="6.2">
                <div><b>{CONSTELLATION_COUNTS.serious}</b><span>need attention now</span></div>
                <div><b>{CONSTELLATION_COUNTS.watch}</b><span>to watch</span></div>
                <div><b>Year 10</b><span>example cohort</span></div>
              </div>
            </div>
            {["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"].map((y, k) => (
              <div key={y} className="yl rv" data-at={(0.6 + k * 0.1).toFixed(1)} data-place={"y" + k} data-role={k === 3 ? "y10" : undefined}>{y}</div>
            ))}
          </section>

          {/* 9 · positions */}
          <section className="scene" data-scene="publish" aria-label="Positions">
            <div className="cap side">
              <p className="eye rv" data-at="0">Publish</p>
              <h2 className="h1 rv" data-at=".1">Ideas with <em>evidence</em> behind them.</h2>
              <p className="body rv" data-at=".4">A numbered series of position papers, written by people who run schools and have shaped national policy.</p>
            </div>
            <div className="papers rv" data-at=".3" data-place="papers">
              {PAPERS.map(([n, t]) => (
                <div className="paper" key={n}><span className="pn">POSITION {n}</span><span className="pt">{t}</span><span className="pw"><Wordmark size={15} color="#2A0F40" markColor="#6A0CA0" /></span></div>
              ))}
            </div>
          </section>

          {/* 10 · one system */}
          <section className="scene" data-scene="system" aria-label="One system">
            <div className="cap top">
              <p className="eye rv" data-at="0">One system</p>
              <h2 className="h1 rv" data-at=".1">From insight to action, <em>and back again.</em></h2>
            </div>
            <div className="pl a-l rv" data-at=".6" data-place="n0"><b>Atlas</b><span>See</span></div>
            <div className="pl a-b rv" data-at=".9" data-place="n1"><b>Lens</b><span>Understand</span></div>
            <div className="pl a-r rv" data-at="1.2" data-place="n2"><b>Orbit</b><span>Plan</span></div>
            <div className="pl a-t rv" data-at="1.5" data-place="n3"><b>Constellation</b><span>Act, and see the difference</span></div>
          </section>

          {/* 11 · join */}
          <section className="scene" data-scene="join" id="join" aria-label="Register interest">
            <div className="cap mid">
              <div className="rv" data-at=".1">{wm("clamp(64px, min(10vw, 15vh), 150px)")}</div>
              <p className="h2 rv" data-at=".4">Think, and gain insight.</p>
              <p className="body rv" data-at=".6">Membership opens soon. A small group of founding schools will be invited to join first, chosen for seriousness, not size, and they will shape what the Institute becomes.</p>
              {reg === "done" ? (
                <p className="done rv in">You are on the list. One email when the door opens.</p>
              ) : (
                <form className="fh-form hit rv" data-at=".8" onSubmit={register}>
                  <label htmlFor="fh-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your school email</label>
                  <input id="fh-email" ref={emailRef} type="email" required placeholder="your school email" autoComplete="email" />
                  <button type="submit" className="cta gold" disabled={reg === "sending"} style={{ opacity: reg === "sending" ? 0.6 : 1 }}>
                    {reg === "sending" ? "One moment…" : "Register interest"}
                  </button>
                </form>
              )}
              {reg === "failed" && <p className="fail">That did not go through. Try again, or write to hello@institute.school.</p>}
              {reg !== "done" && <p className="small-caps rv" data-at="1" style={{ letterSpacing: ".08em", textTransform: "none" }}>One email when the door opens. Nothing else.</p>}
            </div>
          </section>

          <ol className="rail" aria-label="Chapters">
            {SCENES.map((s, k) => (
              <li key={s.id}><button type="button" aria-current={k === scene ? "true" : "false"} aria-label={s.name} onClick={go(s.id)}><span>{s.name}</span></button></li>
            ))}
          </ol>
        </div>
      </div>

      {/* the work itself, in daylight */}
      <section className="work" aria-labelledby="work-h">
        <div className="work-in">
          <div>
            <p className="wk">READ OUR WORK</p>
            <h2 id="work-h">The thinking is <em>published.</em></h2>
            <p className="lede">Every paper is anchored in national data and written in plain English. Every figure can be interrogated live.</p>
          </div>
          <div className="pgrid">
            {PAPERS.map(([n, t]) => (
              <Link className="pcard" key={n} to="/positions">
                <span className="pn">POSITION {n}</span>
                <span className="pt">{t}</span>
                <span className="pw"><Wordmark size={15} color={INK} markColor="#6A0CA0" /></span>
              </Link>
            ))}
          </div>
          <div className="split">
            <Link className="ins" to="/insights">
              <b>The State of the System</b>
              <span>How intake shapes outcomes across every school in England, drawn as it is.</span>
              <i>Open Insights &rarr;</i>
            </Link>
            <Link className="ins" to="/insights#dynamic" style={{ background: "#fff", border: "1px solid rgba(34,18,51,.1)" }}>
              <b>Dynamic Schools</b>
              <span>The schools improving fastest, before and after the pandemic.</span>
              <i>See the schools &rarr;</i>
            </Link>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-in">
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: INK }}><Wordmark size={17} /></span>
          <Link to="/insights">Insights</Link>
          <Link to="/positions">Positions</Link>
          <a href="/film/">The film</a>
          <Link to="/signin">Member sign in</Link>
          <span style={{ flex: 1 }} />
          <span>The All Saints Institute &middot; a trading subsidiary of All Saints Catholic College &middot; &copy; 2026</span>
        </div>
      </footer>
    </div>
  );
}
