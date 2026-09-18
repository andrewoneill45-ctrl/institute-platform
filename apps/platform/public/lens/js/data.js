/* =========================================================
   All Saints Catholic College – Inspection Hub
   Central data file. Sources: SEF (July 2026), SIMS (06/07/26),
   IDSR URN 100503, ASCC Results Overview since 2023, GCSE 2025
   analysis, Y11 Spring Mock analysis 25-26, Y10 Lenten Overview
   2026, KS3 Progress Overview 2025-26.
   ========================================================= */

var ASCC = {

  school: {
    name: "All Saints Catholic College",
    motto: "Orare · Laborare · Servire",
    mottoMeaning: "To pray, to work, to serve",
    urn: "100503",
    la: "Kensington & Chelsea (RBKC)",
    address: "75 St Charles Square, London W10 6EL",
    type: "Voluntary Aided Catholic secondary, 11–16, mixed, non-selective",
    lastOfsted: "Outstanding in every category (previous framework)",
    inspection: "Renewed framework inspection · 7–8 July 2026"
  },

  context: {
    onRoll: 896,
    years: "Year 7 – Year 11",
    byYear: { y7: 192, y8: 184, y9: 179, y10: 180, y11: 161 },
    fsm: { pct: 44.25, n: 396 },
    pp: { pct: 39.33, n: 352 },
    eal: { pct: 44.36, n: 397 },
    medical: { pct: 28.83, n: 258 },
    sen: { pct: 22.01, n: 197 },
    ehcp: { pct: 9.83, n: 88 },
    senK: { pct: 12.18, n: 109 },
    fsm6: 41.8,
    localFsm6: 60.4,
    ehcpTrend: [ ["2023", 6.0], ["2024", 7.4], ["2025", 8.6] ],
    idaci: "Top quintile of deprivation nationally (IDACI)",
    senNeeds: [
      ["Autistic Spectrum Disorder", 82], ["Speech, Language & Communication", 46],
      ["Social, Emotional & Mental Health", 46], ["Moderate Learning Difficulty", 21],
      ["Specific Learning Difficulty", 20]
    ],
    keyLine: "A school in the top quintile of deprivation nationally, with well-above-average FSM6, EAL, SEND and a rising EHCP rate – achieving outcomes significantly above national averages for three consecutive years."
  },

  /* ---------- SEF: the eight evaluation areas ---------- */
  sef: [
    {
      id: "safeguarding", area: "Safeguarding", grade: "Met", scale: "met",
      headline: "Safeguarding is Met. An external Whole School Safeguarding Review (January 2026) found strong leadership, culture, governance oversight, pupil voice, records management and curriculum; the DSL produced an action plan within a month.",
      evidence: [
        "January 2026 external Whole School Safeguarding Review + February 2026 Safeguarding Action Plan – both ready to show on demand. The audit called the evidence base “exemplary” and described a culture of “always striving to be better”.",
        "Immediate concerns from the review already actioned; remaining actions tracked and ongoing.",
        "All 145 staff trained (KCSIE annual, Prevent, online safety, FGM); 12 Level 3-trained DSL/DDSLs; compliant, audited Single Central Record; every member of staff knows the 5 Rs.",
        "Culture is verifiable: pupil voice confirms all children know who to talk to; CPOMS evidences rapid follow-up, including appropriately challenging social care; Securus monitors digital safety; monthly online-safety newsletters reach every family.",
        "System leadership: the DSL audited a Westminster primary's safeguarding (June 2026) and spoke at a national attendance conference – practice strong enough that other schools borrow it. See the full culture picture on the Attendance tab.",
        "Parent voice is unanimous: 100% of surveyed parents (82/82, Y7 and Y10) say their child feels safe at school; 99% say the school promotes a safe and respectful environment."
      ],
      development: ["Persistent absence (20.9%) as a safeguarding-adjacent priority."],
      priorities: [
        ["Home visit for every severely absent pupil this half-term, logged on CPOMs", "Attendance & Safeguarding / HOY / HOKS", "July 2026"],
        ["Refresh all staff on CME & Early Help escalation triggers", "Attendance & Safeguarding", "July & Sept 2026"],
        ["Update CP&S Policy with Jan audit notes + KCSIE; cross-reference Attendance Policy", "DMG", "Sept 2026"]
      ]
    },
    {
      id: "inclusion", area: "Inclusion", grade: "Exceptional", scale: 5,
      headline: "An ambitious learning environment for pupils with additional needs that allows them to make good progress, develop their character, and gives parents genuine confidence in choosing All Saints.",
      evidence: [
        "Robust Y6 transition & initial assessment with primary SENCos and parents; every pupil has a support plan / pupil passport shaping department planning.",
        "SEN referrals tracked with CAMHS liaison and access-arrangement documentation; 2 successful EHCP applications this year – swift, accurate identification of need.",
        "2024 Progress 8: EHCP pupils +0.07, SEN Support +0.13 – positive progress in a school with well-above-average need.",
        "Deliberate resourcing: Deputy SENCo, Bethlehem Centre, Romero Centre ('keeping up, not catching up'), enhanced Attendance team.",
        "A mapped offer of 50+ provisions, all at £0 to families, with measured impact: Fresh Start pupils reading sounds up to 3× faster; Galilee literacy gains of 27–44 percentage points; NHS-target 1:1 speech therapy for 17 EHCP pupils – see the dedicated SEND tab.",
        "The SEN Homework Club reaches the hardest overlap – all 33 attendees are Pupil Premium – and its behaviour-log evidence shows negative incidents down 38.5% across the year, with the low- and high-engagement cohorts improving independently (−42.3% / −35.0%). 75% of Thinking Reading pupils met their age-expected reading age this year. See Reading, Literacy & Numeracy."
      ],
      development: [
        "Some books don't always show the intended sequence; some pupils struggle to articulate prior learning – tracked with targeted plans.",
        "Inconsistency in how confidently some teachers probe understanding and adapt in the moment for pupils with SEND."
      ],
      exceptional: [
        ["Test 1 – Exceptionally high standards, sustained", "Need has risen every year (EHCP 6.0% → 7.4% → 8.6%, now 9.8%) and provision has scaled ahead of it: Bethlehem and Romero Centres, Deputy SENCo, graduate ASAs, a 50+ provision map – every intervention dated, staffed, reviewed and free to families. Identification starts before arrival (Y6 SENCo transition, passports for all) and has been the model for years, not months."],
        ["Test 2 – Transformational impact on disadvantaged pupils, those with SEND and those facing other barriers", "EHCP pupils attend 9.13 points above the national EHCP figure. EHCP and SEN Support pupils made positive Progress 8 in 2024 (+0.07 / +0.13). Intervention impact is measured per pupil: Fresh Start recall up to 3× faster, Galilee +27–44 percentage points, NHS-target speech therapy delivered weekly. Only 2 of 59 off-site directions involved EHCP pupils – complex needs stay in mainstream. These pupils achieve and thrive – the toolkit's own words, evidenced."],
        ["Test 3 – No significant area unaddressed", "The SEN Support attainment slide is named, owned (adaptive-teaching CPD from September, provision-mapped interventions with pre/post measures) and answered at capital scale by Emmanuel – £400k secured against a data-triangulated case. Book consistency and in-the-moment adaptation carry named owners and half-termly checkpoints."]
      ],
      priorities: [
        ["Adaptive teaching on every teacher's agenda from the outset", "BHO", "Half-termly checkpoints"],
        ["Maintain exceptional teaching standards in the Bethlehem Centre", "BHO / new KPI appointment", "Bi-weekly checkpoints"],
        ["Robust, systematic process for prompt identification of need", "BHO / LPA", "Half-termly checkpoints"],
        ["Romero Centre as a 'keeping up, not catching up' provision", "BHO / RWI", "Half-termly checkpoints"]
      ],
      eef: [
        { strand: "Teaching assistant interventions", impact: "+4 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/teaching-assistant-interventions", action: "Bethlehem & Romero Centre staff deliver structured, trained interventions – the model EEF finds effective, not generic in-class support." },
        { strand: "Small group tuition", impact: "+4 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition", action: "Romero Centre 'keeping up, not catching up' provision runs on small-group teaching." },
        { strand: "Individualised instruction", impact: "+4 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/individualised-instruction", action: "Pupil passports shape department planning; adaptive teaching strand in every SoW." }
      ]
    },
    {
      id: "curriculum", area: "Curriculum & Teaching", grade: "Strong", scale: 4,
      headline: "An ambitious curriculum for every pupil, coherently sequenced so knowledge and foundational skills build securely over time, delivered through consistently strong, responsive teaching – despite significantly higher-than-average disadvantage, SEND and EHCPs.",
      evidence: [
        "Curriculum Pillars (fully implemented from September) and the coaching-based 'Active Ingredients' model give every subject a consistent, evidence-informed approach – 54 teachers wrote narrative self-reflections this year and 40 hold coached personal targets, 45% freely choosing adaptive teaching, the school's own named priority (see Staff Development tab).",
        "Curriculum Progress Reviews (CPR) keep Schemes of Work live and continually refined.",
        "Teaching quality is codified, not assumed: the T&L Handbook ('The All Saints Way', v2) sets out the four-layer framework – Pillars, seven research-cited Active Ingredients, coaching, and five daily classroom entitlements (cold calling done properly, the 4Ts of live feedback, R.E.A.D.S for reading) – the shared language every drop-in and book look reads against. See the Staff Development tab.",
        "Implementation is provable at pupil level: KS3 revision-panel pupils describe make–do–review, shadow papers and retrieval practice unprompted – the handbook's language coming out of children's mouths.",
        "Whole-school T&L average 2.08; 80% of lesson drop-in statements rated expected or strong.",
        "2024 outcomes prove the curriculum is landing: Progress 8 +0.69 vs −0.03 national; Attainment 8 5.39 vs 4.59 national.",
        "Parents agree: 100% satisfied with the quality of teaching (76% 'very satisfied'); 96% say their child is appropriately challenged (Y7 & Y10 surveys, n=82).",
        "Reading is everyone's job – and provably understood: 59 staff across every department completed 'Unlocking Reading' Modules 1+2 with an average quiz score of 92% (81% scored 9 or 10/10); 100% correctly identified the Science of Reading's purpose and 98% that their role is to explicitly teach and model reading within their subject.",
        "And the reading number is now moving: summer 2026 matched-pupil tests show Years 7 and 10 at or above the national mean SAS of 100 (Y7 97.8 → 99.0; Y10 100.2 → 101.6), Y10 'expected & above' up 6.8 points in a year, 75% of Thinking Reading pupils meeting age-expected reading age, 100% of PP pupils on the Y10 English intervention maintaining or improving – and SORA e-book check-outs nearly doubled (254 → 487). See the Reading, Literacy & Numeracy tab.",
        "National recognition: Headteacher appointed Schools Policy and Delivery Adviser to the Secretary of State; senior leaders invited to speak externally on teaching and learning."
      ],
      development: [
        "Autumn 2025: 54% of pupils below or significantly below age-related reading expectations – Y7 Fluency Pilot, Thinking Reading and a new literacy committee address this from 2026. Summer 2026 matched tests show the first movement (Y7 & Y10 mean SAS at/above 100); Y8 (60 pupils still to test) and Y9 (summer test pending) are the honest gaps in the picture.",
        "SEN and disadvantaged attainment gap remains live – SoW updated with an explicit adaptive-teaching strand.",
        "24% of teaching staff are ITTs or ECTs – some KS3 inconsistency, addressed through coaching and CPD."
      ],
      gradeRationale: "Why Strong and not yet Exceptional – held deliberately: the toolkit's Strong standard ('consistently strong, responsive teaching') is comfortably evidenced – arguably exceeded on process: a codified handbook, a coaching cycle where 45% of teachers chose the school's own priority, whole-staff reading CPD at 92%, pupils speaking the pedagogy unprompted, 100% parent satisfaction with teaching. What blocks Exceptional is impact data we will not argue around: 54% below age-related reading, the SEN Support attainment slide, English Language at −0.54, KS3 consistency with 24% early-career staff. THE ROUTE TO EXCEPTIONAL IS NAMED: % reading at/above age-related rising through 2026–27 (tests each term), SEN K A8 recovering against the 3.49 baseline, English Language and Science residuals improving at GCSE 2026, and KS3 on-track consistency holding through the autumn. The first of those is already moving – summer 2026 matched tests put Y7 and Y10 mean SAS at or above 100, with Y10 'expected & above' up 6.8 points (see Reading, Literacy & Numeracy). When the rest move, this grade moves – reviewed January 2027. Calibration here is what makes our Exceptional grades credible everywhere else.",
      priorities: [
        ["Embed ASCC Pillars in every Scheme of Work, including oracy", "CDA / NGI / JAN", "July, Sept & Dec 2026"],
        ["Raise consistency & quality of books (presentation, live feedback, pupil response)", "CDA / NGI / JAN", "Sept, Nov & Jan"],
        ["Strengthen adaptive teaching for SEND, disadvantaged and LPA pupils", "NGI / BHO / JAN", "CPD Sept; reviewed Oct–Jan"],
        ["Increase % of pupils reading at/above age-related expectations", "NGI / LOS / JST", "Reading tests through the year"]
      ],
      eef: [
        { strand: "Metacognition & self-regulation", impact: "+8 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation", action: "The Active Ingredients coaching model builds explicit modelling, questioning and responsive teaching – the highest-impact strand in the Toolkit (upgraded May 2025)." },
        { strand: "Reading comprehension strategies", impact: "+7 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/reading-comprehension-strategies", action: "Thinking Reading and explicit comprehension strategies target the 54% below age-related expectations (upgraded May 2025)." },
        { strand: "Oral language interventions", impact: "High impact", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions", action: "Oracy written into every Scheme of Work as a Curriculum Pillar; ASCC is an Oracy Education Commission case study." },
        { strand: "Feedback", impact: "+6 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback", action: "Live feedback and pupil response is a named book-quality priority, verified through SLT scrutiny." },
        { strand: "Phonics", impact: "+5 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics", action: "Y7 Fluency Pilot applies decoding & fluency evidence for older struggling readers." }
      ]
    },
    {
      id: "achievement", area: "Achievement", grade: "Exceptional", scale: 5,
      note: "To confirm once 2026 outcomes are published",
      headline: "Despite significantly higher-than-average disadvantage, SEND and EHCPs, pupils achieve highly and consistently – outcomes for disadvantaged pupils sustained above national averages for three years running.",
      evidence: [
        "2024 Progress 8 +0.69 vs −0.03 nationally; the majority of measures significantly above national for three consecutive years.",
        "Disadvantaged pupils 2024 Progress 8 +0.26 vs −0.57 national – sustained in a context of well-above-average deprivation.",
        "2025 (SISRA est.): A8 5.13 vs 4.61 national; P8 estimate +0.76; 2026 prediction: A8 5.01, P8 +0.74, 82% 4+ English & Maths.",
        "Assessment used intelligently at KS3/KS4 (data drops, reading data, Bedrock SAS) to trigger targeted, evaluated intervention.",
        "Work beyond the lesson is engineered, not exhorted: Compulsory Study (extended day) for targeted PP pupils cut homework-related negative logs 49.2% across the year (80% of tracked pupils improved), and the SEN Homework Club – every attendee Pupil Premium – cut negative incidents 38.5%, with both engagement cohorts improving independently. Maths runs a tiered foundational-numeracy model (two-stage baseline, nurture reteaching written into the SoW, exit-on-impact intervention) with case-level GCSE gains. See Reading, Literacy & Numeracy."
      ],
      development: [
        "In-school gap between disadvantaged and non-disadvantaged has widened over two years even though disadvantaged pupils remain above national – adaptive teaching, attendance and targeted intervention are the levers.",
        "SEN K attainment has fallen since 2023; EHCP outcomes in 2025 affected by a very small, complex cohort (n=5–10)."
      ],
      exceptional: [
        ["Test 1 – Exceptionally high standards, sustained", "The majority of measures significantly above national for three consecutive years: Progress 8 +0.12 → +0.69 → +0.76* against a national of −0.03; Attainment 8 above 5.0 for two published years (5.39 vs 4.59); 4+ English & Maths held at 74–75% vs 65% national – while the cohorts' KS2 priors fell year on year (105.5 → 101.5). Standards sustained against a weakening intake is the strong form of 'sustained'."],
        ["Test 2 – Transformational impact on disadvantaged pupils and those facing barriers", "Disadvantaged Progress 8 above the national disadvantaged figure for three consecutive years – and in 2024 our disadvantaged pupils outperformed national NON-disadvantaged pupils (+0.26 vs +0.16). In a top-quintile deprivation school where 44% are FSM, that is the toolkit's 'achieve and thrive', delivered at whole-cohort scale."],
        ["Test 3 – No significant area unaddressed", "LPA outcomes, Science VA, the in-school disadvantaged gap and SEN Support attainment each carry a named owner, milestone and success measure – several already reviewed in July 2026. The grade is held pending published 2026 outcomes: we will confirm it against results, not hope."]
      ],
      priorities: [
        ["Improve outcomes for Lower Prior Attainers", "JAN / CDA / NGI", "July 2026 & Jan 2027"],
        ["Improve Science outcomes (target VA +0.3 or better)", "JAN / GSH", "Jan 2027"],
        ["Clearer tracking of intervention impact", "JAN", "Trial July 2026, expand Sept"],
        ["Clear expectations for work completed outside lessons", "JAN / CDA / BFO", "Oct & Jan checkpoints"]
      ],
      eef: [
        { strand: "Small group tuition", impact: "+4 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/small-group-tuition", action: "Year 11 intervention programmes run as targeted small groups triggered by data drops." },
        { strand: "One to one tuition", impact: "+5 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/one-to-one-tuition", action: "Individual tuition deployed for borderline English & Maths pupils identified by mock analysis." },
        { strand: "Oral language interventions", impact: "High impact", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions", action: "Pre-teaching of Tier 3 vocabulary (Bedrock) closes the vocabulary gap before it becomes an attainment gap." },
        { strand: "Homework (secondary)", impact: "+5 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/homework", action: "Clear expectations for work completed outside lessons – a named priority to January 2027." }
      ]
    },
    {
      id: "attendance", area: "Attendance", grade: "Strong", scale: 4,
      headline: "Rigorous systems have driven sustained attendance improvement over two years; overall attendance is now above both the national average and similar schools despite a high-deprivation context.",
      evidence: [
        "92.41% (FFT, to 22 May 2026) – above FFT national (91.63%, +0.78) and well above similar FSM6 schools (90.19%, +2.22).",
        "Improvement is more than double the DfE Attendance Baseline Improvement Expectation (2.21% actual vs 0.5% minimum).",
        "FSM6 pupils attend at 88.46% (+1.70 vs national); EHCP pupils at 90.03% (+9.13 vs national) – the culture works for the pupils who need it most.",
        "Pre-pandemic recovery nearly complete: 92.41% vs 92.6% in 2018/19 – ahead of most similar schools."
      ],
      development: [
        "Year 11 attendance 2.17 points below national (3.17 in spring), 7% severely absent – exam pressure, anxiety and a small number of entrenched cases predating current systems.",
        "SEN Support pupils attend at 84.44% (−2.32 vs national) – the most complex-needs cohort; 14.3% of pupils on SEN Support vs 13.4% nationally.",
        "Known DfE data discrepancies (see Appendix A) being resolved with DfE / SIMS / Class Charts – explanation ready."
      ],
      gradeRationale: "Why Strong and not yet Exceptional – held deliberately: above national, above similar schools, improvement at four times the DfE expectation, and transformational for EHCP pupils (+9.13). But persistent absence at 20.9%, Y11 below national and SEN Support at 84.44% are live gaps we will not grade around. The trajectory – and the enrichment engine behind it (+7.2 for club members) – is the Exceptional case for next year; this year we grade what the data shows.",
      priorities: [
        ["Audit every incoming Y11 below 90% attendance, categorised by cause", "DMG", "June 2026"],
        ["Contact all Y10 PA/SA families before September; Attendance Contracts agreed", "DMG / HOKS / HOY", "July 2026"],
        ["SEN Support attendance ≥87.5% and PA <35% by Jan 2027", "DMG / BHO / LPA", "September 2026"],
        ["Whole-school Persistent Absence below 20% by Jan 2027", "DMG / HOKS / HOY / Tutors", "October half-term review"]
      ],
      eef: [
        { strand: "Parental engagement", impact: "Updated May 2025", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/parental-engagement", action: "Attendance Contracts agreed with families, home visits and named contacts – attendance work built on the parental-engagement evidence base." }
      ]
    },
    {
      id: "behaviour", area: "Behaviour", grade: "Exceptional", scale: 5,
      headline: "Suspensions below national average and down 43.9% from the 2023–24 peak, permanent exclusions at zero (7 → 3 → 2 → 0 over four years), and a calm, purposeful environment day to day – sustained direction of travel, not a single good year.",
      evidence: [
        "Suspension rate 2.88 per 100 pupils vs national 3.72; suspensions 319 (2023–24 peak) → 183 → 143 (HT1–5) – a 43.9% sustained reduction, on course for the lowest full-year total in the dataset.",
        "Permanent exclusions 7 → 3 → 2 → 0 across four years – below national average; every past PEX involved a serious safeguarding risk (drugs, a weapon, serious assault) after prior intervention.",
        "8.3% of the cohort suspended this year vs ~17% in 2023–24; days lost to suspension down 61% from the peak; repeat-suspension rate down from 77.9% to a stable 67.0%.",
        "Graduated system: Emmaus Centre internal provision and 59 short reciprocal off-site directions (1–5 days, formal agreements with Kensington Aldridge Academy and Holland Park, parents always consulted) as the alternatives that made zero PEX possible; every suspension authorised by the Headteacher (SENCo/DSL joining where relevant) and followed by a reintegration meeting.",
        "Year 11 suspensions fell from 18 in HT1 to 4 by HT5 within this year; low-level behaviour resolved without escalation.",
        "The community feels it: 100% of parents say the school promotes a safe and respectful environment (81/82); 91% of the pupil panel agree the school encourages kindness and respect."
      ],
      development: [
        "Year 9 (9.4%) and Year 11 (11.7%, improving) suspension rates elevated vs Y7 (2.8%) and Y10 (4.4%) – a known national pattern for Y9.",
        "Suspension disproportionality: FSM pupils, boys, EHCP pupils and Black Caribbean pupils suspended at higher rates than peers – named priorities with plans due by end of this half-term."
      ],
      exceptional: [
        ["Test 1 – Exceptionally high standards, sustained", "Not one good year but four coherent ones: permanent exclusions 7 → 3 → 2 → 0; fixed-term suspensions down 43.9% from the 2023–24 peak and sustained; internal lesson removals falling every year for four years (−33%) while the roll grew 41% – per-pupil removals halved. Daily climate: 99,194 achievement points to 34,320 incidents, roughly 3:1 positive."],
        ["Test 2 – Transformational impact on vulnerable pupils", "The graduated system exists precisely for pupils with the greatest barriers: internal provision and 59 short reciprocal off-site directions keep pupils in education rather than excluded – only 2 involved EHCP pupils, and zero pupils were permanently excluded this year in a school with well-above-average SEND and FSM. Repeat suspension triggers a provision review, not a repeat sanction. The pupils national data expects to be excluded are, here, retained and re-integrated."],
        ["Test 3 – No significant area unaddressed", "Suspension disproportionality (FSM, boys, EHCP, Black Caribbean) was self-identified through our own analysis – not raised externally – with named owners and plans due end of HT6, reviewed HT1/HT2. Y9 and Y11 elevation is tracked, with Y11 already falling 18 → 4 within the year."]
      ],
      priorities: [
        ["Update suspension/internal monitoring and flagging system", "BFO", "New system for September"],
        ["Address Black Caribbean suspension disproportionality", "BFO / MEH / DHA", "Plan end HT6; reviewed HT1/HT2"],
        ["Monitor and address male over-representation in suspensions", "BFO / MEH / DHA", "End of HT6"],
        ["Reduce EHCP suspension rate through enhanced support", "BFO / MEH / DHA / BHO / LPA", "Ongoing"],
        ["Strengthen restorative/reintegration package", "BFO / MEH / SIG", "End of HT6"]
      ],
      eef: [
        { strand: "Behaviour interventions", impact: "Updated May 2025", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/behaviour-interventions", action: "EEF finds targeted approaches for persistent cases most promising – exactly our model: consistent whole-school policy plus enhanced support for the small group driving most incidents." },
        { strand: "Social & emotional learning", impact: "Updated May 2025", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/social-and-emotional-learning", action: "The restorative reintegration package for suspended pupils builds SEL skills rather than relying on sanction alone." }
      ]
    },
    {
      id: "personal", area: "Personal Development & Well-being", grade: "Exceptional", scale: 5,
      note: "Confirmed by the Headteacher, July 2026",
      headline: "A rich, deliberate personal development offer – enrichment, Elev:8, careers and character – reaches every pupil including the disadvantaged, with participation tracked pupil-by-pupil and impact evidenced at scale. The DfE's enrichment framework and the refreshed Gatsby benchmarks both arrived after this school already met them.",
      evidence: [
        "Every pupil attends at least 4 trips a year (2 Curriculum Enhancement Days, 2 Activity Days) plus whole-school celebration days (Culture, All Saints, Feast, Sports).",
        "All 8 DfE Enrichment Framework benchmarks met (framework published June 2026 – our provision predates it). 404 pupils (45% of roll) in clubs, 3,695 logged attendances, 84% sustaining participation across the year.",
        "Enrichment is the engine of attendance: club members attend school at 94.5% vs 87.3% for non-members – +9.4 points for PP members and +12.1 for SEN members.",
        "Elev:8 is transformational and measurable: 91% of the whole Year 8 cohort in clubs – the national 'dip' year is now our most engaged year group.",
        "Participation tracked (EVOLVE trip attendance, Class Charts club 'stars') with PP/SEN/EAL flags – disadvantaged pupils demonstrably access the same offer.",
        "Voice data at scale: 94% of 416 Culture Day respondents said the day made them feel they belong to the All Saints community; 99% of parents call the enrichment offer valuable; 91% of the pupil panel agree the school encourages kindness, respect and helping others."
      ],
      development: [
        "Careers/PSHCE staffing has been inconsistent historically – now substantially answered: five complete PSHE schemes of work (173 sequenced lessons, Y7–11, misconception-led, pillar-tagged, termly-assessed – see the Curriculum tab), Compass+ run twice with identical scores (92% average), 30 events logged and delivered, tracking live. KS3 curriculum-careers embedding (Gatsby BM4, 75%) is the named remaining gap, with careers-tagged PSHE lessons now in every year's scheme.",
        "Confidence that every pupil (not just Student Leaders) can articulate British Values fluently needs strengthening, particularly in Year 9.",
        "The Exceptional case in one line: all 8 DfE enrichment benchmarks met before the framework existed; 45% of roll in tracked clubs at PP/SEN parity; Elev:8 inverted the national Y8 dip (91% participation); Gatsby 100% on personal guidance and needs-of-each-pupil; 94% belonging from 416 pupil voices; 99% of parents value the offer. Transformational for disadvantaged pupils – with receipts."
      ],
      exceptional: [
        ["Test 1 – Exceptionally high standards, sustained", "The toolkit's Strong wording – 'an entitlement for every pupil… leaders track participation… including disadvantaged pupils and those with SEND' – is not just met but exceeded: all 8 DfE enrichment benchmarks met on publication day; Gatsby at 92% on two identical Compass+ runs, with 100% on personal guidance and needs-of-each-pupil; 30 dated careers/PSHCE events delivered including a whole-cohort work experience week; every pupil guaranteed 4+ trips a year; Student Ambassadors giving pupil voice a structured route into provision. An entitlement architecture, sustained across years – not an events calendar."],
        ["Test 2 – Transformational impact on disadvantaged pupils", "Participation is tracked pupil-by-pupil and reaches near-parity: PP pupils 34% of club members (39% of roll), SEN 21% (22%). Club membership is associated with +7.2 points of school attendance (+12.1 for SEN members). Aspiration programmes are reserved for disadvantage: Brilliant Club at 70% disadvantaged ending in an Oxford graduation, EY Foundation and Girls' Network PP-only, Aquinas stretch at 24.5% PP. Elev:8 turned the national disengagement year into our most-engaged cohort (91%). And the community confirms it: 94% of 416 pupils felt they belong; 99% of parents value the offer."],
        ["Test 3 – No significant area unaddressed", "The two named gaps – KS3 curriculum-careers embedding (Gatsby BM4) and universal British Values articulation – are dated, owned (RFU/careers lead; DWI/NKE) and scheduled into September's Schemes of Work. Found by our own evaluation, twice."]
      ],
      priorities: [
        ["Consistent PSHCE delivery in form time; planned careers programme per year group", "RFU / careers lead", "Live for Sept"],
        ["Embed British Values language and student voice opportunities", "DWI / NKE", "Begin ASAP"],
        ["Track the impact of every trip, event and programme", "DWI / RFU", "Live from Sept"],
        ["Strengthen whole-school mentoring system", "DWI / MWI", "Centralised tracking"]
      ],
      eef: [
        { strand: "Extending school time", impact: "Updated May 2025", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/extending-school-time", action: "The extended enrichment day is structured and enriched – the conditions EEF identifies for extended time to pay off – and we innovated here before most of the sector." },
        { strand: "Arts participation", impact: "+3 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/arts-participation", action: "Schola Cantorum, music tech, drama and arts clubs give every pupil sustained arts participation." },
        { strand: "Physical activity", impact: "Updated May 2025", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/physical-activity", action: "Daily sport and activity within the extended day – wellbeing and engagement benefits beyond attainment." },
        { strand: "Social & emotional learning", impact: "Updated May 2025", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/social-and-emotional-learning", action: "Elev:8 develops character, confidence and self-regulation deliberately, not incidentally." }
      ],
      phrases: ["Opportunity is planned, not left to chance", "Every pupil, especially the disadvantaged, gets the enrichment", "We look after our staff so they can look after our pupils"]
    },
    {
      id: "leadership", area: "Leadership & Governance", grade: "Exceptional", scale: 5,
      headline: "Exceptionally high standards of leadership and governance sustained over time: leaders at every level drive improvement across every evaluation area, with transformational impact on disadvantaged pupils, those with SEND, and those facing other barriers.",
      evidence: [
        "The Strong-standard foundation is exceeded, not just met: 'leaders use their detailed and insightful analysis of school performance to evaluate the effectiveness of their provision' – this portal, the SEF and the named-owner priority architecture are that analysis, made visible.",
        "Staff expertise as the driver of improvement: the Active Ingredients cycle (54 reflections, 40 coached targets, 45% choosing the school's own priority) plus whole-staff reading training at 92%.",
        "Workload managed by named trade-off, not policy sentiment: subject leader and SLT coaching meetings reduced, subject leads protected from Activities Week for scheme-of-work development, the SLT duty rota adjusted to release senior time – decisions with names and dates.",
        "External validation: Headteacher appointed Schools Policy and Delivery Adviser to the Secretary of State; leaders present through the DfE system-leadership network, the IRIS Connect CPD Exchange and the CST SEND & Inclusion Conference; Headteachers' Roundtable co-chair; Secondary Headteacher of the Year (Pearson National Teaching Awards)."
      ],
      exceptional: [
        ["Test 1 – “Exceptionally high standards of leadership and governance have been sustained … leading to continued improvement and/or sustained high standards in all areas of the school's work.” (toolkit wording)", "Sustained across every domain at once: outcomes above national three consecutive years; attendance above national and similar schools after two years of improvement; PEX 7 → 3 → 2 → 0 and internal removals falling four straight years through 41% roll growth; safeguarding audited 'exemplary'. Every evaluation area in this SEF independently self-assesses Strong or Exceptional, each with its own live action plan – leadership impact across the whole school's work, not one strong department carrying the picture."],
        ["Test 2 – “Leaders' actions have a transformational impact on the outcomes and experiences of disadvantaged pupils, those with SEND … and those who may face other barriers. These pupils achieve and thrive.” (toolkit wording)", "Disadvantaged P8 above national disadvantaged three years running (2024: +0.26 vs −0.57, beating national non-disadvantaged); FSM6 attendance +1.70 and EHCP attendance +9.13 above national; deliberate resourcing – Bethlehem, Romero, ASAs, £400k Emmanuel – reallocating capacity to exactly the pupils the toolkit names; a monitored enrichment entitlement at PP/SEN parity. Achieve AND thrive, both evidenced."],
        ["Test 3 – “There are no significant areas for improvement that leaders have not already prioritised.” (toolkit wording)", "Every weakness named anywhere on this portal – reading, the disadvantaged gap, SEN K attainment, Y11 attendance, suspension disproportionality, KS3 careers embedding – carries a named owner, milestone and success measure, most identified by our own analysis before anyone external asked. Nothing is sitting unaddressed."]
      ],
      development: [
        "Gather 2–3 concrete, named examples of governance challenge and leader response – ready to cite with dates and outcomes.",
        "Hold the Exceptional self-assessment against 2026 outcomes when published."
      ],
      priorities: [
        ["Named examples of governance challenge ready to cite", "Headteacher / Chair of Governors", "Before first call"],
        ["Leadership 'opening 60–90 seconds' script agreed and rehearsed with SLT", "Headteacher", "Before first call"],
        ["Confirm Exceptional grade against 2026 outcomes", "SLT", "Autumn 2026 review"]
      ],
      eef: [
        { strand: "Effective Professional Development (guidance report)", impact: "Guidance", url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/effective-professional-development", action: "The Active Ingredients coaching cycle mirrors the EEF's PD mechanisms: build knowledge, motivate, develop techniques, embed practice." },
        { strand: "EEF tiered Pupil Premium model", impact: "Guidance", url: "https://educationendowmentfoundation.org.uk/guidance-for-teachers/using-pupil-premium", action: "PP strategy follows the EEF tiers: quality-first teaching, targeted academic support, wider strategies (attendance & enrichment)." }
      ]
    }
  ],

  /* ---------- Results & trends ---------- */
  results: {
    wholeSchool: [
      { year: "2023", em4: 74, em4Nat: 65, em5: 46, em5Nat: 45, a8: 4.90, a8Nat: 4.63, p8: 0.12, p8Nat: -0.03 },
      { year: "2024", em4: 75, em4Nat: 65, em5: 62, em5Nat: 46, a8: 5.39, a8Nat: 4.59, p8: 0.69, p8Nat: -0.03 },
      { year: "2025*", em4: 75, em4Nat: 65, em5: 54, em5Nat: 45, a8: 5.13, a8Nat: 4.61, p8: 0.76, p8Nat: null },
      { year: "2026 pred", em4: 82, em4Nat: null, em5: 54, em5Nat: null, a8: 5.01, a8Nat: null, p8: 0.74, p8Nat: null }
    ],
    resultsNote: "2025 figures are internal SISRA estimates, not yet published or externally verified – presented to inspectors as provisional alongside confirmed 2023/2024 published data. 2026 figures are predictions (161 on roll; SISRA P8 basis: 224,449 students, 1,174 schools).",
    disadvantaged: [
      { year: "2023", p8: -0.15, p8Nat: -0.57, a8: 4.56, a8Nat: 3.50, cohortPct: 45 },
      { year: "2024", p8: 0.26, p8Nat: -0.57, a8: 4.65, a8Nat: 3.46, cohortPct: 40 },
      { year: "2025*", p8: -0.01, p8Nat: null, a8: 4.16, a8Nat: 3.49, cohortPct: 34 }
    ],
    gapNote: "In-school disadvantaged gap: 0.57 (2023) → 0.80 (2024) → 1.14 (2025 SISRA est.). Disadvantaged pupils remain above national disadvantaged averages; the gap is a named priority driven by rising non-disadvantaged performance (+1.06 P8 in 2024).",
    sen: [
      { year: "2023", e: { n: 4, a8: 2.21, p8: -0.40 }, k: { n: 18, a8: 4.65, p8: 0.27 }, none: { a8: 5.03, p8: 0.11 } },
      { year: "2024", e: { n: 9, a8: 2.98, p8: 0.13 }, k: { n: 16, a8: 4.08, p8: 0.07 }, none: { a8: 5.76, p8: 0.83 } },
      { year: "2025*", e: { n: 5, a8: 2.06, p8: -0.09 }, k: { n: 24, a8: 3.49, p8: -0.33 }, none: { a8: 5.61, p8: 1.05 } }
    ],
    senNote: "EHCP cohorts are very small (4–10 pupils) – single pupils move headline figures dramatically. 2025: two Bethlehem Centre pupils not entered for every subject, one non-attender, one unlikely to achieve many grades. SEN K attainment decline (≈half a grade a year) is a named priority with an adaptive-teaching strand in every SoW.",
    gcse2025Subjects: [
      ["Art", 8, 100, 75, 13, -0.32], ["Citizenship", 19, 79, 42, 5, 0.14],
      ["Drama", 17, 65, 59, 24, 0.13], ["English Language", 141, 71, 51, 20, -0.54],
      ["English Literature", 141, 82, 67, 30, 0.02], ["Food & Nutrition", 12, 100, 75, 33, 1.44],
      ["French", 22, 100, 96, 41, -0.17], ["Geography", 26, 89, 77, 46, -0.07],
      ["History", 86, 72, 65, 33, -0.34], ["Maths", 141, 83, 62, 26, -0.15],
      ["Music", 6, 100, 83, 67, 0.09], ["RE", 134, 81, 75, 39, 0.31],
      ["Spanish", 19, 100, 100, 53, 0.54], ["Statistics", 15, 73, 67, 27, 0.09],
      ["Combined Science", 135, 77, 57, 22, -0.42], ["Sports Studies", 29, 100, 93, 83, 2.35],
      ["Music Tech", 2, 100, 100, 50, 0.80]
    ]
  },

  /* ---------- Current year groups ---------- */
  y11: {
    profile: { n: 161, pp: "48%", eal: "46%", sen: "22%", ehcp: "6%", ks2: 101.5 },
    trajectory: {
      labels: ["Autumn Mock", "Spring Mock", "Spring Prediction", "GCSE (target)"],
      thisYear: [4.14, 4.56, 4.98, null],
      lastYearMocks: [4.10, 4.48, 4.94, 5.12],
      note: "2026 cohort is tracking the same mock-to-exam climb the 2025 cohort achieved (mock 4.48 → GCSE 5.12), from a lower KS2 prior (101.5). Predicted 82% 4+ English & Maths would be the school's best ever."
    },
    headlines2026pred: { em4: 82, em5: 54, a8: 5.01, p8: 0.74 },
    attendanceImpact: [
      ["Below 90% attendance", 3.53], ["Above 93%", 5.16], ["Above 95%", 5.22]
    ],
    attendanceNote: "Average A8 by attendance band (Spring mocks) – the single clearest internal evidence that attendance work is achievement work. Six pupils below 10% attendance depress mock A8 by 0.18.",
    machinery: {
      headline: "Behind the headline numbers sits a tracking machine: no Year 10 or 11 pupil is a passenger.",
      items: [
        ["One row per pupil, everything joined", "The Y11 tracker holds two years of attendance per pupil with pastoral notes (Early Help referrals, Attendance Contracts, CAMHS escalations), spring-vs-autumn attendance movement, mock grades against MEGs, behaviour and homework flags – one sheet, every child visible, including a governors' data view."],
        ["SLT mentoring for the 20 highest-risk", "Twenty Year 11 pupils identified from mock APS, attendance and behaviour data each have a named SLT mentor – including the Headteacher's team – with a fixed weekly slot and logged meetings."],
        ["Revision engineered from data", "January 'shoulder day' groups built directly from autumn mock English & Maths performance; coursework catch-up timetabled teacher-by-teacher across three named weeks in November."],
        ["Quality of work tracked in cycles", "Year 10 'quality of book' grades collected per subject across three cycles, with Lenten grades checked against MEGs – classroom standards audited, not assumed."]
      ]
    }
  },
  y10: {
    profile: { n: 179, pp: "36%", eal: "56%", sen: "21%", ehcp: "12%", ks2: 104.5 },
    lenten: { examA8: 4.16, predA8: 5.09, gcse24A8: 5.37 },
    note: "Y10 performing and predicted roughly half a grade better than current Y11 at the same point, with the same KS2 profile as the GCSE 2024 cohort (P8 +0.69)."
  },
  transition: {
    headline: "Primary transition as a data exercise: joining KS4 attendance back to feeder primary shows exactly where the risk arrives – and where Year 6 transition effort should concentrate.",
    feeders: [
      ["Saint Francis of Assisi", 16, 93.1, 12, 110.2],
      ["St Mary Magdalen", 33, 92.8, 18, 106.9],
      ["St Thomas CofE", 22, 91.7, 5, 103.4],
      ["St Mary RC", 22, 91.2, 50, 102.6],
      ["St Charles RC", 26, 90.9, 27, 104.9],
      ["St Mary of the Angels", 14, 90.9, 21, 104.0],
      ["Joined mid-phase / other", 85, 90.8, 15, 106.0],
      ["Our Lady of Dolours", 14, 85.2, 21, 102.2],
      ["Barlby Primary", 18, 83.9, 11, 104.0],
      ["Pope John RC", 12, 78.1, 25, 101.7]
    ],
    insights: [
      "A 15-point KS4 attendance spread by feeder primary (93.1% down to 78.1%) – and the low-attendance feeders also arrive with the lowest KS2 priors. Risk is identifiable before a child walks through the door in Year 7.",
      "One feeder's pupils reach a 50% persistent-absence rate by KS4; two others sit at 21–27%. These are the transition meetings where the safeguarding-led questions (already built into Y6 transition) matter most – and where attendance contracts should start in Year 7, not Year 10.",
      "85 KS4 pupils (a quarter of the cohort) joined mid-phase rather than at Y7 – a highly mobile intake that never had our transition programme at all, arguing for a structured 'late joiners' induction with reading screening on entry (the Emmanuel diagnostic logic).",
      "Underperformance is engineered against, not observed: 65 of 160 Year 11s were not yet at grade 4+ in English & Maths at autumn mocks – every one identified in January, grouped into shoulder-day revision, and tracked through to the summer. Last year the same pipeline took E&M 4+ from 59% at autumn mocks to 75% at GCSE."
    ],
    note: "Internal targeting analysis (Y10 + Y11 trackers, feeders with 8+ pupils; KS2 averages from Y10 data). Used to prioritise transition visits, early attendance contracts and entry screening – not to judge partner schools."
  },

  ks3: {
    profiles: [
      { year: "Year 7", n: 192, pp: "40%", eal: "31%", sen: "20%", att: "95%", ks2: 108 },
      { year: "Year 8", n: 184, pp: "39%", eal: "34%", sen: "25%", att: "92%", ks2: 106 },
      { year: "Year 9", n: 179, pp: "34%", eal: "55%", sen: "22%", att: "90%", ks2: 105 }
    ],
    emOnTrack: {
      labels: ["Year 7", "Year 8", "Year 9"],
      michaelmas: [49, 38, 27],
      lenten: [59, 65, 44],
      note: "% on or above track in both English & Maths – every year group improved substantially from Michaelmas to Lenten (Y8 +27 points). Assessment is identifying gaps and intervention is closing them, in year, at KS3."
    },
    subjects: {
      labels: ["English", "Maths", "Science", "RE", "History", "Geography", "MFL"],
      y7: { mich: [56, 84, 34, 46, 47, 55, 77], lent: [42, 76, 51, 61, 48, 28, 76] },
      y8: { mich: [53, 65, 37, 59, 46, 35, 78], lent: [57, 73, 24, 59, 47, 41, 62] },
      y9: { mich: [52, 44, 34, 45, 44, 39, 58], lent: [39, 48, 45, 35, 35, 46, 27] }
    }
  },

  attendance: {
    bars: [
      ["All Saints (FFT to 22 May 26)", 92.41],
      ["FFT National", 91.63],
      ["Similar (FSM6) schools", 90.19],
      ["ASCC 2018/19 (pre-pandemic)", 92.60]
    ],
    groups: [
      ["FSM6 pupils", 88.46, 86.76], ["EHCP pupils", 90.03, 80.90], ["SEN Support pupils", 84.44, 86.76]
    ],
    byYearSims: [ ["Y7", 95.25], ["Y8", 92.46], ["Y9", 91.51], ["Y10", 90.93], ["Y11", 78.64] ],
    pa: 20.9,
    dfeNote: "DfE-published attendance for some May dates is wrong (e.g. shows ~56–61% where Class Charts shows 90–94%; 10 Oct INSET day uploaded as 0%). Under investigation with DfE/SIMS/Class Charts; internal figures reconciled and explanation ready."
  },

  behaviour: {
    suspensionRate: { ascc: 2.88, national: 3.72 },
    permanentExclusions: 0,
    y11Trend: [ ["HT1", 18], ["HT2", 12], ["HT3", 9], ["HT4", 6], ["HT5", 4] ],
    y11TrendNote: "Y11 suspensions by half term (HT1 and HT5 figures from SEF; interim values interpolated for display – quote HT1=18 → HT5=4).",
    byYearPct: [ ["Y7", 2.8], ["Y8", 6.5], ["Y9", 9.4], ["Y10", 4.4], ["Y11", 11.7] ],
    byYearNote: "Y8 figure interpolated for display. Y9 elevation is a known national pattern; Y11 improving sharply in-year.",
    conduct: "99,194 achievement points vs 34,320 behaviour incidents logged this year (roughly 3:1 positive); zero permanent exclusions this year.",
    /* BEHAVIOUR – OFSTED.docx (four-year analysis) */
    fourYear: {
      years: ["2022–23", "2023–24", "2024–25", "2025–26 (HT1–5)"],
      suspensions: [262, 319, 183, 143],
      pupils: [112, 142, 88, 75],
      pex: [7, 3, 2, 0],
      pexNational: [2, 2, 3, null],
      repeatRate: [77.9, null, 67.0, 67.0],
      cohortPct: [null, 17, null, 8.3],
      headline: "Suspensions have fallen 43.9% from the 2023–24 peak – 319 → 183 → 143 – sustained across two years and on course for the lowest full-year total in the dataset. Days lost to suspension are down 61% from the peak. Permanent exclusions: seven, three, two, zero.",
      keyStats: [
        ["43.9%", "fall in suspensions from the 2023–24 peak, sustained into this year"],
        ["8.3%", "of the cohort suspended this year (HT1–5) – down from ~17% in 2023–24"],
        ["61%", "reduction in school days lost to suspension from the peak year"],
        ["7 → 3 → 2 → 0", "permanent exclusions over four years – now below the national average"]
      ],
      system: [
        "Every suspension is authorised personally by the Headteacher; the Headteacher and Assistant Headteacher scrutinise every incident, with the SENCo and DSL joining where SEND or safeguarding is relevant. No suspension without senior oversight.",
        "Suspension is never a first response: it sits inside a graduated system of intervention, restorative practice and pastoral support. Most behaviour is de-escalated long before this point.",
        "The Emmaus Centre (internal provision) and structured off-site direction give meaningful alternatives to suspension – pupils keep accessing education while reflecting within clear boundaries.",
        "Every suspension aims to end in a reintegration meeting – a clear, positive route back into learning. A second suspension for the same pupil is treated as a signal to review provision, not to repeat the sanction.",
        "Repeat-suspension rate down from 77.9% (2022–23) to 67.0%, stable for two years – individually adapted pastoral plans for every repeat-suspended pupil."
      ],
      pexStory: [
        ["2022–23", 7, "All but two arose from a single drugs incident involving a group of Y10 pupils – one isolated event, not a pattern – plus two siblings following a robbery of a peer after exhaustive pastoral support. The starting point for the rebuilding of behaviour systems."],
        ["2023–24", 3, "Persistent defiance culminating in a serious physical incident; a knife on site; drugs on site. Each followed prior intervention and support."],
        ["2024–25", 2, "Drugs on site; a serious physical assault on a peer. First year below the national average."],
        ["2025–26", 0, "None. High expectations held through relationships, structure and timely intervention – not escalation. Permanent exclusion remains available; it has not been needed."]
      ],
      honesty: "The disproportionate representation of PP and SEND pupils in suspensions is a known, named challenge – it reflects concentrated, complex need, and it points to where we improve next: not lowering expectations, but matching the pastoral support around vulnerable pupils to the ambition already visible in their academic outcomes (disadvantaged P8 +0.26 vs −0.57 national; in 2024 our disadvantaged pupils outperformed national non-disadvantaged pupils by +0.09).",
      phrase: "Seven, three, two, zero – a school that has become more inclusive and more proactive without abandoning firm boundaries."
    },
    /* INTERNAL DATA – OFSTED.xlsx (internal suspension / lesson-removal log) */
    internal: {
      definition: "Internal suspension is an in-house support mechanism that keeps pupils in school and learning on site – it is not an external or fixed-term exclusion. Learning continues, relationships hold, and safeguarding oversight is maintained.",
      years: ["2022–23", "2023–24", "2024–25", "2025–26"],
      total: [1403, 1191, 1108, 943],
      perDay: [7.4, 6.3, 5.8, 5.3],
      roll: [633, 666, 701, 895],
      perPupil: [2.22, 1.79, 1.58, 1.05],
      keyStats: [
        ["−33%", "internal suspensions over four years – falling every single year (1,403 → 943)"],
        ["−52%", "per pupil on roll: 2.22 → 1.05 – behaviour improving faster than the school is growing"],
        ["+41%", "roll growth over the same period (633 → 895) – the reduction is genuine, not cohort size"],
        ["7.4 → 5.3", "average lesson removals per day – a calmer, more settled school, day in day out"]
      ],
      messages: [
        "Sustained, embedded trend: internal suspensions have fallen every year for four consecutive years – not a single-year dip.",
        "Improvement outpaces growth: the roll rose over 40% while per-pupil removals more than halved.",
        "Calmer daily picture: fewer pupils removed from lessons on a typical day reflects reduced low-level disruption and a purposeful climate.",
        "Inclusive by design: internal suspension keeps pupils on site with teaching, work and pastoral support – the non-exclusionary alternative that our zero-PEX year is built on.",
        "Interventions driving it: consistent routines and the coaching-based teaching model, the Emmaus Centre, restorative practice, daily pastoral briefings, adaptive-teaching CPD for SEND, and structured family engagement."
      ],
      vulnerable: "PP and SEND pupils are over-represented among lesson removals (PP 67% and SEND 38% of removals vs 39% and 22% of the roll – EHCP 13%). We name this openly and read it protectively: internal suspension is used deliberately to keep our most vulnerable pupils on site and supported, in preference to the external exclusion these groups are nationally far more likely to receive. The pattern is closely monitored, with targeted intervention to narrow the gap while sustaining a non-exclusionary response."
    },
    /* OSD – OFSTED.docx (off-site directions) */
    osd: {
      headline: "Off-site direction is how this school stopped permanently excluding children. 59 short, reciprocal placements this year (1–5 days) with Kensington Aldridge Academy and Holland Park – a supportive intervention under DfE guidance, not a disciplinary sanction – and permanent exclusions fell to zero.",
      keyStats: [
        ["59", "off-site directions across 2025–26 – every one short (1–5 days), every one with parents fully consulted"],
        ["2", "formal reciprocal partnerships (KAA & Holland Park) – we place and receive; the Headteacher visited both to verify consistent expectations"],
        ["14", "placements under SEND arrangements – 12 SEN Support, just 2 EHCP: pupils with the most complex needs stay in mainstream"],
        ["0", "permanent exclusions this year – OSD and the Emmaus Centre are the machinery behind the zero"]
      ],
      byYear: { labels: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"], counts: [7, 10, 24, 12, 6] },
      byYearNote: "Year 9 accounts for the largest share (24) – deliberate additional pastoral focus on a cohort in a well-recognised period of behavioural adjustment. Year 7 (7) evidences strong transition support; Year 11 (6) reflects prioritisation of exam preparation.",
      byTerm: { labels: ["Autumn 1", "Autumn 2", "Spring 1", "Spring 2", "Summer 1"], counts: [12, 14, 10, 5, 18], send: [3, 4, 4, 0, 3] },
      byTermNote: "Use is responsive to need across the year – falling to its lowest in Spring 2 (5), with SEND placements at zero that term, as early intervention embedded. Every placed pupil remains enrolled and supported by both schools throughout, with focused behavioural and pastoral input and a planned, considered return to ASCC.",
      framing: [
        "Supportive intervention, not sanction: designed under DfE guidance for reflection and re-engagement, with curriculum continuity and safeguarding written into a formal agreement with each partner school.",
        "Safeguarding-led: pupils stay enrolled, connected to learning and under the pastoral oversight of two schools – avoiding the isolation and lost learning of suspension.",
        "Reciprocal and quality-assured: we receive as well as place; the Headteacher personally visited both partners to confirm expectations are applied consistently.",
        "Graduated by design: SEN Support pupils access short, early placements (12); EHCP use is minimal (2) because embedded support plans keep the most complex needs in mainstream.",
        "It works: one of our most effective tools for improving behaviour and reducing exclusion – reflected directly in the fall of permanent exclusions to zero."
      ]
    }
  },

  /* ---------- Connections graph ---------- */
  graph: {
    // type: pillar (evaluation area) | driver (system/programme) | outcome | risk
    nodes: [
      { id: "leadership", cluster: "people", label: "Leadership & Governance", type: "pillar", grade: "Exceptional", size: 17,
        desc: "Sustained exceptional standards; every weakness owned. Headteacher advises the Secretary of State; national platform.",
        stats: [
          "Every SEF area Strong or Exceptional – each with a live, owned action plan",
          "Sustained: suspensions −43.9% from peak · PEX 7→3→2→0 · attendance rising 2 years · outcomes above national 3 years",
          "Schools Policy and Delivery Adviser to the Secretary of State · Headteachers' Roundtable co-chair · Secondary Headteacher of the Year",
          "Toolkit Test 3 met: no significant area unaddressed – every weakness has an owner, date and measure"
        ] },
      { id: "curriculum", cluster: "standards", label: "Curriculum & Teaching", type: "pillar", grade: "Strong", size: 16,
        desc: "Pillars + Active Ingredients coaching; T&L 2.08; 80% expected/strong.",
        stats: [
          "T&L average 2.08 – 80% of lesson drop-in statements expected or strong",
          "Curriculum Pillars in every SoW from September; CPR cycle keeps SoW live",
          "24% of staff ITT/ECT – developed through the Active Ingredients coaching model",
          "Proof it lands: 2024 P8 +0.69, A8 5.39 vs 4.59 national"
        ] },
      { id: "achievement", cluster: "standards", label: "Achievement", type: "pillar", grade: "Exceptional", size: 17,
        desc: "P8 +0.69 (2024); 3 years above national; 2026 pred 82% 4+ E&M.",
        stats: [
          "P8 journey: +0.12 → +0.69 → +0.76* → +0.74* (2026 pred)",
          "A8 5.39 (2024) vs 4.59 national · 2026 pred 82% 4+ E&M – best ever",
          "Disadvantaged P8 +0.26 vs −0.57 national (2024)",
          "Outcomes hold while KS2 priors fall: 105.5 → 101.5 across four cohorts"
        ] },
      { id: "attendance", cluster: "climate", label: "Attendance", type: "pillar", grade: "Strong", size: 15,
        desc: "92.41% – above national & similar schools; +2.21 vs baseline expectation.",
        stats: [
          "92.41% vs 91.63% national and 90.19% similar FSM6 schools (FFT, May 26)",
          "Improvement 2.21% vs DfE minimum expectation of 0.5% – over 4× required",
          "FSM6 88.46% (+1.70 vs national) · EHCP 90.03% (+9.13 vs national)",
          "PA 20.9% – target <20% by Jan 2027 with ambassadors & individual targets"
        ] },
      { id: "behaviour", cluster: "climate", label: "Behaviour", type: "pillar", grade: "Exceptional", size: 15,
        desc: "Suspensions −43.9% from peak; PEX 7 → 3 → 2 → 0; 2.88/100 vs 3.72 national.",
        stats: [
          "Suspensions 319 → 183 → 143: down 43.9% from the 2023–24 peak, sustained",
          "Permanent exclusions 7 → 3 → 2 → 0 over four years – now below national average",
          "8.3% of cohort suspended (was ~17% in 2023–24); days lost down 61%",
          "Every suspension authorised by the Headteacher; Emmaus Centre + reintegration meetings"
        ] },
      { id: "personal", cluster: "character", label: "Personal Development", type: "pillar", grade: "Exceptional", size: 14,
        desc: "4+ trips per pupil per year; ESP & Elev:8; tracked entitlement; Gatsby 92%.",
        stats: [
          "Every pupil: 4+ trips a year; 30 careers/PSHCE events delivered incl. whole-Y10 work experience week",
          "Gatsby Benchmarks: 92% average, 100% on personal guidance and needs-of-each-pupil",
          "Voice at scale: 94% of 416 Culture Day respondents felt they belong; 100% of parents recommend the school",
          "St Thomas Aquinas Award: 53 Y10 pupils, a quarter PP – university-style stretch",
          "“Opportunity is planned, not left to chance”"
        ] },
      { id: "inclusion", cluster: "included", label: "Inclusion", type: "pillar", grade: "Exceptional", size: 15,
        desc: "Bethlehem & Romero Centres; pupil passports; EHCP P8 +0.07, SEN K +0.13 (2024).",
        stats: [
          "EHCP 9.83% (88 pupils) & SEN 22% – well above national, rising yearly",
          "2024 P8: EHCP +0.07 · SEN Support +0.13 – positive progress at scale of need",
          "Bethlehem & Romero Centres · pupil passports · graduate ASAs working both ends of the ability range",
          "50+ mapped provisions at £0 to families – Fresh Start 3× faster recall; Galilee +27–44pp; 1:1 NHS-target speech therapy for 17 EHCP pupils",
          "Emmanuel next: £400k RBKC-funded reintegration hub + adapted literacy pathway"
        ] },
      { id: "safeguarding", cluster: "included", label: "Safeguarding", type: "pillar", grade: "Met", size: 13,
        desc: "External review Jan 2026 → action plan Feb 2026. Met.",
        stats: [
          "External Whole School Safeguarding Review (Jan 2026): strong leadership, culture, governance, pupil voice, records, curriculum",
          "DSL action plan produced within one month (Feb 2026)",
          "Immediate concerns already actioned; remainder tracked and ongoing"
        ] },
      { id: "ethos", cluster: "mission", label: "Catholic Ethos", type: "driver", size: 13,
        desc: "Orare, Laborare, Servire – shapes culture, care and community. The 'why' behind every system.",
        stats: [
          "Orare, Laborare, Servire – to pray, to work, to serve",
          "Shapes behaviour culture, pastoral care and service to community",
          "Lived daily: prayer & liturgy, Schola Cantorum, Faith in Action, The Mission"
        ] },
      { id: "coaching", cluster: "people", label: "Coaching & Staff Development", type: "driver", size: 12,
        desc: "Active Ingredients model; every teacher reflects, chooses, is coached; 45% chose the school's #1 priority.",
        stats: [
          "54 narrative self-reflections across the 5 Active Ingredients domains; 40 coached personal targets live",
          "45% of teachers freely chose adaptive teaching – the SEF's named priority – as their own target; 25% dialogic/questioning (oracy)",
          "Whole-staff Unlocking Reading: 59 staff, every department, 92% quiz average",
          "24% ITT/ECT developed into consistency; wellbeing innovation ('lie-ins') nationally covered"
        ] },
      { id: "data", cluster: "standards", label: "Intelligent Assessment & Data", type: "driver", size: 12,
        desc: "Data drops, SISRA, Bedrock SAS, reading tests → targeted, evaluated intervention.",
        stats: [
          "Data drops + SISRA + Bedrock SAS + reading tests at KS3 & KS4",
          "KS3 E&M on-track Mich→Lent: Y7 49→59% · Y8 38→65% · Y9 27→44%",
          "Y11 mock A8 trajectory: 4.14 → 4.56 → 4.98 predicted"
        ] },
      { id: "enrichment", cluster: "character", label: "Enrichment: ESP & Elev:8", type: "driver", size: 12,
        desc: "Extended day, no phones, enrichment for all – nationally covered innovation.",
        stats: [
          "404 pupils (45% of roll) in clubs; 3,695 logged attendances; 35 clubs; all 8 DfE benchmarks met",
          "Club members attend school +7.2 points better (SEN members +12.1) – the engine of attendance",
          "Y8 (Elev:8) is the most-engaged cohort: 91% in clubs – the national 'dip' year inverted",
          "Covered by Guardian, Times, Fortune, BBC, international press"
        ] },
      { id: "pastoral", cluster: "climate", label: "Pastoral & Attendance Systems", type: "driver", size: 12,
        desc: "Home visits, Attendance Contracts, CPOMs, HOY/HOKS structure.",
        stats: [
          "Home visits for every severely absent pupil, logged on CPOMs",
          "Attendance Contracts agreed with every Y10 PA/SA family before September",
          "External agency referral/support for every pupil below 50% attendance"
        ] },
      { id: "innovation", cluster: "people", label: "National Profile & Innovation", type: "driver", size: 12,
        desc: "12-hour day, phone-free, teacher lie-ins, DfE adviser role – the school shapes national policy.",
        stats: [
          "60+ national, international, sector and faith-press items",
          "Schools Policy and Delivery Adviser to the Secretary of State · DfE expert inclusion group · HTRT co-chair",
          "Oracy Education Commission case study · EPI enrichment panel"
        ] },
      { id: "disadv", cluster: "standards", label: "Disadvantaged Outcomes", type: "outcome", size: 13,
        desc: "P8 +0.26 vs −0.57 national (2024); 3 years above national; enrichment entitlement tracked.",
        stats: [
          "Disadvantaged P8 above national disadvantaged three years running",
          "2024: P8 +0.26 vs −0.57 · 4+ E&M 66% vs 43% national",
          "FSM6 attendance 88.46% – +1.70 vs national FSM6",
          "In a top-quintile deprivation context (FSM6 41.8%)"
        ] },
      { id: "send-out", cluster: "included", label: "SEND Progress & Care", type: "outcome", size: 12,
        desc: "EHCP attendance +9.13 vs national; positive P8 2024; specialist centres.",
        stats: [
          "EHCP attendance 90.03% – +9.13 vs national EHCP figure",
          "2024 P8: EHCP +0.07 · SEN Support +0.13",
          "Bethlehem Centre (exceptional teaching) · Romero Centre (keeping up, not catching up)"
        ] },
      { id: "reading", cluster: "standards", label: "Reading & Literacy", type: "risk", size: 10,
        desc: "54% below age-related (Aut 25) → whole-staff training, Fresh Start, Fluency Pilot – and summer tests show it moving: Y7 & Y10 mean SAS at/above 100.",
        stats: [
          "54% below age-related reading (Aut 25); GL Cycle 1: 66 Y7–8 pupils significantly below (SAS<85), mean deficit 51.8 months",
          "Moving: summer 2026 matched tests – Y7 SAS 97.8→99.0, Y10 100.2→101.6 (both at/above the national 100); Y10 'expected & above' +6.8pp; SORA e-book check-outs doubled 254→487",
          "Interventions with receipts: Thinking Reading 75% met age-expected reading age · Fluency 67% improved SAS (⅔ of improvers PP) · Y10 English intervention: 100% of PP pupils maintained/improved",
          "Whole-staff 'Unlocking Reading': 59 staff, every department, 92% average · Fresh Start Speed Sound recall up to 3× faster",
          "Next: Emmanuel adapted literacy pathway – daily, low-cognitive-load, keep up not catch up"
        ] },
      { id: "gap", cluster: "standards", label: "Disadvantaged Gap (in-school)", type: "risk", size: 10,
        desc: "0.57 → 0.80 → 1.14* – driven by non-disadvantaged surge; levers: adaptive teaching, attendance, intervention.",
        stats: [
          "In-school gap: 0.57 (2023) → 0.80 (2024) → 1.14* (2025 SISRA)",
          "Context: disadvantaged pupils remain ABOVE national disadvantaged throughout",
          "Partly driven by non-disadvantaged surge (P8 +1.06 in 2024)",
          "Levers: adaptive teaching strand in every SoW · attendance · targeted intervention"
        ] },
      { id: "y11att", cluster: "climate", label: "Year 11 Attendance", type: "risk", size: 10,
        desc: "2.17 below national; 7% severely absent; audit + contracts + home visits underway.",
        stats: [
          "Y11 attendance 2.17 points below national (3.17 in spring term)",
          "7% severely absent – exam anxiety + small entrenched group predating current systems",
          "A8 by attendance: 5.22 (95%+) vs 3.53 (<90%) – why this matters",
          "Response: cause-coded audit of every sub-90% pupil · contracts · home visits"
        ] },
      { id: "dispro", cluster: "climate", label: "Suspension Disproportionality", type: "risk", size: 10,
        desc: "FSM, boys, EHCP, Black Caribbean over-represented – named plans due end HT6.",
        stats: [
          "FSM pupils, boys, EHCP and Black Caribbean pupils suspended at higher rates than peers",
          "Self-identified through our own analysis – not raised by anyone external",
          "Named owners (BFO/MEH/DHA), plans due end HT6, reviewed HT1/HT2"
        ] },
      { id: "emmanuel", cluster: "included", label: "Emmanuel (next build)", type: "driver", size: 12,
        desc: "£400k RBKC-funded SEN provision: reintegration hub, multi-agency space, adapted Y7–8 literacy pathway.",
        stats: [
          "£400k high-needs capital secured (RBKC agreement) + ~£103k school; 55m² modular build",
          "Case triangulated from our own data: 66 Y7–8 readers SAS<85 · 27 below 85% attendance · 7 pupils = a third of suspensions",
          "Reintegration hub for anxiety-driven (SEMH/autism) absence – managed return to full-time education",
          "The Elev:8 discipline applied to a building: need identified, funding secured, outcomes named first"
        ] }
    ],
    // types: drives (solid), evidences (dashed), watches (dotted risk), underpins (ethos)
    links: [
      { s: "ethos", t: "leadership", type: "underpins", why: "Servant leadership rooted in the mission – the moral purpose behind every strategic decision." },
      { s: "ethos", t: "behaviour", type: "underpins", why: "The calm, respectful culture flows from the ethos: sanction always paired with reconciliation." },
      { s: "ethos", t: "personal", type: "underpins", why: "Faith in action – worship, service and community shape the personal development offer." },
      { s: "ethos", t: "inclusion", type: "underpins", why: "Every child known and valued: inclusion as a gospel imperative, not a compliance exercise." },
      { s: "leadership", t: "curriculum", type: "drives", why: "Leaders built the Pillars and the CPR cycle; SLT book scrutiny and drop-ins quality-assure it." },
      { s: "leadership", t: "attendance", type: "drives", why: "Leadership resourced an enhanced attendance team – DfE improvement baseline beaten more than 4×." },
      { s: "leadership", t: "behaviour", type: "drives", why: "The Headteacher personally scrutinises suspension decisions daily; policy applied consistently." },
      { s: "leadership", t: "safeguarding", type: "drives", why: "Leaders commissioned the external review themselves and had an action plan within a month." },
      { s: "leadership", t: "innovation", type: "drives", why: "System leadership: DfE adviser secondment, HTRT co-chair, national media platform." },
      { s: "coaching", t: "curriculum", type: "drives", why: "Active Ingredients coaching turns a 24% ITT/ECT staff body into consistent practitioners." },
      { s: "curriculum", t: "achievement", type: "drives", why: "The sequenced curriculum lands as results: P8 +0.69, A8 5.39 vs 4.59 national (2024)." },
      { s: "data", t: "achievement", type: "drives", why: "Data drops trigger targeted intervention: Y11 mock A8 4.14 → 4.56 → 4.98 predicted." },
      { s: "data", t: "curriculum", type: "drives", why: "Reading and assessment data reshape Schemes of Work – the adaptive-teaching strand came from data." },
      { s: "pastoral", t: "attendance", type: "drives", why: "Home visits, Attendance Contracts and CPOMs logging drive 92.41% – above national." },
      { s: "attendance", t: "achievement", type: "drives", why: "Attendance is achievement: Y11 A8 5.22 above 95% attendance vs 3.53 below 90%." },
      { s: "behaviour", t: "achievement", type: "drives", why: "Calm classrooms protect learning time – suspensions 2.88 vs 3.72 national, zero PEX." },
      { s: "enrichment", t: "personal", type: "drives", why: "The extended day delivers 4+ trips and clubs for every pupil – tracked, not assumed." },
      { s: "enrichment", t: "disadv", type: "drives", why: "Enrichment is a monitored entitlement: EVOLVE data proves disadvantaged pupils access it equally." },
      { s: "inclusion", t: "send-out", type: "drives", why: "Passports, specialist centres and the Deputy SENCo convert need into progress: EHCP P8 +0.07." },
      { s: "pastoral", t: "send-out", type: "drives", why: "The pastoral system works hardest for those who need it most: EHCP attendance +9.13 vs national." },
      { s: "personal", t: "behaviour", type: "drives", why: "Belonging reduces disruption – engaged pupils with 4+ trips a year behave and attend." },
      { s: "inclusion", t: "curriculum", type: "drives", why: "Pupil passports shape department planning; adaptive teaching CPD whole-staff from September." },
      { s: "achievement", t: "disadv", type: "evidences", why: "Disadvantaged P8 +0.26 vs −0.57 national (2024) – three consecutive years above national." },
      { s: "attendance", t: "disadv", type: "evidences", why: "FSM6 attendance 88.46%, +1.70 above the national FSM6 figure." },
      { s: "innovation", t: "enrichment", type: "evidences", why: "The 12-hour day and phone-free culture are the innovations the national press covers." },
      { s: "innovation", t: "coaching", type: "evidences", why: "Teacher 'lie-ins' and flexible working: retention innovation with Guardian/Schools Week coverage." },
      { s: "safeguarding", t: "pastoral", type: "evidences", why: "Safeguarding and attendance share one machinery: CPOMs, home visits, escalation pathways." },
      { s: "curriculum", t: "reading", type: "watches", why: "54% below reading age (Aut 25) → Fluency Pilot, Thinking Reading, literacy committee from 2026." },
      { s: "achievement", t: "gap", type: "watches", why: "Gap 0.57→0.80→1.14* is named and owned – while disadvantaged pupils stay above national." },
      { s: "attendance", t: "y11att", type: "watches", why: "Y11 sits 2.17 below national – audit, contracts and home visits all in train now." },
      { s: "behaviour", t: "dispro", type: "watches", why: "Disproportionality self-identified; named owners, plans due end HT6, reviewed HT1/HT2." },
      { s: "inclusion", t: "reading", type: "watches", why: "Romero Centre reading fluency provision – keeping up, not catching up." },
      { s: "leadership", t: "emmanuel", type: "drives", why: "Leaders converted a data-triangulated need into £400k of secured RBKC capital, value-engineered by £150–175k." },
      { s: "emmanuel", t: "reading", type: "drives", why: "The adapted Y7–8 literacy pathway: daily decoding, fluency and Tier 2/3 vocabulary – for the 66 pupils reading 4+ years behind." },
      { s: "emmanuel", t: "send-out", type: "drives", why: "Reintegration hub + multi-agency space (EP, SaLT, OT) – the next layer of the graduated SEND response." },
      { s: "emmanuel", t: "y11att", type: "watches", why: "Anxiety-driven absence is the hub's core cohort – interrupting the cycle before it hardens into KS4 patterns." },
      { s: "enrichment", t: "attendance", type: "drives", why: "The engine claim, evidenced: club members attend 7.2 points better (SEN members +12.1); 10+ visits associates with 95.5%." },
      { s: "safeguarding", t: "attendance", type: "drives", why: "One machinery, one leader: the DSL runs both; home visits, CME escalation and contracts serve safeguarding and attendance at once." },
      { s: "leadership", t: "coaching", type: "drives", why: "Leaders built the Active Ingredients cycle and protect its time with named workload trade-offs." },
      { s: "coaching", t: "reading", type: "drives", why: "Whole-staff Unlocking Reading CPD: 59 staff across every department at a 92% average – reading as everyone's pedagogy." },
      { s: "data", t: "attendance", type: "drives", why: "Per-pupil trackers with two years of attendance and pastoral notes make every absence pattern visible and owned." },
      { s: "data", t: "behaviour", type: "drives", why: "The internal log and suspension analysis are what let leaders prove four-year improvement and spot disproportionality themselves." },
      { s: "pastoral", t: "behaviour", type: "drives", why: "Reintegration meetings, OSD placements and repeat-suspension provision reviews are pastoral machinery applied to behaviour." },
      { s: "pastoral", t: "y11att", type: "watches", why: "Attendance Contracts with every Y10 PA/SA family before September target next year's Y11 risk directly." },
      { s: "curriculum", t: "personal", type: "drives", why: "PSHCE, British Values, oracy and careers are taught through the curriculum – personal development is timetabled, not bolted on." },
      { s: "inclusion", t: "dispro", type: "watches", why: "EHCP over-representation in suspensions is met with enhanced support plans, not lowered expectations." },
      { s: "disadv", t: "gap", type: "watches", why: "The one number that qualifies the headline: disadvantaged pupils beat national while the in-school gap widens – named, owned, levered." },
      { s: "innovation", t: "emmanuel", type: "evidences", why: "The innovation habit at capital scale: the same evidence-first discipline as Elev:8, now in bricks." },
      { s: "emmanuel", t: "behaviour", type: "drives", why: "Seven pupils account for a third of suspensions; the hub is built to interrupt exactly that removal-and-return cycle." },
      { s: "achievement", t: "send-out", type: "evidences", why: "EHCP +0.07 and SEN Support +0.13 Progress 8 (2024): the achievement data validates the SEND model." }
    ]
  },

  /* ---------- Enrichment: DfE benchmarks + club data + Elev:8 ---------- */
  enrichment: {
    intro: "The DfE's Enrichment Framework was published on 15 June 2026. All Saints didn't have to change anything to meet it – the extended enrichment day, tracked club participation and Elev:8 already deliver every benchmark. The framework caught up with us.",
    frameworkUrl: "https://www.gov.uk/government/publications/the-enrichment-framework-for-schools-and-colleges/enrichment-benchmarks",
    clubs: {
      total: 35, uniquePupils: 404, pctOfRoll: 45.0, attendances: 3695,
      sustained: 84,
      ppShare: 34.4, ppSchool: 39.3, senShare: 20.5, senSchool: 22.0,
      note: "Class Charts club 'stars' – every attendance logged, full year (HT1–6). Participation mirrors the school's profile: PP pupils are 39.3% of the roll and 34.4% of club members; SEN 22.0% of roll, 20.5% of members; participation spans every prior-attainment band (63% of higher, 54% of middle, ~40% of lower prior attainers). Enrichment reaches the pupils national data says are most likely to miss out – and we can prove it pupil by pupil.",
      top: [
        ["Basketball", 57, 132], ["Table Tennis (Elev:8)", 52, 135], ["Volleyball", 51, 129],
        ["KS3 Cooking", 48, 151], ["Y7 Boys Football", 43, 175], ["Netball", 41, 137],
        ["Maths Homework Support", 39, 116], ["Y8 Boys Football (Elev:8)", 36, 116],
        ["Girls Football", 36, 94], ["Making the Leap (Elev:8)", 27, 83]
      ],
      topNote: "HT5–6 membership. Table Tennis (Elev:8) launched this term and was instantly the school's second-biggest club.",
      breadth: "35 clubs by the summer term, spanning sport (basketball, volleyball, netball, dodgeball, table tennis, football for boys and girls, cycling), arts (art, theatre design ×2, ReAct Theatre, dance, K-Pop, choir, music ensemble, creative writing), academics (maths problem-solving, EAL & maths homework support, book club, MFL, history, film & philosophy), and life skills (cooking ×3, gardening, Green Club, Making the Leap).",
      growth: {
        labels: ["HT1–4 (avg per half term)", "HT5–6 (avg per half term)"],
        perHT: [431, 986],
        note: "Six new Elev:8 clubs launched for the summer term (Table Tennis, Making the Leap, ReAct Theatre, Gardening, Art, Theatre Design) – and logged club attendances per half term more than doubled, from ~431 to ~986. The offer is growing and pupils are voting with their feet."
      },
      byYear: {
        labels: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"],
        pct: [73, 91, 29, 21, 4],
        note: "Year 8 – the 'dip' year – is now the school's most-engaged year group: 91% of the entire cohort attended at least one club, against 73% in Y7. That inversion of the national engagement curve is Elev:8 working in real time. KS4 participation shifts by design into revision, intervention and Sports Studies programmes as exam season arrives."
      },
      impact: {
        labels: ["All pupils", "Pupil Premium", "SEN", "10+ club visits"],
        members: [94.52, 92.41, 92.65, 95.49],
        nonMembers: [87.28, 82.99, 80.55, null],
        note: "School attendance of club members vs non-members (full year, n=897). Club members attend 7.2 points better overall; for PP pupils the gap is +9.4 and for SEN pupils +12.1. Pupils with 10+ logged club visits attend at 95.49%. We present this as association, not simple causation – but belonging drives attendance, and enrichment is how this school builds belonging. It is the engine of the whole-school attendance strategy."
      }
    },
    categories: [
      { cat: "Civic engagement", dfe: "Volunteering, debating, school democracy, community engagement", ascc: "Faith in Action & The Mission (service programmes), student leadership & student voice, Green Club sustainability projects, house system and inter-house democracy." },
      { cat: "Arts and culture", dfe: "Music, art, dance, theatre, museums and galleries", ascc: "Schola Cantorum (toured Germany, 2026), music ensemble, choir, K-Pop and dance clubs, theatre design, art club, Culture Day, museum and gallery visits on Curriculum Enhancement Days." },
      { cat: "Nature, outdoors & adventure", dfe: "Time outdoors, residentials and camps, sustainability", ascc: "Elev:8 launches with a whole-year-group residential at PGL Liddington (150 acres of outdoor learning); Green Club; Activity Days; cycling club." },
      { cat: "Sport & physical activities", dfe: "Individual and team sports, dance, fitness, representing the school", ascc: "12 sports clubs including girls' football, netball, basketball, volleyball; inter-house competitions; Sports Day; borough fixtures." },
      { cat: "Wider life & future skills", dfe: "Digital literacy, STEM clubs, cooking, finances, enterprise", ascc: "Cooking clubs (incl. Elev:8 strand), London Leaders business challenge, coding & digital media in P7 Enrichment, Maths & Problem Solving, careers programme with Compass+." }
    ],
    benchmarks: [
      { n: 1, title: "A strategically aligned enrichment offer", status: "Met",
        indicator: "Structured offer with explicit SLT/governor backing, understood by staff, with an implementation and monitoring plan.",
        evidence: "Enrichment is a headline commitment in the SEF's Personal Development area with named owners (DWI/RFU) and milestones; the extended day builds enrichment into the timetable itself; the Headteacher's national enrichment advocacy (EPI panel, DfE role) makes the strategic backing unmistakable." },
      { n: 2, title: "A broad and well-rounded enrichment offer", status: "Met",
        indicator: "Every pupil accesses activities across all 5 DfE categories, delivered regularly including within the school day.",
        evidence: "31 clubs cover all five categories (see mapping below); every pupil attends 4+ trips a year plus whole-school celebration days; P7 Enrichment is compulsory and timetabled – provision inside the extended school day, exactly as the benchmark asks." },
      { n: 3, title: "Well-communicated, celebrating participation and achievement", status: "Met",
        indicator: "Timely, clear information; high aspirations for participation; achievement celebrated; pupils reflect on their experiences.",
        evidence: "Club offer published to families each term; Class Charts stars and EVOLVE records celebrate and evidence participation; London Leaders rewards conduct, effort and club attendance with a central-London leadership day; assemblies and awards evenings celebrate enrichment achievement." },
      { n: 4, title: "Shaped by the school community", status: "Met",
        indicator: "Pupil, parent and staff voice shapes the offer; pupil leadership encouraged; staff interests and capacity considered.",
        evidence: "Student voice surveys shape the club list (K-Pop, film & philosophy and dodgeball all came from pupil demand); Student Leaders run activities with staff support; clubs are built on staff expertise from theatre design to cycling. Voice is collected at scale – 416 Culture Day responses, 97 All Saints Day, plus parent surveys – and pupils' suggestions visibly shape the next event." },
      { n: 5, title: "Accessible and engaging for all", status: "Met",
        indicator: "Equitable, inclusive, accessible – with participation monitored and barriers addressed, especially for SEND and disadvantaged pupils.",
        evidence: "The strongest card we hold: participation is tracked pupil-by-pupil with PP/SEN/EAL flags and prior-attainment bands. 404 pupils (45% of the roll) attended clubs this year; PP pupils are 34% of members (39% of roll), SEN 21% (22%) – near parity – and participation spans every KS2 band. Club members attend school 7.2 points better than non-members (SEN members +12.1). Free uniform/PE kit for all, funded places and free Y11 prom tickets remove cost barriers. A monitored entitlement, not an open offer." },
      { n: 6, title: "Works in partnership", status: "Met",
        indicator: "Partnerships broaden the offer; feedback processes exist; signposting beyond the school's own offer.",
        evidence: "PGL Liddington residential; London businesses host the London Leaders day; West London Zone, GRIT Mentoring, Latimer Community Art Therapy and Catholic Children's Society enrich provision; Schola Cantorum tours internationally; EVOLVE manages external trip quality." },
      { n: 7, title: "Outcomes-focused", status: "Met",
        indicator: "Pupil outcomes considered in design; effective systems (including MIS) collect and monitor outcome-related data.",
        evidence: "Exactly what Class Charts delivers: 3,695 logged club attendances across the year against a named baseline of all 898 pupils with PP/SEN/EAL flags and KS2 bands – participation cross-referenced with whole-school attendance (members 94.5% vs non-members 87.3%). 84% of participants sustained their involvement across both halves of the year. Compass+ tracks careers outcomes from September." },
      { n: 8, title: "Continually improving", status: "Met",
        indicator: "Feedback gathered from pupils, parents, staff and partners; the offer continuously improves.",
        evidence: "Impact tracking for every trip, event and programme is a named SEF priority (DWI/RFU, live from September); Elev:8 itself is the proof of continuous improvement – a whole-year-group redesign built from our own participation and attendance data." }
    ],
    elev8: {
      tagline: "“I have come so that you might have life, life in all its fullness” – John 10:10",
      what: "Elev:8 is a year-long programme that redesigns Year 8 around enrichment: a whole-cohort PGL Liddington residential in HT1, compulsory weekly P7 Enrichment (creative arts, STEM, literacy & spoken word, sport, enterprise & coding), aspiration assemblies with role models, the London Leaders business challenge (stars earned for attendance, effort and club participation; top 20 win an immersive leadership day in central London), and inter-house music and sport competitions.",
      why: "Research by Professor John Jerrim (UCL Institute of Education) shows pupil engagement falls off a cliff between the end of Year 7 and Year 8 – the 'Year 8 dip'. We see it in our own data: matched-pupil attendance falls 2.29 points as pupils move from Y7 into Y8, the biggest drop of any transition. Most schools notice the dip; we redesigned the year around it.",
      aheadOfCurve: "Elev:8 was designed before the DfE published its Enrichment Framework (15 June 2026) – and it delivers the framework's benchmarks by design: all five activity categories, a residential, pupil leadership, outcome tracking through stars, and equitable access for a year group where 39% are Pupil Premium. Evidence-led (Jerrim, EEF extending-school-time conditions) and innovation-minded (nobody else is doing this for Year 8).",
      clubsNow: "Elev:8 is already reshaping the data. Six new Elev:8 clubs launched for the summer term – Table Tennis was instantly the school's second-biggest club (52 members) – alongside Y8 Boys Football (36 members: 21 PP, 13 SEN), Making the Leap (27) and three cooking strands. Result: 91% of the whole Year 8 cohort attended at least one club this year, the highest of any year group – the 'dip' year is now the most engaged year in the school."
    },
    y8DipChart: {
      labels: ["Y7 → Y8", "Y8 → Y9", "Y9 → Y10", "Y10 → Y11"],
      deltas: [-2.29, 0.25, -0.78, -0.53],
      improved: [32, 53, 46, 64],
      note: "Matched-pupil attendance change vs the same pupils last year (to 22 May). The Y7→Y8 transition shows the steepest fall – the national 'Year 8 dip' Jerrim documents, visible in our own data. Elev:8 is the structural answer. At the other end, 64% of Year 11 pupils improved their attendance on last year – against the national trend of decline into exam year."
    }
  },

  /* ---------- SEND: interventions & impact ---------- */
  send: {
    intro: "197 pupils with SEN (22% of roll) and 88 EHCPs (9.8%, rising every year) – among the highest of any secondary school in RBKC. This page shows what we do about it: a mapped provision offer of 50+ interventions, every one costed at £0 to families, with impact measured pupil by pupil.",
    tiles: [
      ["50+", "provisions running this year – mapped, dated, staffed and reviewed on Provision Map"],
      ["£0", "cost to families for every intervention – from NHS-target speech therapy to GCSE tuition"],
      ["3×", "faster phonics recall for Fresh Start pupils – 71 seconds to 19 at best"],
      ["+27–44", "percentage-point gains, pre- to post-assessment, for Galilee literacy pupils"]
    ],
    map: {
      areas: [
        ["Cognition & Learning", 19, "TA in-class deployment across year groups (17–95 pupils per deployment) + whole-cohort Academic Support"],
        ["Literacy", 9, "Fresh Start phonics, Galilee grammar (47 pupils), GCSE French/Spanish/RE intervention"],
        ["SEMH & mentoring", 10, "AllChild (Y9, 30), counselling, ELSA, empathy development, female mentoring (20), Y11 mentoring"],
        ["Behavioural & social", 5, "Romero Pass (98 pupils), English mentoring (31), targeted Y11 support"],
        ["Communication & Interaction", 3, "1:1 speech & language therapy (17 EHCP pupils), Lego Therapy (9)"],
        ["EAL & other", 8, "EAL support, literacy & numeracy 1:1s, maths intervention, autism outreach"]
      ],
      biggest: [
        ["Romero Pass", 98], ["Academic Support (largest deployment)", 95], ["Galilee Literacy", 47],
        ["English Mentoring", 31], ["AllChild Year 9", 30], ["GCSE French", 21],
        ["Female Mentoring", 20], ["Fresh Start phonics", 18], ["GCSE Spanish", 18],
        ["1:1 Speech & Language", 17], ["GCSE RE", 10], ["Lego Therapy", 9]
      ],
      note: "Pupil counts from the Provision Map report. This is the graduated response in action: universal TA deployment and academic support underneath, targeted small-group literacy and mentoring in the middle, specialist 1:1 therapy on top – every layer logged with start dates, end dates, staffing and review outcomes."
    },
    freshStart: {
      what: "Fresh Start (Read Write Inc.) – systematic phonics for KS3 pupils reading below age-related expectations, delivered in small groups and 1:1, two sessions a week, with parents called personally at enrolment. This is the intervention arm of the reading strategy (EEF: phonics +5 months for older struggling readers).",
      pairs: {
        labels: ["Pupil A", "Pupil B", "Pupil C", "Pupil D", "Pupil E", "Pupil F", "Pupil G", "Pupil H", "Pupil I"],
        before: [63, 42, 56, 71, 56, 44, 57, 70, 38],
        after: [18, 17, 19, 19, 32, 29, 25, 56, 32]
      },
      pairsNote: "Speed Sound recall times, seconds (lower is better) – entry vs July 2026, individual tracked pupils, anonymised. The best improvement is 71 → 19 seconds: a pupil reading sounds well over three times faster, described as 'very clear'. Clarity improved in every case; assessors note pupils who plateaued on speed instead gained markedly in pronunciation and are now working on prosody and fluency.",
      outcomes: "July review grades every pupil −1 to +2 with a written rationale: most graded +1/+2; pupils mid-programme carry a 0 and continue next year (modules tracked, e.g. 7→28, 12→31 of 33); one pupil graded −1 has the barrier named (focus and comprehension) and a plan. Honest grading – not everything marked a success – is what makes the +2s credible."
    },
    galilee: {
      what: "Galilee Literacy Intervention – explicit grammar teaching (verb tenses, punctuation, sentence construction) in small groups, three 50-minute sessions a week, 47 pupils. Pre- and post-assessed with question-level analysis.",
      gains: { labels: ["Pupil A", "Pupil B", "Pupil C", "Pupil D"], pct: [44, 39, 37, 27] },
      gainsNote: "Percentage-point gains between pre- and post-assessment for the fully assessed group. Raw-mark movement elsewhere is even starker: pupils moving from 27 to 102 marks, 10 to 91, 26 to 108 – several pupils tripled or quadrupled their scores. Teacher notes record the how: encouragement, resilience-building, group work – and name honestly the pupils who need 1:1 next (with two non-attenders flagged and parental agreement pursued)."
    },
    salt: {
      what: "Weekly 50-minute 1:1 speech and language therapy for 17 pupils – every one with an EHCP – working towards targets written by an NHS speech and language therapist and delivered by a trained learning support assistant.",
      points: [
        "Techniques with an evidence base: Shape Coding for grammar and syntax, narrative planners, barrier games, communication profiles.",
        "Session notes evidence progress against each pupil's own targets – grammatically correct sentences in active and passive voice, self-help strategies for communication breakdown, revision strategies carried home.",
        "The quiet story: therapy that families would wait months for through the NHS, timetabled weekly in school at no cost – for pupils in Years 7 to 11.",
        "This is what 'Guardian: the school that embodies Labour's hopes for special needs' looks like in a timetable."
      ]
    },
    closing: "Impact where it counts: EHCP pupils attend 9.13 points above the national EHCP figure; EHCP and SEN Support pupils made positive Progress 8 in 2024 (+0.07 / +0.13); only 2 of 59 off-site directions involved EHCP pupils because embedded plans keep complex needs in mainstream. The named risk – SEN K attainment declining since 2023 – is exactly what this provision map and the adaptive-teaching CPD are built to reverse, with EEF-aligned methods throughout (one-to-one +5, small-group +4, TA interventions +4, phonics +5, oral language high-impact).",
    asa: {
      headline: "Academic Support Assistants – graduate subject specialists who work both ends of the ability range: structured SEND support in class, and stretch for the most able through the St Thomas Aquinas Award.",
      aquinas: {
        stats: [["53", "Year 10 pupils completed the Aquinas Award"], ["24.5%", "of participants Pupil Premium (13 pupils)"], ["6", "academic pathways – ethics to RSA encryption"], ["1", "assessed independent project each, university-style"]],
        what: "Weekly academic seminars beyond the GCSE curriculum – ethics (the Trolley Problem), history/sociology podcasts, modular arithmetic and RSA encryption, psychology of music and memory, Spanish film analysis, spoken-word poetry – each ending in an assessed independent project. A taste of post-16 and university learning, with tangible evidence for sixth-form applications.",
        line: "Stretch is not reserved for the privileged: a quarter of Aquinas participants are Pupil Premium, and SEND pupils take part. The same graduate ASAs delivering structured SEND support run the most-able programme – one team, the whole ability range."
      }
    },
    lego: {
      headline: "Lego Therapy – nine pupils, three small groups, six sessions each: an evidence-based intervention (LeGoff & Sherman, 2006) where every pupil's therapy goals are written directly from their own EHCP Section E outcomes.",
      points: [
        ["EHCP-anchored, not generic", "Each pupil's plan maps their EHCP outcomes ('engage in short turn-taking conversations', 'coping skills in real social situations') to specific, observable Lego Therapy goals: perspective-taking, collaborative problem-solving, tolerating differing opinions, dialogical exchanges."],
        ["Structured to teach communication", "Pupils rotate engineer, builder and supplier roles, so every child must give, interpret and clarify instructions; the adult's role is deliberately minimal – draw attention to the problem, prompt pupils towards their own solution."],
        ["Session-by-session evidence", "Every session is logged and every pupil's goals reviewed against observed behaviour: initiating interactions unprompted ('where does it go?'), asking clarifying questions, offering help when a peer's build collapses, expressing frustration verbally – 'with a sigh and a smile' – rather than physically."],
        ["Pupils reflecting on their own growth", "By session five, groups were comparing how communication differed between free-build and structured sessions – metacognition about their own social skills – and closed with exit surveys. Attendance across the groups was near-perfect."]
      ],
      line: "This is what the provision map looks like at pupil level: a named child, an EHCP outcome, a measurable goal, six logged sessions and observed change. Nine times over."
    },
    allchild: {
      headline: "AllChild (formerly West London Zone) – a Link Worker embedded in the school, wrapping a two-year ecosystem of support around the Year 9 pupils most at risk of poor social, emotional and academic outcomes.",
      tiles: [
        ["30", "Year 9 pupils on the two-year AllChild Impact Programme (plus 5 in AllChild counselling)"],
        ["7 + 5", "hours per pupil per term of Link Worker support plus specialist partner sessions"],
        ["3", "family interactions per pupil per term – parents co-author each child's goals"],
        ["4", "specialist partners this year: therapeutic woodwork, counselling, spoken word, ReAct drama"]
      ],
      outcomes: {
        labels: ["Emotional literacy & regulation", "Communication & social skills", "Self-management & coping", "Identity & self-esteem", "Other"],
        pct: [31.3, 28.1, 28.1, 9.4, 3.1],
        note: "Short-term outcomes the cohort worked on in spring – a formal framework where each termly goal is a stepping stone to social, emotional, attendance and attainment pathway outcomes by the end of the two years. Goals are agreed three ways: pupil, Link Worker, parent."
      },
      engagement: "The Link Worker's own words: pupils who previously showed multiple disengaged behaviours 'now seek me or their teachers out to show us how many stars they have got in a week, or try increasingly hard to focus in lessons.' The reward currency they're chasing is our own Class Charts stars – the AllChild programme and the school's engagement systems reinforcing each other by design.",
      vignette: "One Year 9 pupil, managing difficult experiences at home, had a termly goal – agreed between his Link Worker and his mother – of expressing his feelings. Through therapeutic partner sessions he now shares feelings openly, works for rewards in lessons, and reflects on his behaviour when points are given. His parent wrote to thank the Link Worker: 'he speaks enthusiastically about those moments – they are important to him.'",
      intersections: [
        ["Attendance", "Family interactions and trusted-adult relationships target exactly the anxiety-driven, home-rooted absence the attendance strategy names – and the Emmanuel reintegration hub will formalise."],
        ["Engagement & behaviour", "Pupils chase Class Charts stars in lessons; goals address the emotional regulation behind behaviour points – the restorative arm of the behaviour system, delivered by a partner."],
        ["Outcomes", "Termly SEMH goals ladder into attainment pathway outcomes across the two years – Year 9 (our highest-OSD, lowest-engagement year) is precisely the right cohort."],
        ["Enrichment & voice", "ReAct drama (an AllChild partner) runs as an Elev:8 club; AllChild pupils co-designed stop-and-search recommendations with the Met, presenting at New Scotland Yard – citizenship, leadership and public speaking for the pupils least likely to get them."]
      ],
      community: "Beyond the gate: AllChild community days link families to local services over free food; the school sat in the first AllChild Schools Conference with the Reach Foundation. The partnership makes the school's inclusion work a neighbourhood project, not just a timetabled one."
    },
    emmanuel: {
      tagline: "Emmanuel – “God with us”. The next build: a dedicated SEN provision, funded and evidenced.",
      what: "A 55m² modular SEN provision building with three functions: a reintegration hub for pupils whose anxiety-driven (SEMH/autism) absence keeps them out of mainstream – managed, relational transitions from non-attendance and part-time timetables back to full-time education; a centralised multi-agency intervention space (educational psychology, speech & language, occupational therapy) aligned with the Government's 'Every Child Achieving and Thriving' White Paper; and an adapted Y7–8 literacy pathway – daily, low-cognitive-load lessons with explicit decoding, fluency and Tier 2/3 vocabulary pre-teaching, so pupils keep up rather than catch up.",
      funding: [
        ["£400k", "high-needs capital funding allocated under a signed RBKC agreement"],
        ["~£103k", "school contribution (including £45k contingency, unlikely to be needed on a modular build)"],
        ["£150–175k", "saved by value-engineering the footprint from 75m² to 55m²"],
        ["10–20", "pupils at a time on rolling intake, Y7–8 priority cohort already identified from data"]
      ],
      case: "The business case is triangulated from our own 2025–26 datasets: GL reading tests found 66 Y7–8 pupils significantly below expected (SAS<85 – one in six), nine of them functionally pre-reading (SAS<70), with a mean deficit of 51.8 months; 27 Y7–8 pupils sit below 85% attendance (78% of them Pupil Premium); and seven pupils account for over a third of all suspensions. Nine children appear in two or more of those datasets – the named priority cohort. The proposal even evidences its own diagnostic gap: the two highest-priority children couldn't be reading-tested because of their attendance – exactly what a reintegration hub exists to fix.",
      line: "This is what evidence-led innovation looks like at capital scale: the same triangulation discipline as Elev:8, applied to a building – identified need, secured funding, value-engineered design, measurable outcomes named before a brick is laid."
    }
  },

  /* ---------- External case: Ofsted IDSR + Pupil Premium strategy ---------- */
  external: {
    intro: "Two documents close the case. The Inspection Data Summary Report is Ofsted's own pre-inspection briefing, generated from national data, released 15 May 2026 – inspectors read it before they arrive. It flags this school 'Above (sig+)' on 75 separate 2024 measures, every row carrying the context tag 'High – FSM'. The Pupil Premium Strategy Statement shows the machinery that produced those flags: £371,950 deployed through the EEF's tiered model, signed off by governors. Their story, our strategy, one picture.",
    tiles: [
      ["75", "measures flagged 'Above (sig+)' in Ofsted's own IDSR for 2024 – with zero significant negatives that year"],
      ["High – FSM", "the context tag Ofsted's system prints on every row: these results happened in one of the most deprived intakes in the country"],
      ["£371,950", "Pupil Premium budget 2025–26, deployed through the EEF tiers and authorised by the Board of Governors"],
      ["88.6% vs 87.4%", "FSM attendance vs national FSM in the IDSR's own in-year data – the strategy's named attendance challenge, already answered"]
    ],
    sig: {
      labels: ["Attainment 8", "Disadvantaged A8", "5+ English & Maths", "Disadv. 4+ E&M", "English P8: +0.86", "Open element P8: +1.03", "EBacc language entry"],
      school: [53.9, 46.5, 61.5, 65.6, null, null, 89.9],
      national: [45.9, 34.6, 45.9, 43.4, null, null, 71.6],
      note: "A selection of the 75 'Above (sig+)' flags, school vs national (2024). The pattern Ofsted's own system found: significantly above on whole-school measures, and significantly above AGAIN when it isolates disadvantaged pupils – A8 46.5 vs a national disadvantaged 34.6, 4+ English & Maths 65.6% vs 43.4%. English Progress 8 +0.86, the open element +1.03, EBacc language entry 89.9% vs 71.6%."
    },
    pp: {
      headline: "The Pupil Premium strategy is the mechanism, published and governed: intent rooted in John 10:10, challenges named with data, every activity costed against EEF evidence, reviewed annually by governors.",
      tiers: { labels: ["Teaching first", "Targeted academic support", "Wider strategies"], amounts: [201416, 104504, 66030],
        note: "£201,416 on teaching (smaller KS3 classes – reduced by ~10 pupils, the EEF's impact threshold; the coaching CPD model; IRIS Connect), £104,504 on targeted support (ASAs' 1:1 and small-group tuition, compulsory after-school study with a hot supper, Thinking Reading, Bedrock, the PP higher-attainers programme), £66,030 on wider strategies (Extended Schools, Elev:8, the attendance team, uniform, breakfast club, AllChild's two on-site staff). The EEF tiered model, not as a slogan but as a budget." },
      loops: [
        ["Named challenge: FSM6 attendance 0.3 below national", "Closed: the IDSR's own in-year data now shows FSM attendance ABOVE national (88.6% vs 87.4%) – the strategy's attendance investment, verified by Ofsted's system within the same cycle."],
        ["Named challenge: 61% of PP pupils below age-related reading", "Moving, measured: summer tests show Y7 & Y10 mean SAS at/above 100 and Y10 'expected & above' +6.8pp; ⅔ of Fluency-group improvers are PP; 100% of PP pupils on the Y10 English intervention maintained or improved. Behind it: Thinking Reading (75% met age-expected reading age), Bedrock diagnostics, Fresh Start (3× faster recall), whole-staff CPD at 92%."],
        ["Named investment: compulsory after-school study with a hot supper", "Impact now logged: homework-related negative logs for the PP Compulsory Study cohort fell 49.2% across the year (305 → 155), with 80% of tracked pupils improving; the SEN Homework Club (all 33 attendees PP) cut negative incidents 38.5%. The targeted tier, verified in the school's own behaviour data."],
        ["Named challenge: PP attainment gap (predicted 4.63 vs 5.63)", "Attacked through the teaching tier first – smaller classes, coaching – plus the higher-attainers programme, exactly where the Sutton Trust says disadvantage bites hardest."],
        ["Named challenge: cultural capital and trip costs", "Answered as entitlement: subsidised trips, free uniform and PE kit, Elev:8's residential and London Leaders, clubs at PP parity – participation tracked, not hoped for."]
      ],
      honest: "The IDSR hands us two flags and we take both. Destinations for disadvantaged leavers dipped (sustained education 76%, flagged below; 9% of one cohort's destinations not sustained) – which is precisely why personal guidance now scores 100% on Gatsby, every Y10 completes work experience, and sustained AND longer-term destinations are tracked as Benchmark 3 evidence. And the support-staff ratio sat in the lowest 20% in 2024 – answered since by the graduate ASA investment the PP strategy funds. Ofsted's system found two gaps; both already had money and a plan against them."
    },
    triangle: "Three independent sources, one picture: Ofsted's IDSR says the outcomes are exceptional in this context (75 sig+ flags, High-FSM on every row). This portal's internal data shows the systems producing them, live. The PP strategy shows the money following the evidence (EEF tiers, governor-signed). External verdict, internal machinery, published strategy – triangulated. That is what 'transformational for disadvantaged pupils' looks like when three different documents agree."
  },

  /* ---------- PSHE / Life Curriculum ---------- */
  pshe: {
    intro: "The SEF named PSHCE consistency as an honest weakness. This is the answer, built: five complete schemes of work, Years 7 to 11, 173 sequenced lessons – every one carrying learning objectives, misconception-led adaptive teaching, curriculum pillar tags, Tier 3 vocabulary, homework and a revision-and-assessment lesson each half term, with pupil understanding tracked through a termly PSHE survey.",
    tiles: [
      ["173", "sequenced lessons across five complete schemes of work, Y7 to Y11"],
      ["Every lesson", "carries misconceptions and scaffolds – the same adaptive-teaching discipline as the main curriculum"],
      ["6 pillar tags", "per lesson where relevant: Careers, Citizenship, British Values, Health & Wellbeing, Digital Literacy, Economic Education"],
      ["Termly", "assessment plus a tracked PSHE survey – impact measured, not assumed"]
    ],
    journey: [
      ["Year 7", "Foundations", "Identity and self-awareness · healthy balanced lifestyle · online safety and digital citizenship · first aid and protected characteristics · bullying and respectful relationships · environmental awareness"],
      ["Year 8", "Navigating adolescence", "Emotional literacy · relationships and communication (statutory RSE) · equal opportunities and diversity · substance abuse and peer pressure · media influence and body image · responsibility and financial literacy"],
      ["Year 9", "Looking outward", "Mental health and wellbeing · active citizenship · global issues · careers and employability skills · digital footprint and online reputation · health and first aid"],
      ["Year 10", "Real-world readiness", "Financial management and budgeting · crime and the community · responsible citizenship and civil life · career exploration and work experience · revision techniques and managing stress"],
      ["Year 11", "Preparing for adulthood", "The transition to adult life · healthy lifestyle choices · financial literacy: taxes and payslips · online safety and digital footprint · revision techniques and managing exam stress"]
    ],
    journeyNote: "A deliberate five-year spiral: from knowing yourself (Y7) to running your adult life (Y11). RSE delivered statutorily in Y8 and revisited; careers threads through Y9 and Y10 to meet Gatsby Benchmark 4; British Values tagged lesson-by-lesson – the named Year 9 articulation priority now has a taught backbone, not just assemblies.",
    design: [
      ["Misconception-led", "Every lesson names the misconception to defeat ('tax is stealing', 'saving is only for the rich') and the scaffold to reach every pupil – PSHE taught with the same rigour as Maths."],
      ["Literacy built in", "Tier 3 vocabulary specified per lesson at 'all pupils / some pupils' levels – the whole-school reading strategy running through personal development."],
      ["Pillar-tagged", "Lessons tagged to Careers, Citizenship, Fundamental British Values, Health & Wellbeing, Digital Literacy and Economic Education – coverage is auditable at a glance."],
      ["Measured", "A revision and assessment lesson closes every half term, and the tracked PSHE survey shows what pupils actually retained – feeding the next scheme revision."]
    ],
    closing: "Where it lands across the portal: Gatsby BM4's KS3 gap is answered by the careers-tagged lessons now in every year's scheme; the British Values priority gets taught content, not exhortation; and the pupil panel's honest flags (knowing who to talk to, revision skills) each have a named lesson home. Found weak, rebuilt strong, tracked termly."
  },

  /* ---------- Student & Parent Voice (2025-26 surveys) ---------- */
  voice: {
    intro: "Over 700 survey and panel responses across seven instruments this year – two parent surveys (Y7 n=52, Y10 n=30), a whole-school pupil panel (n=43), Culture Day (n=416), All Saints Day (n=97), Y10 Careers Day (n=33) and a KS3 revision-workshop panel (n=25). The pattern is consistent: parents are emphatic, big-event data is outstanding, and the candid pupil panels tell us exactly where to keep improving – in areas we had already named.",
    parents: {
      n: 82,
      headline: [
        ["100%", "of parents say their child feels safe at school (82/82 – every single response, both year groups)"],
        ["100%", "would recommend All Saints to other parents (84% 'very likely')"],
        ["100%", "satisfied with the quality of teaching (76% 'very satisfied')"],
        ["99%", "say enrichment opportunities are valuable (82% 'very valuable')"]
      ],
      themes: {
        labels: ["Child feels safe", "Safe & respectful environment", "Would recommend", "Teaching quality", "Enrichment valuable", "Appropriately challenged", "Communication effective", "Views listened to", "Child happy"],
        pct: [100, 99, 100, 100, 99, 94, 95, 94, 95]
      },
      themesNote: "Combined Y7 + Y10 parent surveys (n=82), % positive ('yes' or satisfied/likely and above). Y7 transition from primary rated 4 or 5 out of 5 by 87% of parents; 29 of 30 Y10 parents call reports and parents' evenings 'very helpful'."
    },
    events: [
      ["Culture Day", 416, "90% enjoyed the day (3–4 on a 4-point scale)", "94% said the day made them feel they belonged to the All Saints community"],
      ["All Saints Day", 97, "Pupils' favourite moments: the production, team-building and house events", "Feedback loop live: pupils' suggestions shape next year's day – benchmark 8 in action"],
      ["Y10 Careers Day", 33, "76% rated the day 4 or 5 out of 5", "Employer sessions (banking, The Economist, data analytics, youth work) cited as eye-opening; pupils asked for more options – which we're adding"],
      ["KS3 Revision Workshop panel", 25, "Pupils speak the language of the T&L Handbook unprompted: make–do–review, shadow papers, retrieval, flashcards, spaced practice – and say the sessions have made them more confident and less nervous", "Honest flag logged verbatim: several pupils can't yet name their exam boards or find accurate past papers independently – recorded as a named teaching point for every department, with a parent-facing revision guide requested by pupils themselves"]
    ],
    students: {
      n: 43,
      positives: [
        ["91%", "agree the school encourages kindness, respect and helping others"],
        ["100%", "feel safe at school at least sometimes – 70% 'often' or 'always'"],
        ["74%", "agree people are treated fairly here regardless of gender, race or faith"],
        ["72%", "feel comfortable being themselves at school"]
      ],
      honest: [
        ["Only 37% say their opinions are 'often/always' listened to", "Already a named SEF priority: student voice opportunities embedded across the year (DWI/NKE), with the Culture Day 'you said, we listened' loop as the model."],
        ["51% are certain who to talk to about a worry or idea", "Safeguarding team visibility campaign from September – the safeguarding review found children do know the team; this tells us to keep reinforcing it every term with every cohort."],
        ["56% say staff deal with unkind behaviour 'often/always'", "Feeds the restorative-practice strand and the behaviour communication plan – pupils see the sanction, we need them to see the follow-through."]
      ],
      honestNote: "A deliberately candid 43-pupil panel – small n, unfiltered answers. We publish it to inspectors unprompted: every flag it raises was already a named, owned priority before the survey closed. That is what a listening school looks like."
    },
    quotes: [
      { theme: "Safety & safeguarding", who: "Year 7 parent", text: "Safeguarding and informing about current ongoing situations." },
      { theme: "Safety & safeguarding", who: "Pupil, whole-school panel", text: "What does the school do well? Keeping students safe. The safeguarding team." },
      { theme: "Teaching", who: "Pupil, whole-school panel", text: "The school organises and teaches a subject really well and clearly – and the events are simply outstanding." },
      { theme: "Teaching", who: "Year 7 parent", text: "They helped boost confidence in all subjects." },
      { theme: "Teaching", who: "Year 10 parent", text: "Helping children to understand how to be successful for their GCSEs – keeping parents informed about gradual steps of expected revision and learning." },
      { theme: "Belonging & enrichment", who: "Pupil, Culture Day", text: "Everyone gets a chance to feel proud of who they are and where they come from." },
      { theme: "Belonging & enrichment", who: "Pupil, Culture Day", text: "To serve as a reminder that our diversity brings us closer together." },
      { theme: "Belonging & enrichment", who: "Pupil, whole-school panel", text: "The school makes sure everyone feels accepted no matter what." },
      { theme: "Behaviour & values", who: "Pupil, whole-school panel", text: "Not tolerating discrimination or racism, because of race or religion. Includes everyone." },
      { theme: "Behaviour & values", who: "Pupil, whole-school panel", text: "Being kind to one another to establish a community of kindness and harmony." },
      { theme: "Transition & communication", who: "Year 7 parent", text: "Relaying information and making the transition from primary easy." },
      { theme: "Transition & communication", who: "Year 7 parent", text: "Communication from the school has always been excellent." },
      { theme: "Careers", who: "Year 10 pupil, Careers Day", text: "Banking – I wanted to do it in the past, and this gave me a real understanding of what to do to achieve it." },
      { theme: "Targeted support", who: "Parent of a pupil on the AllChild Impact Programme", text: "Thank you for the support and care you have been giving my son. He speaks enthusiastically about those moments – they are important to him. Thank you for all your work and dedication." }
    ]
  },

  /* ---------- Careers: Compass+ vs Gatsby Benchmarks ---------- */
  careers: {
    intro: "In a school where 44% of pupils are FSM, careers guidance cannot be left to families to buy privately – so here, every pupil gets it. Personal guidance for all, destinations tracked into the long term, employer days pupils quote by name, and a business-leadership programme inside the extended day. Measured against the refreshed 2024 Gatsby Benchmarks – the tougher framework that only became statutory in September 2025 – the programme scores 92% overall, with full marks on the benchmarks that matter most for this community.",
    offer: [
      ["Personal guidance – every pupil", "1:1 careers guidance for all, with the advice given to each pupil systematically tracked. Gatsby Benchmark 8: 100%."],
      ["Built for this community", "Aspirations raised, stereotypes challenged, diverse role models and alumni; personalised support for disadvantaged and SEND pupils; destinations followed beyond the school gate – sustained and longer-term. Benchmark 3 (the inclusion benchmark): 100%."],
      ["Employers pupils remember", "Y10 Careers Day with banking, The Economist, data analytics and youth work – rated 4–5/5 by 76% of pupils, sessions quoted by name in feedback."],
      ["The world of work inside the school day", "London Leaders (Elev:8): stars earned for effort and participation, top 20 winning an immersive leadership day with central-London businesses."]
    ],
    tiles: [
      ["100%", "Personal guidance (Benchmark 8) – every pupil, tracked"],
      ["100%", "Addressing the needs of each pupil (Benchmark 3) – the inclusion benchmark"],
      ["92%", "average across all eight refreshed Gatsby Benchmarks"],
      ["2", "full Compass+ evaluations this year, identical scores – a stable, honestly-scored programme"]
    ],
    scores: {
      labels: ["1. Stable programme", "2. Career & LMI", "3. Needs of each pupil", "4. Curriculum links", "5. Employer encounters", "6. Workplace experiences", "7. FE & HE encounters", "8. Personal guidance"],
      pct: [100, 95, 100, 75, 88, 87, 90, 100]
    },
    scoresNote: "Self-assessed rigorously and conservatively on Compass+, twice this year (December and March), against the refreshed 2024 benchmarks – with sub-question evidence behind every score. No benchmark sits below 75%.",
    benchmarks: [
      { n: 1, title: "A stable careers programme", score: 100,
        evidence: "Trained Careers Leader; explicit backing of Headteacher and governors; programme published on the website in accessible formats; linked to the school development plan; sequenced learning outcomes; evaluated with feedback from pupils, parents, teachers, support staff, advisers AND employers – every sub-question achieved." },
      { n: 2, title: "Learning from career and labour market information", score: 95,
        evidence: "Almost all pupils (91–99%) at KS3 and KS4 access good-quality, current labour-market information; parents actively encouraged and supported to use it, with tailored information sent home; almost all staff equipped to reference it." },
      { n: 3, title: "Addressing the needs of each pupil", score: 100,
        evidence: "The inclusion benchmark – full marks. Aspirations actively raised, stereotypes challenged, diverse role models showcased (all 'strongly agree'); alumni used; every pupil's participation, advice and destinations systematically recorded and shared; personalised support for disadvantaged and SEND pupils; sustained AND longer-term destination data used to evaluate the programme." },
      { n: 4, title: "Linking curriculum learning to careers", score: 75,
        evidence: "Careers visible in most Year 9+ curriculum time and for most staff – with KS3 embedding scheduled into Schemes of Work from September alongside the oracy pillar." },
      { n: 5, title: "Encounters with employers and employees", score: 88,
        evidence: "Meaningful employer encounters running across year groups – the Y10 Careers Day (banking, The Economist, data analytics, youth work) rated 4–5/5 by 76% of pupils." },
      { n: 6, title: "Experiences of workplaces", score: 87,
        evidence: "Every Year 10 pupil completed a week-long work experience placement (29 June–3 July), on top of PA Consulting and EY Foundation workplace visits – with London Leaders immersive business days extending reach through the extended day." },
      { n: 7, title: "Encounters with further and higher education", score: 90,
        evidence: "Year 10 visited Oxford University, Westminster University, West London College, LAMDA and a St Charles taster day this year; the Brilliant Club Scholars Programme took Year 9 (70% disadvantaged) through to an Oxford graduation." },
      { n: 8, title: "Personal guidance", score: 100,
        evidence: "Every pupil accesses personal careers guidance – full marks on every sub-question. In a school where 44% are FSM, individual guidance is not left to families to buy privately." }
    ],
    devplan: "Compass+ names the specific next steps, and each already sits in the SEF careers priority (live for September): careers embedded into KS3 Schemes of Work with staff CPD; structured purpose-briefs for every employer and FE/HE encounter; workplace experiences extended to more pupils via the employer network and London Leaders; pupil use of labour-market information tracked. Found by our own evaluation, twice – that is what Benchmark 1 calls a stable programme.",
    voiceTie: "Pupil voice backs the scores: 76% rated Y10 Careers Day 4–5/5, with employer sessions cited by name – 'banking… gave me a real understanding of what to do to achieve it.'",
    events: {
      total: 30,
      headline: "Thirty careers, citizenship and personal-development events delivered September to July – a programme, not a gesture. Every Year 10 pupil: a week-long work experience placement, a university visit and a post-16 taster day. Targeted aspiration programmes reserved for disadvantaged pupils.",
      byCategory: [["Careers", 13], ["Citizenship / PSHCE", 10], ["Personal Development", 7]],
      highlights: [
        ["Whole-cohort entitlement (Y10)", "Week-long work experience (29 Jun–3 Jul) · Oxford University and Westminster University visits · West London College trip · St Charles taster day · LAMDA performing-arts pathway · PA Consulting trip · Careers Day with employer sessions."],
        ["Aspiration, targeted at disadvantage", "Brilliant Club Scholars Programme for Year 9 (70% disadvantaged) culminating in an Oxford University graduation · EY Foundation careers workshop (PP pupils only) · Girls' Network confidence & communication workshops (Y9 PP only)."],
        ["Employers & institutions in the room", "Guinness Associates Y11 assembly · Home Office visit · St Charles careers fair · Jack Petchey speak-out programme (30 pupils) with a regional final hosted in our hall."],
        ["Citizenship lived, not taught", "Politics Week with a whole-school Election Day and a Parliament trip · City Hall trips for Y7 and Y8 · an MP's public event · International Women's Day · Macmillan coffee morning."],
        ["Character & challenge", "Duke of Edinburgh Bronze practice and assessed expeditions · Elev:8 residential launching the year."]
      ],
      note: "Every event dated and logged 2025–26 – the delivery record behind the Compass+ scores, and direct evidence for Gatsby benchmarks 5 (employers), 6 (workplaces) and 7 (FE/HE encounters)."
    }
  },

  /* ---------- Safeguarding culture (July 2026 report) ---------- */
  safeguardingReport: {
    headline: "Safeguarding at All Saints is not a policy folder – it is a culture. The external audit described the evidence base as “exemplary”, and a school culture of “always striving to be better”.",
    training: [
      "Every member of staff (145) trained: KCSIE Level 1 (annual), Prevent Duty (LA-delivered), online safety, FGM (external specialist)",
      "12-strong DSL/DDSL team, all Level 3 trained on a 2-year cycle; Operation Encompass trained (June/July 2026)",
      "Safer Recruitment trained admin + Headteacher + DSL; Single Central Record fully compliant, regularly audited",
      "Scenario-based training and learning from serious case reviews (incl. Child Practice Review) used through the year",
      "Monthly online-safety newsletters to families – 10 editions this year covering AI, nudify apps, the manosphere, deepfakes, group chats and more (published on the school website)"
    ],
    culture: [
      "“Exemplary” evidence base (external Safeguarding Review, Jan 2026); DSL action plan produced within one month; immediate actions complete",
      "Leaders can describe 'what lies beneath' at individual-pupil level across safeguarding, bullying, behaviour and SEND – the audit's words",
      "Every member of staff knows the 5 Rs: Recognise, Respond, Report, Record, Refer; daily safeguarding updates in pastoral morning meetings",
      "Pupil voice confirms every child knows who the safeguarding team are and who to talk to; all pupils know how to reach Childline",
      "CPOMS records are accurate and live – with evidence of the school appropriately challenging social care responses when children need more",
      "Securus digital monitoring protects pupils online across school systems",
      "Vigilance is logged, not hidden: 45 bullying and 5 racist incidents recorded and acted on this year; 11 social-care referrals in the summer term; 41 active or pending Early Help cases tracked pupil-by-pupil – a school that sees things, records them and follows through"
    ],
    permeates: [
      ["Attendance", "Safeguarding and attendance are one machinery: home visits for every severely absent pupil logged on CPOMS, external agency support for every pupil below 50%, and the DSL leads both."],
      ["Inclusion & SEND", "16 external partnerships (CAMHS ×2 boroughs, art therapy, NHS SaLT & OT, autism outreach, AllChild – formerly West London Zone – with an embedded Link Worker, GRIT) wrap around vulnerable pupils; EHCP pupils attend 9.13 points above national."],
      ["Curriculum", "Online safety, Prevent themes and healthy relationships taught through PSHCE; monthly family newsletters extend the curriculum home."],
      ["Community", "Supermarket vouchers, free uniform and PE kit for every family (alumni-funded), free Y11 prom tickets, Catholic Children's Society funds – dignity as safeguarding."],
      ["Transition", "Vulnerable incoming Y7 pupils identified before arrival; Y6 transition meetings carry structured safeguarding and attendance questions."],
      ["System leadership", "The DSL audited a Westminster primary school (June 2026), spoke at a national attendance conference, and the school sits in the DfE RISE Behaviour & Attendance Hub – our safeguarding practice is strong enough that other schools borrow it."]
    ]
  },

  /* ---------- Graph hierarchy: click a node → sub-categories → data points ---------- */
  graphTree: {
    attendance: [
      { label: "Above national, against the odds", kids: ["Beats national AND similar schools", "Improving at 4\u00d7 the DfE expectation", "Pre-pandemic recovery nearly complete"] },
      { label: "Works hardest for the vulnerable", kids: ["EHCP culture: far above national", "FSM6 above national too", "SEN Support: the named gap, planned"] },
      { label: "The Year 11 question", kids: ["Anxiety + entrenched cases, not weak systems", "Audits, contracts, home visits", "Counterpoint: most improved on their own Y10"] },
      { label: "Data you can trust", kids: ["DfE errors found by US", "Escalated and documented", "FFT benchmark is the anchor"] }
    ],
    behaviour: [
      { label: "A calmer school, year on year", kids: ["Fewer suspensions, fewer pupils involved", "Calmer classrooms every day", "Four coherent years, not one good one"] },
      { label: "Inclusion without exclusion", kids: ["Zero PEX: the graduated route", "Emmaus and OSD instead of the gate", "Reintegration, never repetition"] },
      { label: "Accountable decisions", kids: ["Headteacher authorises every suspension", "Every past PEX explicable", "SENCo and DSL in the room"] },
      { label: "The equity question", kids: ["Disproportionality self-identified", "Support raised, expectations held", "Owned plans, dated reviews"] }
    ],
    enrichment: [
      { label: "An entitlement, not an offer", kids: ["Tracked pupil by pupil", "Parity for PP and SEN", "Cost barriers removed for all"] },
      { label: "The attendance engine", kids: ["Members attend markedly better", "Belonging is the mechanism", "Next: prescribed for absentees"] },
      { label: "Elev:8 \u2013 the dip inverted", kids: ["Built from Jerrim + our own data", "Y8 now the most engaged year", "The Elev:9 question"] }
    ],
    achievement: [
      { label: "Sustained against the odds", kids: ["Three years above national", "Priors fell, standards held", "2026 on trajectory"] },
      { label: "Disadvantaged pupils thrive", kids: ["Beat national non-disadvantaged", "Sustained, not a spike", "In a top-quintile-deprivation school"] },
      { label: "The honest edges", kids: ["The gap: named and levered", "SEN Support slide: the plan", "Subject focus: English Language, Science"] }
    ],
    inclusion: [
      { label: "Need rising, provision ahead of it", kids: ["EHCPs up every single year", "50+ provisions, free to families", "Needs known before arrival"] },
      { label: "Impact you can measure", kids: ["Reading interventions with proof", "Therapy to NHS-written targets", "One graduate team, whole ability range"] },
      { label: "The next move", kids: ["Emmanuel: funded and evidenced", "SEN Support reversal by 2027"] }
    ],
    curriculum: [
      { label: "Codified, not assumed", kids: ["The All Saints Way handbook", "Research-cited ingredients", "One shared language in every drop-in"] },
      { label: "Checked and believed", kids: ["Teaching verified against own targets", "Parents unanimous on quality", "Pupils speak the pedagogy back"] },
      { label: "The reading question", kids: ["We found it and screen for it", "Whole-staff CPD, provably landed", "Route to Exceptional is named"] }
    ],
    personal: [
      { label: "The frameworks followed us", kids: ["DfE benchmarks met on publication day", "Gatsby: rigorous, twice-run", "Guidance nobody has to buy"] },
      { label: "Every pupil, by design", kids: ["Trips and events guaranteed", "Aspiration targeted at disadvantage", "Pupil voice shapes the offer"] },
      { label: "Character in practice", kids: ["Faith lived through service", "DofE, Aquinas, London Leaders", "British Values: the Year 9 push"] }
    ],
    leadership: [
      { label: "Sustained, not lucky", kids: ["Every area high or improving", "Through 41% roll growth", "Validated far beyond the gate"] },
      { label: "Transformational for the vulnerable", kids: ["Resource follows need, visibly", "The outcomes prove the choices", "Ambition at capital scale"] },
      { label: "Nothing unaddressed", kids: ["Every weakness owned and dated", "Self-identified, not imposed", "Governance challenge on record"] }
    ],
    safeguarding: [
      { label: "A culture, verified", kids: ["\u2018Exemplary\u2019 \u2013 external audit", "Everyone trained, every year", "Children know who to tell"] },
      { label: "Systems that see", kids: ["Live records, challenged upward", "Digital monitoring in place", "Vigilance logged, never hidden"] },
      { label: "Beyond the gate", kids: ["Families supported with dignity", "The DSL audits other schools", "Transition starts in Year 6"] }
    ],
    ethos: [
      { label: "Lived daily, not displayed", kids: ["Prayer, work, service", "Service with Colour", "Sanction always with reconciliation"] }
    ],
    coaching: [
      { label: "Chosen, not imposed", kids: ["Teachers picked the school\u2019s priority", "Honest written self-reflection", "Coached from draft to precision"] },
      { label: "Development that shows", kids: ["Observed against their own goals", "Early-career staff made consistent", "Reading CPD reached everyone"] }
    ],
    data: [
      { label: "No pupil invisible", kids: ["One row per child, all joined", "Notes, not just numbers", "A governors\u2019 view built in"] },
      { label: "Data that triggers action", kids: ["SLT mentors for the highest-risk", "Revision engineered from mocks", "KS3 gaps closed in-year"] }
    ],
    pastoral: [
      { label: "One machinery with safeguarding", kids: ["Home visits, always logged", "Contracts before September", "Agencies pulled in early"] },
      { label: "AllChild embedded", kids: ["A Link Worker on site", "Families co-author the goals", "Year 9: exactly the right cohort"] }
    ],
    innovation: [
      { label: "Ahead of the frameworks", kids: ["Extended day preceded the DfE\u2019s", "Phone-free before the debate", "Retention experiments that stuck"] },
      { label: "A national platform", kids: ["Press across the world", "Policy influence at the very top", "Other schools come to learn"] }
    ],
    disadv: [
      { label: "The headline", kids: ["Beat national non-disadvantaged", "Sustained three years", "Attendance above national too"] },
      { label: "How it is done", kids: ["Teaching first \u2013 the EEF tiers", "Enrichment as entitlement", "Aspiration individually targeted"] }
    ],
    "send-out": [
      { label: "Cared for", kids: ["Attendance far above national", "Kept in mainstream, deliberately", "Two specialist centres"] },
      { label: "Progressing", kids: ["Positive progress, both groups", "Every intervention measured", "Pupil and parent voice heard"] }
    ],
    reading: [
      { label: "The defining challenge", kids: ["Half arrive below age-related", "A severe tail, years behind", "Where disengagement begins"] },
      { label: "The whole-school answer", kids: ["Every teacher trained in reading", "Screen, group, teach, measure", "Emmanuel: a daily pathway next"] }
    ],
    gap: [
      { label: "Understand it honestly", kids: ["Both groups sit above national", "Success is what widened it", "Not a failing cohort"] },
      { label: "Close it deliberately", kids: ["Adaptive teaching lever", "Attendance lever", "Milestones set and reviewed"] }
    ],
    y11att: [
      { label: "Diagnose before defending", kids: ["A small, entrenched group", "Anxiety, not apathy", "Predates the current systems"] },
      { label: "Act, and show it works", kids: ["Audited cause by cause", "Families contracted early", "Most improved on their own Y10"] }
    ],
    dispro: [
      { label: "Face it, fix it", kids: ["Found by our own analysis", "Named groups, named owners", "Expectations never lowered"] }
    ],
    emmanuel: [
      { label: "Why build", kids: ["Three datasets, one cohort", "The cycle it interrupts", "Reaches the un-testable children"] },
      { label: "Why trust it", kids: ["Borough-funded, school-led", "Value-engineered, not gold-plated", "Outcomes named before bricks"] }
    ]
  },

  /* ---------- Graph extras: expandable satellites + sidebar charts per node ---------- */
  graphExtras: {
    leadership: {
      children: ["Advises Secretary of State", "Every priority has an owner", "Named workload trade-offs", "£400k capital secured"],
      spark: { title: "Progress 8 under this leadership", type: "line", labels: ["2023", "2024", "2025*", "2026p"], series: [{ label: "ASCC", data: [0.12, 0.69, 0.76, 0.74] }, { label: "National", data: [-0.03, -0.03, null, null], dash: true }] }
    },
    curriculum: {
      children: ["T&L Handbook v2", "Curriculum Pillars", "T&L 2.08 · 80% strong", "Reading CPD 92%"],
      spark: { title: "Staff development targets by domain (%)", type: "bar", labels: ["Instr.", "Assess.", "Routines", "Adaptive", "Dialogic"], series: [{ label: "Final targets %", data: [13, 15, 3, 45, 25] }] }
    },
    achievement: {
      children: ["P8 +0.69 (2024)", "A8 5.39 vs 4.59", "82% 4+ E&M predicted", "3 yrs above national"],
      spark: { title: "Progress 8 vs national", type: "bar", labels: ["2023", "2024", "2025*", "2026p"], series: [{ label: "ASCC", data: [0.12, 0.69, 0.76, 0.74] }, { label: "National", data: [-0.03, -0.03, null, null], grey: true }] }
    },
    attendance: {
      children: ["92.41% overall", "EHCP +9.13", "4× DfE expectation", "PA 20.9% → <20%"],
      spark: { title: "Attendance vs benchmarks (%)", type: "bar", labels: ["ASCC", "National", "Similar"], series: [{ label: "2025/26", data: [92.41, 91.63, 90.19] }], min: 88 }
    },
    behaviour: {
      children: ["PEX 7→3→2→0", "Suspensions −43.9%", "Internal log −33%", "OSD: 59 placements"],
      spark: { title: "Fixed-term suspensions by year", type: "bar", labels: ["22–23", "23–24", "24–25", "25–26"], series: [{ label: "Suspensions", data: [262, 319, 183, 143] }] }
    },
    personal: {
      children: ["Gatsby 92%", "8/8 DfE benchmarks", "30 events delivered", "Voice: 94% belong"],
      spark: { title: "Gatsby benchmark scores (%)", type: "bar", labels: ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"], series: [{ label: "Compass+", data: [100, 95, 100, 75, 88, 87, 90, 100] }] }
    },
    inclusion: {
      children: ["50+ provisions · £0", "SaLT: 17 EHCP pupils", "Aquinas: 53 (24.5% PP)", "Fresh Start 3× faster"],
      spark: { title: "Fresh Start Speed Sounds (secs, lower = better)", type: "bar", labels: ["A", "B", "C", "D", "E"], series: [{ label: "Entry", data: [63, 42, 56, 71, 57], grey: true }, { label: "July", data: [18, 17, 19, 19, 25], green: true }] }
    },
    safeguarding: {
      children: ["Audit: “exemplary”", "145 staff trained", "100% parents: safe", "5 Rs known by all"],
      spark: { title: "Parents: child feels safe (n=82)", type: "doughnut", labels: ["Yes", "No"], series: [{ label: "Responses", data: [82, 0] }] }
    },
    ethos: {
      children: ["Orare · Laborare · Servire", "Service with Colour", "Faith in Action"],
      spark: null
    },
    coaching: {
      children: ["54 self-reflections", "45% chose the priority", "40 coached targets", "6-Minute Takeaways"],
      spark: { title: "Draft focus → final target (% of staff)", type: "bar", labels: ["Instr.", "Assess.", "Routines", "Adaptive", "Dialogic"], series: [{ label: "Draft", data: [22, 13, 9, 35, 20], grey: true }, { label: "Final", data: [13, 15, 3, 45, 25] }] }
    },
    data: {
      children: ["KS4 trackers: 1 row/pupil", "20 SLT-mentored Y11s", "65 → shoulder groups", "QoB cycles ×3"],
      spark: { title: "KS3 E&M on-track: Mich → Lent (%)", type: "bar", labels: ["Y7", "Y8", "Y9"], series: [{ label: "Michaelmas", data: [49, 38, 27], grey: true }, { label: "Lenten", data: [59, 65, 44] }] }
    },
    enrichment: {
      children: ["404 pupils (45%)", "3,695 attendances", "Members +7.2 att.", "Elev:8 Y8: 91%"],
      spark: { title: "% of year group in clubs", type: "bar", labels: ["Y7", "Y8", "Y9", "Y10", "Y11"], series: [{ label: "% in ≥1 club", data: [73, 91, 29, 21, 4] }] }
    },
    pastoral: {
      children: ["Home visits → CPOMS", "Attendance Contracts", "Agency support <50%"],
      spark: { title: "Attendance: members vs non-members (%)", type: "bar", labels: ["All", "PP", "SEN"], series: [{ label: "Club members", data: [94.52, 92.41, 92.65] }, { label: "Non-members", data: [87.28, 82.99, 80.55], grey: true }], min: 75 }
    },
    innovation: {
      children: ["60+ media items", "12-hour day", "Teacher lie-ins", "Frameworks followed us"],
      spark: { title: "Media coverage by category", type: "doughnut", labels: ["National", "Education", "International", "Catholic", "Official", "Social"], series: [{ label: "Items", data: [15, 26, 6, 5, 9, 5] }] }
    },
    disadv: {
      children: ["P8 +0.26 vs −0.57", "Beat national non-disadv.", "FSM6 att. +1.70"],
      spark: { title: "Disadvantaged P8 vs national disadvantaged", type: "bar", labels: ["2023", "2024", "2025*"], series: [{ label: "ASCC disadv.", data: [-0.15, 0.26, -0.01] }, { label: "National disadv.", data: [-0.57, -0.57, null], grey: true }] }
    },
    "send-out": {
      children: ["EHCP att. +9.13", "EHCP P8 +0.07", "2 of 59 OSDs EHCP"],
      spark: { title: "EHCP attendance vs national EHCP (%)", type: "bar", labels: ["ASCC EHCP", "National EHCP"], series: [{ label: "Attendance", data: [90.03, 80.90] }], min: 70 }
    },
    reading: {
      children: ["54% below age-related", "Summer: Y7 & Y10 SAS ≥100", "59 staff trained 92%", "Emmanuel pathway next"],
      spark: { title: "Mean reading SAS, matched pupils (national = 100)", type: "bar", labels: ["Y7", "Y8", "Y10"], series: [{ label: "Autumn 2025", data: [97.8, 95.3, 100.2], grey: true }, { label: "Summer 2026", data: [99.0, 95.5, 101.6], green: true }], min: 90 }
    },
    gap: {
      children: ["0.57 → 0.80 → 1.14*", "Disadv. still above national", "Adaptive teaching lever"],
      spark: { title: "In-school disadvantaged gap (P8)", type: "line", labels: ["2023", "2024", "2025*"], series: [{ label: "Gap", data: [0.57, 0.80, 1.14] }] }
    },
    y11att: {
      children: ["7% severely absent", "A8 5.22 vs 3.53 by att.", "64% improved vs Y10"],
      spark: { title: "Y11 average A8 by attendance band", type: "bar", labels: ["<90%", ">93%", ">95%"], series: [{ label: "Average A8", data: [3.53, 5.16, 5.22] }] }
    },
    dispro: {
      children: ["Self-identified", "Plans due end HT6", "Named owners"],
      spark: null
    },
    emmanuel: {
      children: ["£400k RBKC secured", "55m² modular", "9-child priority cohort", "Y7–8 literacy pathway"],
      spark: { title: "The triangulated case (Y7–8 pupils flagged)", type: "bar", labels: ["Reading SAS<85", "Att. <85%", "2+ concern areas"], series: [{ label: "Pupils", data: [66, 27, 9] }] }
    }
  },

  /* ---------- Ofsted renewed framework reference ---------- */
  framework: {
    summary: "From 10 November 2025 Ofsted inspects under the renewed education inspection framework. Single-word overall judgements are gone; schools receive a report card grading each evaluation area on a five-point scale, with safeguarding judged separately as Met / Not met.",
    scale: [
      ["Exceptional", "The highest grade – sustained, exceptional standards; transformational impact for disadvantaged pupils and those with SEND; no significant area unaddressed."],
      ["Strong standard", "Consistently strong standards across the school's work."],
      ["Expected standard", "The secure baseline all schools should meet."],
      ["Needs attention", "An area requiring improvement."],
      ["Urgent improvement", "Serious weaknesses requiring immediate action."]
    ],
    areas: ["Inclusion", "Curriculum and teaching", "Achievement", "Attendance and behaviour", "Personal development and well-being", "Leadership and governance", "Safeguarding (Met / Not met)"],
    inclusion: "Inclusion runs through every evaluation area – inspectors focus on disadvantaged pupils and those with SEND. This is the school's strongest ground: above-national outcomes and attendance for exactly these groups, in a top-quintile deprivation context.",
    process: "Inspection begins with a pre-inspection call between the lead inspector and headteacher covering context, improvement priorities and evidence. On site, inspectors gather evidence through observation and professional dialogue rather than graded lessons. Leaders should lead the narrative: context → systems → impact → what's next."
  },

  /* ---------- Media coverage ---------- */
  media: [
    {
      group: "National press & mainstream media",
      icon: "📰",
      items: [
        ["Guardian / Observer", "High aspirations: the school that embodies Labour's hopes for special needs", "https://www.theguardian.com/education/2025/jul/11/high-aspirations-the-school-that-embodies-labours-hopes-for-special-needs"],
        ["Guardian", "Jenga, dodgeball and no phones: a London school's radical 12-hour day", "https://www.theguardian.com/education/article/2024/jun/14/jenga-before-lessons-dodgeball-after-verdict-12-hour-school-day"],
        ["Guardian", "Teachers in England offered lie-ins to make job more appealing", "https://www.theguardian.com/education/2024/sep/19/teachers-in-england-offered-incentives-to-make-job-appealing"],
        ["Guardian", "Teachers should be allowed more flexible working, Bridget Phillipson says", "https://www.theguardian.com/education/2024/dec/21/uk-teachers-should-be-allowed-to-work-from-home-education-secretary-says"],
        ["Guardian / Observer", "Inadequate schools 'left to fester' by Tories, says Labour in academies row", "https://www.theguardian.com/education/2025/jan/25/inadequate-schools-left-to-fester-by-tories-says-labour-in-academies-row"],
        ["Guardian", "Fund state schools at the level of private ones", "https://www.theguardian.com/education/2022/jan/29/levelling-up-schools-headteachers"],
        ["The Times", "The school offering a 12-hour day to break phone addiction", "https://www.thetimes.com/uk/article/school-to-extend-day-to-12-hours-to-break-pupils-phone-addiction-f5cjdhqrz"],
        ["The Times", "How one head saved a sink school in the shadow of Grenfell", "https://www.thetimes.com/uk/article/how-one-head-saved-a-sink-school-in-the-shadow-of-grenfell-phtzfmvzg"],
        ["The Times", "How dangerous are smartphones for children, and should we ban them?", "https://www.thetimes.co.uk/article/how-dangerous-smartphones-children-ban-schools-dk7crxkdr"],
        ["The Telegraph", "The headteacher undoing the damage of lockdown", "https://www.telegraph.co.uk/news/2024/04/29/andrew-oneill-headteacher-lockdown-effect-children-phones/"],
        ["Evening Standard", "London headteacher introducing 12-hour school day to tackle smartphone addiction", "https://www.standard.co.uk/news/london/london-headteacher-12-hour-school-day-smartphones-all-saints-catholic-college-b1152848.html"],
        ["Independent", "School tries to break pupils' addiction to smartphones with 12-hour day", "https://www.independent.co.uk/news/uk/home-news/all-saints-catholic-college-school-notting-hill-b2532193.html"],
        ["LBC", "Teachers get lie-ins, as schools search for new ways to attract staff", "https://www.lbc.co.uk/article/teachers-get-lie-ins-5Hjcr88_2/"],
        ["BBC The One Show", "Leading a school through tragedy to triumph", "https://www.facebook.com/bbctheoneshow/videos/leading-a-school-through-tragedy-to-triumph-/549474769877785/"],
        ["Ealing Today", "Hanwell man named Secondary Headteacher of the Year", "https://new.ealingtoday.co.uk/page/ealingtoday/info/conschools029.htm"]
      ]
    },
    {
      group: "Education press",
      icon: "🎓",
      items: [
        ["Tes", "Andrew O'Neill author page", "https://www.tes.com/magazine/author/andrew-oneill"],
        ["Tes", "Andrew O'Neill seconded for another year as DfE policy adviser", "https://www.tes.com/magazine/news/general/andrew-oneill-seconded-another-year-dfe-policy-adviser"],
        ["Tes", "DfE appoints new 'school leader advisor'", "https://www.tes.com/magazine/news/general/dfe-appoints-new-school-leader-advisor"],
        ["Tes", "Headteacher input 'completely lost' in inspection system", "https://www.tes.com/magazine/news/general/headteacher-input-completely-lost-in-inspection-system"],
        ["Tes", "Headteachers' Roundtable announces new co-chairs", "https://www.tes.com/magazine/news/general/headteachers-roundtable-names-new-co-chairs"],
        ["Tes", "SEND: new members in DfE expert inclusion group", "https://www.tes.com/magazine/news/general/send-new-members-dfe-expert-inclusion-group"],
        ["Tes", "How will the schools bill affect academy freedom?", "https://www.tes.com/magazine/analysis/general/what-freedoms-will-academies-lose-under-new-schools-bill"],
        ["Tes", "Why education keeps collapsing into crisis", "https://www.tes.com/magazine/analysis/general/why-education-keeps-collapsing-into-crisis"],
        ["Tes", "Education needs a regulator, so let's shape Ofsted's future", "https://www.tes.com/magazine/analysis/general/education-needs-regulator-take-part-in-ofsted-plans-consultation"],
        ["Schools Week", "Headteacher appointed as new DfE 'school leader adviser'", "https://schoolsweek.co.uk/headteacher-appointed-as-new-dfe-school-leader-adviser/"],
        ["Schools Week", "The school giving teachers a lie-in to boost retention", "https://schoolsweek.co.uk/the-school-giving-teachers-a-lie-in-to-boost-retention/"],
        ["Schools Week", "11-hour school day pays dividends, says leader", "https://schoolsweek.co.uk/11-hour-school-day-pays-dividends/"],
        ["Schools Week", "The schools waging war on smartphones", "https://schoolsweek.co.uk/the-schools-waging-war-on-smartphones/"],
        ["Schools Week", "New body launched to give council schools policy voice", "https://schoolsweek.co.uk/new-body-council-school-heads-demand-a-say-in-policy/"],
        ["Schools Week", "How we're going to give maintained schools their voice back", "https://schoolsweek.co.uk/how-were-going-to-give-maintained-schools-their-voice-back/"],
        ["Schools Week", "A golden opportunity to help fix our broken SEND system", "https://schoolsweek.co.uk/a-golden-opportunity-to-help-fix-our-broken-send-system/"],
        ["Schools Week", "Rehearsed arguments about pay won't help the sector", "https://schoolsweek.co.uk/rehearsed-arguments-about-pay-wont-help-the-sector/"],
        ["Schools Week", "Revealed: The 2022 Pearson Teaching Awards winners", "https://schoolsweek.co.uk/revealed-the-2022-pearson-teaching-awards-winners/"],
        ["Schools Week", "National Teaching Awards 2022 silver winners revealed", "https://schoolsweek.co.uk/80-winners-scoop-silver-at-the-2022-pearson-national-teaching-awards/"],
        ["Schools Week", "John Dickens interviews school leaders", "https://schoolsweek.co.uk/john-dickens-interviews-school-leaders/"],
        ["Schools Week", "No 'minimum safety levels' for school strikes", "https://schoolsweek.co.uk/no-minimum-safety-levels-for-school-strikes-just-yet/"],
        ["FE Week", "Revealed: The 2022 Pearson Teaching Awards winners", "https://feweek.co.uk/revealed-the-2022-pearson-teaching-awards-winners/"],
        ["Education Executive", "Fund state schools at the level of private ones", "https://edexec.co.uk/fund-state-schools-at-the-level-of-private-ones/"],
        ["Education Executive", "School extends hours to limit screen time", "https://edexec.co.uk/news-school-extends-hours-to-limit-screen-time/"],
        ["Education Business", "Pearson National Teaching Award winners revealed", "https://educationbusinessuk.net/news/28112022/winners-pearson-national-teaching-awards-revealed"],
        ["Education Business Awards 2025", "All Saints Catholic College recruitment and retention reference", "https://educationbusinesslive.com/eb-awards-2025"]
      ]
    },
    {
      group: "International & republished coverage",
      icon: "🌍",
      items: [
        ["Fortune Europe", "Meet the 12-hour school day that will cure Gen Z's crippling work-life balance", "https://fortune.com/europe/2024/05/01/london-school-day-extended-hours-gen-z-working-balance/"],
        ["Business Insider", "This school has 12-hour days, 'relaxing' meals and no smartphones", "https://www.businessinsider.com/smartphones-ban-gen-z-school-12-hour-day-social-media-2024-7"],
        ["Yahoo Finance", "Meet the 12-hour school day that will cure Gen Z's crippling work-life balance", "https://finance.yahoo.com/news/headteacher-preparing-homebird-gen-z-134554820.html"],
        ["New York Post", "School hopes to reverse Gen Z's bad habits with 12-hour days", "https://nypost.com/2024/05/02/school-hopes-to-undo-gen-zs-bad-habits-with-12-hour-days/"],
        ["News.com.au", "School hopes to fix bad Gen Z habits with 12-hour days", "https://www.news.com.au/lifestyle/parenting/school-life/tragedy-of-our-youth-school-hopes-to-fix-bad-gen-z-habits-with-12-hour-days/news-story/07b8cae82de9430ca8386bfe46e90e70"],
        ["Nine News Australia", "UK school principal wants 12-hour student day to break smartphone addiction", "https://www.nine.com.au/world-news/uk-school-principal-wants-12-hour-student-day-to-break-smartphone-addiction-20240422-p5z1pu.html"]
      ]
    },
    {
      group: "Catholic press & faith-sector coverage",
      icon: "✝️",
      items: [
        ["The Tablet", "Andrew O'Neill author page", "https://www.thetablet.co.uk/authors/andrew-oneill/"],
        ["The Tablet", "News briefings Britain and Ireland", "https://www.thetablet.co.uk/news/news-briefings-britain-and-ireland-7/"],
        ["Diocese of Westminster", "All Saints Head awarded Secondary Headteacher of the Year", "https://rcdow.org.uk/news/all-saints-head-awarded-secondary-headteacher-of-the-year/"],
        ["Independent Catholic News", "Head of All Saints wins a Headteacher of the Year award", "https://www.indcatholicnews.com/news/44790"],
        ["Aleteia", "London Catholic school's solution to kids' device addiction", "https://aleteia.org/2024/07/19/london-catholic-schools-solution-to-kids-device-addiction/"]
      ]
    },
    {
      group: "Awards, official & institutional references",
      icon: "🏆",
      items: [
        ["Pearson National Teaching Awards", "Andrew O'Neill – Secondary Headteacher of the Year", "https://www.teachingawards.com/award-winner/andrew-oneill/"],
        ["All Saints Catholic College", "Mr O'Neill appointed to national education role", "https://www.allsaintscc.org.uk/mr-o-neill-appointed-to-national-education-role"],
        ["All Saints Catholic College", "Leadership and staff", "https://www.allsaintscc.org.uk/leadership-and-staff"],
        ["All Saints Catholic College", "Homepage", "https://www.allsaintscc.org.uk/"],
        ["Get Information About Schools", "All Saints Catholic College", "https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/100503"],
        ["Headteachers' Roundtable", "About us", "https://headteachersroundtable.wordpress.com/about/"],
        ["Education Policy Institute", "Enrichment for all – Andrew O'Neill listed as panellist", "https://epi.org.uk/events/enrichment-for-all-what-does-the-evidence-tell-us-about-access-impact-and-opportunities-for-improvement/"],
        ["Oracy Education Commission", "We Need to Talk report – All Saints case study", "https://oracyeducationcommission.co.uk/wp-content/uploads/2024/10/We-need-to-talk-2024.pdf"],
        ["Time's Up For The Test", "Supporters", "https://timesupforthetest.org/supporters"]
      ]
    },
    {
      group: "Social, video & secondary references",
      icon: "🎬",
      items: [
        ["ASCC LinkedIn", "The Tablet article post – A Reopening of the Mind", "https://www.linkedin.com/posts/all-saints-catholic-college-london_a-reopening-of-the-mind-the-childrens-wellbeing-activity-7320445538837962753-AE-8"],
        ["The Tablet (Facebook)", "How the Gospel can help us calm the storm in schools", "https://www.facebook.com/TheCatholicTablet/posts/how-the-gospel-can-help-us-calm-the-storm-in-schools-during-the-pandemic-andrew-/3472956502743285/"],
        ["The Tablet (Facebook)", "All Saints lessons / Rome Building post", "https://www.facebook.com/TheCatholicTablet/posts/catholic-pupils-at-all-saints-catholic-college-in-west-london-have-begun-lessons/4444101712295421/"],
        ["Good Morning Britain (Facebook)", "12-hour school day clip", "https://www.facebook.com/GMB/posts/a-school-headteacher-has-announced-plans-to-introduce-a-12-hour-school-day-to-tr/958663308964037/"],
        ["BBC Coventry & Warwickshire (Facebook)", "Smartphone ban / card games post", "https://www.facebook.com/bbccwr/posts/pupils-at-a-school-that-has-banned-smartphones-are-returning-to-card-games-and-c/1464775782333180/"]
      ]
    }
  ],

  /* ---------- Staff Development ---------- */
  staff: {
    intro: "A quarter of the teaching staff are trainees or early-career – and outcomes sit significantly above national. That is not luck; it is a development machine. Every teacher self-reflects in narrative against the five Active Ingredients domains, drafts a focus with a rationale, sharpens it into a specific target through coaching, and is then seen – half-termly drop-ins and book looks – against that target. Development here is chosen, coached and checked.",
    tiles: [
      ["54", "teachers completed narrative self-reflection across all five Active Ingredients domains"],
      ["40", "specific, personal development targets live – coached from draft to final"],
      ["45%", "chose adaptive teaching – the school's own #1 named priority, chosen freely"],
      ["92%", "average staff score on whole-school Unlocking Reading training (59 staff, every department)"]
    ],
    domains: {
      labels: ["Instructional Delivery", "Formative Assessment", "Relationships & Routines", "Adaptive Teaching", "Dialogic & Questioning"],
      draftPct: [22, 13, 9, 35, 20],
      finalPct: [13, 15, 3, 45, 25],
      note: "Draft focus (self-reflection, n=54) vs final target (n=40), % of staff. The movement between draft and final is the coaching conversation at work – and the destination is the school's improvement plan: 45% landed on adaptive teaching (the SEF's named lever for SEN Support and disadvantaged pupils) and 25% on dialogic teaching & questioning (the oracy pillar). Teachers chose the school's priorities as their own."
    },
    cycle: [
      ["Reflect", "Every teacher writes a narrative self-assessment against the five Active Ingredients domains – sentences, not tick-boxes. 54 completed this year, from ECTs to senior leaders."],
      ["Choose", "Each drafts a focus area with a written rationale – honest ones: 'I don't always gather the evidence'; 'I don't always adapt resources to stretch the high attainers'."],
      ["Sharpen", "A coaching conversation turns the focus into a specific, observable target: 'worked examples and thinking aloud for complex tasks', 'wait time then targeted questioning', 'live marking with actionable feedback'."],
      ["Practise & be seen", "Half-termly lesson drop-ins and book looks are read against each teacher's own target – T&L average 2.08, with 80% of statements expected or strong."],
      ["Learn together", "Whole-staff strands run alongside: Unlocking Reading Modules 1+2 completed by 59 staff across every department at a 92% quiz average – reading as everyone's job, provably understood."],
      ["Show the impact", "The model's fingerprints are in the outcomes: P8 +0.69 vs −0.03 national with a quarter of staff in their first years of teaching – and 100% of surveyed parents satisfied with teaching."]
    ],
    targets: [
      ["Adaptive Teaching", "Scaffolding adjusted to pupil proficiency for Y11 walking-talking-mocks – support faded as pupils grow."],
      ["Adaptive Teaching", "Research and trial adaptive strategies in 9X2 to stretch and challenge every pupil, not just support the middle."],
      ["Instructional Delivery", "Rosenshine when modelling complex tasks: break into steps, think aloud, worked examples, check understanding."],
      ["Instructional Delivery", "Guided practice before independence – 'I do, we do' before 'you do'."],
      ["Dialogic & Questioning", "Pupil-specific questions with proper wait time, then targeted – every pupil expecting to be asked."],
      ["Formative Assessment", "Prioritise live marking and actionable feedback; build pupil self-assessment and reflection."],
      ["Formative Assessment", "Teach misconceptions deliberately – pupils identify mistakes and articulate why they're wrong."],
      ["Adaptive Teaching", "Zero pairs for negative numbers across year groups – one concept, taught consistently, measured." ]
    ],
    targetsNote: "Real targets from this year's forms (anonymised). Note the language – Rosenshine, wait time, worked examples, live marking, misconception teaching: an evidence-literate staff body writing its own EEF-aligned development plan.",
    eef: [
      { strand: "EEF Effective Professional Development (guidance report)", impact: "Guidance", url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/effective-professional-development", action: "The cycle hits all four PD mechanisms: build knowledge (whole-staff modules), motivate (self-chosen goals with rationale), develop techniques (coaching + modelling), embed practice (drop-ins against the personal target)." },
      { strand: "Metacognition & self-regulation", impact: "+8 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation", action: "Modelling, thinking aloud and worked examples run through the instructional-delivery targets – the Toolkit's highest-impact strand." },
      { strand: "Feedback", impact: "+6 months", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback", action: "Live marking, actionable feedback and pupil self-assessment are recurring personal targets." },
      { strand: "Oral language interventions", impact: "High impact", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions", action: "A quarter of staff chose dialogic teaching & questioning – the classroom end of the oracy pillar." }
    ],
    retention: {
      headline: "Develop them, and keep them: the wellbeing offer that made national news.",
      points: [
        "Flexible working and teacher 'lie-ins' – covered by the Guardian, Schools Week and LBC, later endorsed by the Education Secretary – built to make working here sustainable.",
        "24% of teaching staff are ITTs or ECTs: the school deliberately grows its own, with the coaching architecture to make new teachers consistent fast.",
        "Recruitment and retention practice referenced at the Education Business Awards 2025; staff wellbeing named in the SEF: 'we look after our staff so they can look after our pupils.'",
        "The Headteacher advises the Secretary of State on schools policy; the DSL audits other schools; leaders speak nationally on teaching – development here reaches beyond the building."
      ]
    }
  },

  /* ---------- Briefings: one-page aide-memoires per audience ---------- */
  briefings: [
    {
      id: "staff", audience: "Staff", icon: "👩‍🏫",
      title: "All Saints in one page – the staff aide-memoire",
      tagline: "Why this school is so good, how it got here, and how to talk about it. Orare · Laborare · Servire.",
      sections: [
        { h: "Who we are", items: [
          "896 pupils, 11–16, Voluntary Aided Catholic, North Kensington – top-quintile deprivation nationally.",
          "44% FSM · 39% Pupil Premium · 44% EAL · 22% SEN with EHCPs (9.8%) rising every year.",
          "Previously Outstanding in every category. Now inspected under the renewed framework: no single word – a report card, area by area."
        ]},
        { h: "The trends – five arrows, all pointing the same way", items: [
          "OUTCOMES: above national three consecutive years – Progress 8 +0.69 vs −0.03 (2024); disadvantaged pupils +0.26 vs −0.57, beating national non-disadvantaged.",
          "ATTENDANCE: 92.41% – above national and similar schools, improving at 4× the DfE expectation; EHCP pupils +9.13 above their national figure.",
          "BEHAVIOUR: permanent exclusions 7 → 3 → 2 → 0; suspensions down 43.9% from peak; internal removals falling four straight years while the roll grew 41%.",
          "ENRICHMENT: all 8 DfE benchmarks met before the framework existed; 45% of the roll in tracked clubs; club members attend +7.2 better; Elev:8 made Y8 our most-engaged year (91%).",
          "SAFEGUARDING: external audit – “exemplary”; 100% of surveyed parents say their child feels safe."
        ]},
        { h: "Why it works – the engine", items: [
          "Ethos first: every system is Orare, Laborare, Servire made practical – 'Service with Colour'.",
          "Teaching is codified (T&L Handbook: the All Saints Way), coached (your own chosen target – 45% of us picked the school's #1 priority), and checked (drop-ins against YOUR goal).",
          "Nothing is untracked: clubs, trips, interventions, attendance, behaviour – pupil by pupil, with PP/SEN flags.",
          "Weaknesses are named before anyone asks: reading, the disadvantaged gap, Y11 attendance – each with an owner, a date and a measure."
        ]},
        { h: "If an inspector asks you…", items: [
          "Your development target: know it, and how coaching is helping – it's the system working.",
          "Safeguarding: the 5 Rs (Recognise, Respond, Report, Record, Refer) and who the DSL team are.",
          "A weakness? Name it, then the response: “we found it, we named it, we own it.”",
          "Phrases that land: “Opportunity is planned, not left to chance” · “We look after our staff so they can look after our pupils” · “Seven, three, two, zero.”"
        ]}
      ]
    },
    {
      id: "pupils", audience: "Pupils", icon: "🎒",
      title: "Your school in one page",
      tagline: "Things to be proud of – and if an inspector chats to you, just be yourself and be honest. Your honest experience is the best evidence we have.",
      sections: [
        { h: "Things that are true about your school", items: [
          "Results here are above the national average – and have been for three years running.",
          "35 clubs ran this year and 404 of you went to at least one – from basketball and K-Pop to cooking and theatre design. Pupils asked for clubs, and the school created them.",
          "Every single pupil goes on at least 4 trips a year – plus Culture Day, All Saints Day, Sports Day and the Feast.",
          "94% of pupils said Culture Day made them feel they belong here.",
          "Year 10 all did a week of work experience; pupils visited Oxford University, Parliament – and some presented their ideas at New Scotland Yard.",
          "Year 8 has Elev:8 – the residential, Period 7 enrichment and London Leaders – designed just for you."
        ]},
        { h: "Good things to know (not lines to learn!)", items: [
          "Our motto: Orare, Laborare, Servire – to pray, to work, to serve.",
          "If you're worried about anything, you can talk to your form tutor, Head of Year, or anyone on the safeguarding team – and they will act. Childline is there too.",
          "If someone is unkind or bullies, tell a member of staff – dealing with it is their job, and they want to know.",
          "Nobody wants you to give perfect answers. If an inspector asks you something, tell the truth about YOUR experience – the good and anything you'd improve."
        ]}
      ]
    },
    {
      id: "governors", audience: "Governors", icon: "🏛️",
      title: "The governors' one-pager – hold these and you hold the school",
      tagline: "The renewed framework asks whether you support AND robustly challenge. This page is both.",
      sections: [
        { h: "Five numbers to hold", items: [
          "Progress 8: +0.69 vs −0.03 national (2024) – third consecutive year above national, on falling KS2 priors.",
          "Disadvantaged P8: +0.26 vs −0.57 – our disadvantaged pupils beat national non-disadvantaged pupils.",
          "Attendance: 92.41% – above national (+0.78) and similar schools (+2.22); EHCP +9.13.",
          "Permanent exclusions: 7 → 3 → 2 → 0 – with 59 short reciprocal off-site directions as the mechanism.",
          "Parents: 100% say their child feels safe; 100% would recommend the school (n=82)."
        ]},
        { h: "The three toolkit tests – your language for Exceptional", items: [
          "Sustained exceptionally high standards: every trend above spans 2–4 years, through 41% roll growth.",
          "Transformational for disadvantaged/SEND: the numbers above ARE those pupils – plus measured interventions (Fresh Start 3× faster; Galilee +27–44pp).",
          "Nothing unaddressed: reading, the disadvantaged gap, SEN K attainment, Y11 attendance – all named, owned, dated. Calibration: Curriculum & Attendance are deliberately held at Strong; that is what makes the Exceptionals credible."
        ]},
        { h: "Decisions you own – cite them as governance impact", items: [
          "Emmanuel: £400k RBKC high-needs capital secured against a data-triangulated case; footprint value-engineered by £150–175k.",
          "Deliberate resourcing: Deputy SENCo, Bethlehem & Romero Centres, enhanced attendance team, graduate ASAs.",
          "Workload trade-offs approved: coaching meetings reduced, subject leads protected from Activities Week, SLT duty rota adjusted.",
          "ACTION BEFORE THE CALL: have 2–3 minuted examples of challenge → leader response → outcome ready to cite."
        ]}
      ]
    },
    {
      id: "parents", audience: "Parents", icon: "🏡",
      title: "Your child's school, in one page",
      tagline: "What All Saints achieved this year – and what it means for your child.",
      sections: [
        { h: "What the school achieved this year", items: [
          "Results above the national average for the third year running – and our disadvantaged pupils outperform the national average for ALL pupils.",
          "100% of parents surveyed said their child feels safe here, and 100% would recommend the school. An external safeguarding review called our evidence “exemplary”.",
          "35 clubs, 4+ trips for every child, Culture Day, work experience for all of Year 10, university visits – and 1:1 careers guidance for every pupil, so nothing depends on what a family can afford.",
          "Free uniform and PE kit available to every family, free Year 11 prom tickets, and support that reaches beyond school through our AllChild partnership."
        ]},
        { h: "How you can help your child fly", items: [
          "Attendance is the single biggest lever: pupils who attend well achieve nearly two grades higher on average. Every school day genuinely counts.",
          "Ask about clubs – pupils in clubs attend and achieve better, and there's one for every child, free.",
          "Revision: pupils asked us to help families help them – guidance on flashcards, retrieval and 'make–do–review' is on its way. Testing your child on their flashcards works better than watching them re-read notes.",
          "Talk to us early: form tutor first, Head of Year next. We act on what parents tell us – the survey said 94% of you feel heard, and we want that at 100%."
        ]},
        { h: "If an inspector asks for your view", items: [
          "Be honest – about what works and what could be better. Honest parent voice is evidence of a school that listens.",
          "Ofsted also runs Parent View online during any inspection – five minutes, and every response counts."
        ]}
      ]
    }
  ],

  /* ---------- T&L Handbook (The All Saints Way) ---------- */
  handbook: {
    title: "The All Saints Way – exceptional teaching through consistency",
    intro: "The Teaching & Learning Handbook (v2) codifies how this school teaches – a shared language, not a lesson script. It opens from John 10:10 and the motto, frames teaching as an act of service ('Service with Colour' – going beyond what is expected), and then builds a four-layer framework from curriculum to classroom. Every teacher's development target, every drop-in, every book look reads against it.",
    layers: [
      ["Curriculum Pillars", "What we teach", "Ambitious, carefully sequenced curriculum foundations behind every Curriculum Map and Scheme of Work – kept live through review and refinement."],
      ["The Active Ingredients", "Why great teaching works", "Seven evidence-informed principles, each with its research base cited in the handbook: Shulman (PCK), Rosenshine (instructional delivery), Black & Wiliam (formative assessment), Lemov and the EEF (relationships & routines), EEF SEND guidance (adaptive teaching), Alexander (dialogic teaching), Quigley and Voice 21 (reading, literacy & oracy)."],
      ["Coaching & CPD", "How we continually improve", "Whole-school INSET, collaborative sessions, Curriculum Planning & Review, 6-Minute Takeaways, personalised coaching cycles and leadership development – the machinery the Staff Development cycle runs on."],
      ["The All Saints Way", "What great teaching looks like every day", "Five daily entitlements every pupil should experience in every lesson: Active Participation (cold calling done properly – question, thinking time, cold call, probe, no opt-out – plus SAINT sitting routines and mini-whiteboard checks), Explicit Teaching, Adaptive Teaching & Stretch, Feedback in Books (the 4Ts of live feedback: Time, Target, Transfer, Track – answered by pupils through Correct, Extend, Explain), and Reading, Literacy & Oracy (the R.E.A.D.S framework)."]
    ],
    proof: "The handbook is not aspiration – its fingerprints are checkable across this portal: teachers' own development targets quote its language (Rosenshine, wait time, live marking); drop-ins score 80% expected/strong against it (T&L 2.08); pupils on the revision panel describe make–do–review and shadow papers unprompted; 100% of surveyed parents are satisfied with teaching; and outcomes sit at P8 +0.69 with a quarter of staff in their first years. Codify → coach → check → outcomes.",
    line: "Every Student. Every Classroom. Every Day."
  },

  /* ---------- Scenario Lab (what-if / innovation) ---------- */
  scenarios: {
    intro: "Innovation here is not guesswork: every experiment starts from our own data, borrows the strongest available evidence, and names its measures before it begins. That is how the extended day, Elev:8 and the phone-free culture happened – and this page is where the next ones are tested. Each scenario below can be stress-tested live by the Portal AI: evidence for, risks, what we would measure, and the EEF strands in play.",
    cards: [
      { tag: "Next frontier", title: "Elev:9 – take the Elev:8 model into Year 9",
        hypothesis: "If Elev:8 inverted the Year 8 dip (91% club participation, biggest clubs in school), a Year 9 version targets our next pressure point: Y9 has the highest OSD use (24), elevated suspensions (9.4%) and only 29% club participation.",
        evidence: "Own data: Y8→Y9 engagement cliff · Jerrim's engagement research · EEF extending school time (structured + enriched) · Elev:8 participation data as the pilot result.",
        boundary: "Nobody structures Year 9 deliberately – it's nationally treated as the 'lost year'. We'd be first again.",
        measures: "Y9 club participation %, OSD count, suspension rate, attendance delta vs matched prior year, Michaelmas→Lenten on-track movement." },
      { tag: "Attendance", title: "Enrichment on prescription for persistent absentees",
        hypothesis: "Club members attend 7.2 points better than non-members (SEN +12.1). What if every PA pupil's attendance plan included a guaranteed place in a club of their choice – belonging as the intervention, not just contracts and monitoring?",
        evidence: "Own data: members 94.5% vs non-members 87.3%; 10+ visits → 95.5% · EEF parental engagement + extending school time · DfE enrichment framework benchmark 5.",
        boundary: "Attendance strategy nationally is compliance-led. Making enrichment the front-line treatment is a genuine inversion.",
        measures: "Attendance delta for PA pupils with/without club uptake, PA rate to <20% target, pupil-voice belonging scores." },
      { tag: "Reading", title: "Universal Y7 fluency screening → phonics for every below-threshold reader",
        hypothesis: "54% of pupils arrive below age-related reading. Fresh Start produced 3× faster recall for a small tracked group. What if the Y7 Fluency Pilot became a universal screen-and-treat model – every below-threshold Y7 in a phonics or fluency group by October half term?",
        evidence: "Own Fresh Start impact data (71s→19s) · EEF phonics +5 / reading comprehension +7 · Galilee pre/post gains.",
        boundary: "Secondary schools rarely run universal phonics screening – it's seen as primary business. Our data says otherwise.",
        measures: "% at/above age-related by Y7 summer, Speed Sound cohort averages, NGRT/reading-test movement, KS3 English on-track %." },
      { tag: "Workforce", title: "Flexible working 2.0 – the retention dividend",
        hypothesis: "Teacher 'lie-ins' made national news and the Education Secretary endorsed flexible working. With 24% ITT/ECT staff, what if we built the sector's most explicit retention offer – flexible windows, planning-from-home, sabbatical pathways – and published the retention data?",
        evidence: "Own coverage + recruitment pull (Education Business Awards reference) · DfE flexible-working push · coaching model capacity.",
        boundary: "Most schools whisper about flexibility; we'd cost it, measure it and publish it.",
        measures: "Teacher retention %, recruitment field sizes, staff-absence rate, T&L scores held ≥ current 2.08 baseline." },
      { tag: "SEND", title: "Reverse the SEN K attainment slide by 2027",
        hypothesis: "SEN Support A8 has fallen half a grade a year since 2023 while EHCP care flourishes. What if the K-code cohort got the EHCP treatment: named keyworker, provision-mapped interventions with pre/post measures, and a termly parent conference?",
        evidence: "Own provision-map impact data (Fresh Start, Galilee, SaLT) · EEF TA interventions +4 / small group +4 / one-to-one +5 · EHCP attendance +9.13 as proof the intensive model works.",
        boundary: "Treating SEN Support with EHCP-level intentionality – ahead of the SEND review the sector is waiting for.",
        measures: "SEN K A8/P8 vs 2025 baseline, SEN K attendance ≥87.5% target, % of K pupils with measured intervention gain." },
      { tag: "Oracy", title: "The speaking school – oracy as a public signature",
        hypothesis: "We're already an Oracy Education Commission case study with oracy in every SoW. What if oracy became the public signature: whole-school debating, pupil TED-style showcase, spoken-word graduation expectation for every Y11?",
        evidence: "EEF oral language (high impact) · Oracy Commission case study · Voice 21 evidence base · P7 Enrichment literacy strand.",
        boundary: "Most schools do oracy as pedagogy; making it a visible entitlement with a public stage is the next step.",
        measures: "Oracy assessment framework scores, English outcomes, pupil confidence in voice surveys, participation in public events." }
    ],
    builder: {
      levers: ["Extended day / enrichment", "Coaching & teaching model", "Attendance systems", "Behaviour & pastoral systems", "Reading & literacy intervention", "SEND provision map", "Staff wellbeing & retention", "Oracy & student voice", "AI & technology"],
      groups: ["Whole school", "Year 7", "Year 8 (Elev:8)", "Year 9", "Year 11", "Pupil Premium pupils", "SEN Support (K) pupils", "EHCP pupils", "Persistent absentees", "Staff"],
      outcomes: ["Attendance", "Progress & attainment", "Behaviour / suspensions", "Reading age", "Belonging & engagement", "Retention & recruitment", "Parental engagement"]
    }
  },

  /* ---------- Governors' challenge ---------- */
  governors: {
    intro: "The renewed framework asks whether governors provide consistent support and robust challenge across all aspects of the school's work – and the SEF names one action before the call: concrete, dated examples of challenge and leaders' response. This page arms that: the probing questions worth asking in each domain, where the evidence lives, and what a strong answer sounds like. Rehearse any of them live with the Portal AI.",
    domains: [
      { name: "Curriculum & Standards", icon: "📚",
        questions: [
          { q: "54% of pupils arrived below age-related reading. What did you do within the year, and how will we know it worked?", look: ["foundations", "Reading, Literacy & Numeracy"], strong: "Screen, triangulate, intervene in tiers, measure – and the measure has already moved: summer matched tests put Y7 and Y10 mean SAS at/above the national 100, Y10 'expected & above' up 6.8 points, Thinking Reading pupils at 75% age-expected, Fresh Start recall 3× faster. Y8's partial cohort and Y9's pending test are named honestly." },
          { q: "SEN Support attainment has fallen half a grade a year since 2023. Why, and what changes in September?", look: ["send", "SEND page"], strong: "Named honestly in the SEF; adaptive-teaching strand in every SoW, CPD from September, provision-mapped interventions with pre/post measures – reviewed Oct–Jan." },
          { q: "English Language residual was −0.54 in 2025. What did the department change?", look: ["results", "Results & Trends"], strong: "Class-level analysis completed, SoW finished in January, teacher-level residuals tracked, targeted meetings held – with mock-to-exam trajectory monitored termly." },
          { q: "A quarter of teaching staff are trainees or early-career. How is quality held consistent?", look: ["sef", "Curriculum & Teaching"], strong: "Active Ingredients coaching (EEF metacognition +8), T&L average 2.08 with 80% expected/strong, CPR cycle keeping SoW live." },
          { q: "Are 2026 predictions credible? What would make you wrong?", look: ["years", "Year Groups"], strong: "Trajectory mirrors last cohort's mock-to-exam climb (4.48→5.12); risks named – attendance of a small Y11 group, English Language – with intervention attached to each." }
        ] },
      { name: "Finance & Resources", icon: "💷",
        questions: [
          { q: "Show me the Pupil Premium money becoming outcomes. What's the mechanism?", look: ["external", "IDSR & Pupil Premium"], strong: "£371,950 through the EEF tiers as a literal budget: £201k teaching (smaller KS3 classes at the EEF threshold, coaching), £105k targeted (ASAs, after-school study with a hot supper, Thinking Reading), £66k wider (Elev:8, attendance team, AllChild). Verified externally: Ofsted's own IDSR flags disadvantaged pupils 'Above (sig+)' on measure after measure." },
          { q: "Every SEND intervention is costed at £0 to families – what does it cost the school, and is that sustainable?", look: ["send", "SEND page"], strong: "Deliberate resourcing decisions (Deputy SENCo, Bethlehem, Romero, trained LSA for SaLT) with impact measured per provision – investment justified by EHCP attendance +9.13 and measured literacy gains." },
          { q: "The roll grew 41% in four years. Where is the growth money going, and what breaks first if it stops?", look: ["dashboard", "Dashboard"], strong: "Growth funded the inclusion architecture and pastoral capacity; per-pupil behaviour metrics improved through growth (internal suspensions per pupil halved) – showing scale managed, not endured." },
          { q: "Free uniform, PE kit, prom tickets, vouchers – generosity or strategy?", look: ["attendance", "Attendance → Safeguarding"], strong: "Strategy: dignity as safeguarding, funded partly by alumni donation; removes the cost barriers the enrichment framework names, and participation parity data proves it works." }
        ] },
      { name: "Catholic Life & Personal Development", icon: "✝️",
        questions: [
          { q: "Orare, Laborare, Servire – where would I see the motto in a Tuesday afternoon, not a display board?", look: ["graph", "Connections → Catholic Ethos"], strong: "Prayer in lessons, the charity operations pupils name unprompted in surveys, reconciliation built into behaviour, Elev:8 grounded in John 10:10 – pupil voice quotes it back." },
          { q: "Is enrichment an offer for the keen, or an entitlement for all? Prove the disadvantaged get it.", look: ["enrichment", "Enrichment"], strong: "Tracked pupil-by-pupil: PP 34% of club members vs 39% of roll, SEN near parity, 94% of 416 Culture Day respondents felt they belonged – a monitored entitlement." },
          { q: "Only 37% of the pupil panel feel their opinions are often listened to. What changed because a pupil said something?", look: ["voice", "Student & Parent Voice"], strong: "K-Pop, film & philosophy and dodgeball clubs exist because pupils asked; the flag was pre-owned in the SEF with student-voice priority (DWI/NKE) – and the school publishes the uncomfortable number." },
          { q: "How do I know safeguarding is a culture and not a folder?", look: ["attendance", "Attendance → Safeguarding"], strong: "External audit: 'exemplary'; 100% of surveyed parents say their child feels safe; every child knows the team; the DSL audits other schools." }
        ] },
      { name: "Strategic Direction", icon: "🧭",
        questions: [
          { q: "The Headteacher advises the Secretary of State. Who runs the school, and what's the succession plan?", look: ["sef", "Leadership & Governance"], strong: "Distributed leadership evidenced across the SEF – every priority has a non-Head owner; the secondment is itself evidence the bench is deep. Named succession and capacity plan held by governors." },
          { q: "The disadvantaged gap widened three years running. When does 'named priority' become 'solved problem'?", look: ["results", "Results & Trends"], strong: "Honest framing: disadvantaged pupils remain above national; gap driven partly by non-disadvantaged surge; levers (adaptive teaching, attendance, intervention) with dates – governors should set the review milestone and hold it." },
          { q: "What did the DfE enrichment framework and renewed Ofsted framework change about our strategy?", look: ["framework", "Framework"], strong: "Nothing reactive – both frameworks arrived after we already met them. Strategy continues to lead policy, not follow it: the innovation pipeline (Scenario Lab) is the forward plan." },
          { q: "Emmanuel commits ~£103k of school money alongside RBKC's £400k. Convince me the building is the right intervention and not a monument.", look: ["send", "SEND → Emmanuel"], strong: "The case is triangulated from three internal datasets (reading, attendance, suspensions) identifying a named priority cohort; the footprint was value-engineered down £150–175k; outcomes are defined before build (attendance recovery, repeat-suspension reduction, literacy gain) – the same discipline as Elev:8, at capital scale." },
          { q: "What are the three biggest risks on the register right now?", look: ["graph", "Connections → risks"], strong: "Reading, the disadvantaged gap, Y11 attendance/SEN K attainment – each with owner, milestone, measure. The DfE data-quality issue is escalated and documented. Nothing on this site is unowned." }
        ] },
    ],
    challengeNote: "Before the inspection call: log 2–3 real, minuted examples of governor challenge with dates and what leaders changed as a result – the SEF names this as the one leadership gap. The questions above are the raw material; the minutes are the evidence. (Model pattern: 'Governors challenged X on [date] → leaders responded with Y → outcome Z.')"
  },

  /* ---------- Foundational Skills: reading impact, literacy, numeracy, study clubs (Evidence 8 July 2026) ---------- */
  foundations: {
    intro: "The SEF names reading as the school's defining challenge – 54% of pupils below age-related expectations in Autumn 2025 – and deliberately holds Curriculum & Teaching at Strong until that number moves. This page is the evidence that it is moving: matched-pupil reading tests autumn to summer, impact intervention by intervention, the whole-school literacy and numeracy strategies behind them, and the extended-day study clubs closing the homework gap for exactly the pupils the toolkit names.",
    tiles: [
      ["+6.8pp", "growth in Year 10 pupils reading at 'expected & above' in a single year (52.0% → 58.8%)"],
      ["≥100", "Years 7 and 10 lifted mean reading SAS to at or above the national average of 100"],
      ["254 → 487", "e-book check-outs on the SORA platform almost doubled – a reading culture you can count"],
      ["−49.2%", "homework-related negative logs for pupils on Compulsory Study, Michaelmas → Trinity"]
    ],
    reading: {
      sas: {
        labels: ["Year 7", "Year 8", "Year 10"],
        aut: [97.8, 95.3, 100.2],
        sum: [99.0, 95.5, 101.6],
        expAut: [47.2, 40.8, 52.0],
        expSum: [49.1, 40.0, 58.8]
      },
      sasNote: "Autumn 2025 vs Summer 2026 Standardised Age Scores (Bedrock reading test), matched pupil by pupil. Years 7 and 10 lifted their mean SAS to at or above the national average of 100 – in the school year the strategy launched. Honest edges published alongside: Year 8 still has 60 pupils to test (its 'expected & above' band dipped 0.8 points on the partial cohort) and Year 9 sits its summer test next. This is the exact success measure the Curriculum grade rationale names – and it is moving.",
      interventions: [
        ["Year 7 Fresh Start + Thinking Reading", "75%", "of Thinking Reading pupils met their age-expected reading age by the end of the programme – a direct result of the intervention; 67% of pupils on the foundational-skills programme improved SAS. Graduates move on to the Fluency group with parental permission: decoding secured before fluency, exactly as the Reading House model orders it."],
        ["Reading Fluency group", "67%", "of fluency pupils improved their SAS at the summer reading test – and two-thirds of the improvers are Pupil Premium. Individualised words and phrases to practise and rehearse, monitored reading aloud, and personal conversations with parents about reading at home – targeted, never generic."],
        ["Year 10 Science pre-teaching", "83%", "improved or held their Science attainment Michaelmas → Trinity (60% improved or held SAS autumn → summer). Delivered weekly in form time by a Science ASA – who then trained the whole staff in a 6-Minute Takeaway. The Grenfell Teaching Hub is in conversation about rolling pre-teaching beyond Science next year; best practice shared with KAA."],
        ["Year 10 English intervention", "100%", "of the eight Pupil Premium pupils on the Reciprocal Reading intervention maintained or improved their English outcomes – 79% of the full 24-pupil group did. Literature revision (The Merchant of Venice, Jekyll & Hyde) explicitly designed to work around attendance and behaviour barriers rather than assume them away – and it gave mid-year joiners the texts everyone else had already been taught."]
      ],
      identification: "Every pupil sat the Bedrock Reading Test in November 2025, generating a Standardised Age Score. The lowest readers in each cohort are then triangulated against KS2 reading data and English-teacher judgement before any placement – SAS alone never decides. Probing and pathway allocation ran through December; interventions began in January 2026. The pathway itself is sequenced on the Science of Reading and the EEF's Reading House: decoding and phonics secured first, because that is what makes fluency work possible.",
      routes: [
        ["Pathway 1 – in-class only", "SAS below expected, but KS2 reading at or above", "High-quality classroom strategies that remove barriers – no withdrawal"],
        ["Pathway 2 – probe did not confirm", "SAS and KS2 both below, need not confirmed at probe", "In-class strategies plus optional pilot Fluency group (parental consent)"],
        ["Pathway 2 – highest need", "SAS and KS2 below, confirmed at probe testing", "Read Write Inc. Fresh Start – systematic phonics"],
        ["Pathway 2 – next tier", "As above, referred as 1:1 capacity allowed", "Thinking Reading (1:1)"],
        ["Graduation route", "Completed Fresh Start or Thinking Reading", "Fluency group, with parental consent – monitored reading aloud, individualised feedback"]
      ],
      routesNote: "Years 7–8 two-pathway model. Year 9 adds Mylexia diagnostic testing – newly implemented – placing pupils on individualised pathways targeting the specific gap (phonics, decoding or grammar), plus a Y9-into-Y10 study skills group. Year 10 runs at scale because the need is at scale: 83% of the identified Reciprocal Reading cohort and 96% of the Science pre-teaching group were below or significantly below on the reading test.",
      universal: [
        "Two guided reading sessions a week in tutor time, staff trained to deliver them; purposeful Reading Time in the LRC on rotation; a reading book as standard equipment",
        "Explicit vocabulary instruction in every subject; a 4-week whole-school spelling drive; the whole-school Spelling Bee built from curriculum leaders' own subject vocabulary",
        "SAS descriptors reported to parents at Lenten assessments and the 'Take 10' parent bulletin – a shared home-school reading narrative between test points",
        "DfE Science of Reading training delivered in-school to all staff and assessed (59 staff, 92% average); literacy revisited continually through the 6-Minute Takeaway briefing cycle",
        "In English: a dedicated Y7 reading lesson (silent reading, journals, oracy), Bedrock for homework, Reciprocal Reading roles, live feedback on foundational skills, SPaG codes consistent across English and MFL"
      ],
      takeaways: [
        ["12 Jan", "Live Feedback & Student Response", "Underpins live feedback driving foundational skills in every classroom"],
        ["26 Jan", "Teaching Tier 3 Vocabulary: Explicit Vocabulary Instruction", "Direct input to the universal explicit-vocabulary offer"],
        ["2 Feb", "Developing Oracy: the A-B-C Framework – launch", "Launches the Agree–Build–Challenge structure used across the school"],
        ["2 Mar", "Live Feedback Loops: English Practice and Impact", "English department case study of live feedback on foundational skills"],
        ["16 Mar", "Why Literacy Matters: Analysing Reading Test Data", "Whole-staff briefing on the Bedrock/SAS data and classroom implications"],
        ["20 Apr", "Case Study: Pre-teaching Vocabulary & Impact", "The Y10 Science ASA shares her intervention's impact with all staff"]
      ],
      takeawaysNote: "Staff development is the delivery mechanism, not an afterthought: whole-staff Science of Reading training assessed at 92%, then literacy revisited six times across the spring through the 6-Minute Takeaway cycle – plus weekly ASA forums on classroom literacy support (Quigley + DfE) and ECT drop-ins with subject-specific reading strategies, down to National Literacy Trust materials for PE."
    },
    literacy: {
      oracy: {
        headline: "High-quality talk is fundamental to thinking, reading and writing – so oracy is engineered, not hoped for.",
        points: [
          ["The A-B-C Framework, whole-school", "Agree – Build – Challenge: one common language for academic talk, launched through Deputy-Head-led CPD and used across English, reading lessons, tutor activities and PSHCE – the same framework everywhere a discussion happens."],
          ["Voice 21 and the reading lesson", "Year 7 oracy lessons follow the Voice 21 framework; talk is deliberately sequenced so oral rehearsal feeds writing and writing feeds talk – around Blood Brothers, Shakespeare and structured debate where pupils justify opinions from the text."],
          ["Public stages, deliberately built", "The St Thomas Aquinas Poetry Award (pupils write, rehearse and perform their own poetry), the Spanish Award (scripts written and performed in Spanish), the English After School Academy, St Catherine Aspire passion-project presentations, and a Midsummer Night's Dream performance – Y10 pupils collected the Aquinas Award at Awards Night on 6 July."]
        ]
      },
      writing: {
        headline: "Supporting highly academic writing – stretch programmes that take able disadvantaged pupils to university-style writing, with the evidence held in the essays themselves.",
        points: [
          ["Brilliant Club Scholars Programme", "16 of the most able Year 9 pupils – eligibility required Pupil Premium or high-deprivation postcode – completed seven PhD-tutor tutorials and a university-style essay, each with a 1:1 draft-feedback meeting, culminating in a graduation at the University of Oxford. Timetabled across P5/P6 on a weekly swap so no group repeatedly missed the same lesson."],
          ["St George Award", "8 high-achieving Year 10 pupils took a term-long A-Level English taster on Sam Selvon's The Lonely Londoners – postcolonial theory, self-chosen essay titles linked to their own reading, panel presentations – with theatre trips to The Crucible and The Lonely Londoners at Kilburn."]
        ]
      },
      mechanics: [
        ["Spelling", "Tier 2/3 vocabulary taught explicitly with morphology, etymology, Frayer models and dual coding; Bedrock builds spelling patterns through spaced retrieval; Look–Cover–Write–Check and self-testing strategies taught explicitly (led from MFL); the whole-school Spelling Bee draws its words from each curriculum area's own disciplinary vocabulary."],
        ["Handwriting", "Presentation held high through the Quality of Books cycle (handwriting, organisation, homework completion), with SEND referrals and reasonable adjustments (laptops, scribes) where handwriting is a barrier. Self-identified next step, on the record: a whole-school explicit handwriting strategy launches September 2026."]
      ]
    },
    numeracy: {
      intro: "The Maths department's Foundational Skills strategy mirrors the reading model: identify early, teach explicitly, intervene in tiers, remove the scaffolding when it has worked. Focus: fractions, decimals, percentages, ratio and times-tables fluency.",
      elements: [
        ["Two-stage baseline", "All pupils sit a September numeracy baseline and a second before October half-term – setting decided on settled evidence, not first-week noise."],
        ["One curriculum, three depths", "Every set works the same unit of study through Extension, Core or Emerging pathways – curriculum coherence with appropriate challenge, so moving between sets never means a different curriculum."],
        ["Nurture groups by design", "Smaller groups where reteaching of primary-level foundations is written into the scheme of work as a requirement before dependent topics – not left to teacher discretion."],
        ["Tiered, responsive intervention", "Compulsory weekly Sparx times-tables homework for every supported pupil; Y10 form-time intervention (sets 1–4) selected live from responsive teaching in lessons; ASA-delivered form-time and after-school support. Pupils exit when they can access the curriculum independently – scaffolds removed, resources redirected."],
        ["Cross-phase through the Maths Hub", "Maths Hub conference collaboration with primary colleagues feeds directly into the Year 7 scheme of work – built on what KS2 actually secured, not what it assumed."]
      ],
      cases: [
        ["A top-set Year 10 pupil with autism", "Identified through responsive teaching as struggling with specific content despite top-set placement; directed into intervention. Grade 6− (Michaelmas) → 7− (Lenten) → Grade 6 on a full, unamended GCSE paper in Trinity – equivalent to a strong 7 once Year 11 content is covered. Previously gave up when challenged; now visibly perseveres."],
        ["Foundation-to-Higher mover", "Grade 5 → 6 across the year; moved from Foundation tier (Y9) to Higher tier (Y10) with intervention focused on crossover questions – and exited intervention early because impact was secured. Scaffolds removed when no longer needed."],
        ["At risk of moving down a set", "Flagged at the end of Y9 as at risk of dropping to Set 4; bespoke small-group intervention on identified gaps produced a marked change in QLA performance on the first full GCSE paper. Early identification preventing regression, not repairing it."]
      ],
      casesNote: "Three anonymised case studies from this year's intervention cohort – deliberately spanning the range: the model supports a top-set pupil with SEND, a tier-mover, and a pupil at risk of regression. Intervention here is personalised to need, not reserved for the lowest attainers – and it is exited, which is what makes it scalable."
    },
    clubs: {
      headline: "The extended day, doing targeted work: two compulsory study provisions – one for Pupil Premium pupils, one run through SEN support – both with behaviour-log evidence that the homework gap closed as the year went on.",
      pp: {
        title: "Compulsory Study (extended school day) – Pupil Premium",
        terms: ["Michaelmas", "Lenten", "Trinity"],
        neg: [305, 232, 155],
        pwShare: [16.9, 21.6, 23.3],
        stats: [
          ["−49.2%", "fall in homework-related negative logs across the year – 305 → 232 → 155, falling every term"],
          ["80%", "of tracked pupils (12 of 15) showed sustained individual improvement"],
          ["54%", "of the 28 pupils placed on Compulsory Study are Pupil Premium (18 pupils) – placement decided at Progress & Pastoral meetings"],
          ["−63%", "in 'online homework not to acceptable standard' – the steepest category fall; 'no online homework' fell 55%, 'no paper homework' 38%"]
        ],
        note: "Placed following Michaelmas Progress & Pastoral review; tracked across all three terms via behaviour logs. Read honestly: positive *PW points did not rise in raw numbers (62 → 64 → 47), but as a share of all recorded behaviour they grew every term (16.9% → 21.6% → 23.3%) – negatives fell faster than positives did. The three pupils whose logs rose are named internally with next-step plans."
      },
      sen: {
        title: "SEN Homework Club – all attendees Pupil Premium",
        terms: ["Term 1", "Term 2", "Term 3"],
        low: [168, 131, 97],
        high: [180, 137, 117],
        stats: [
          ["−38.5%", "fall in negative incidents across the year for the combined 33-pupil group (348 → 268 → 214)"],
          ["Both cohorts", "improved independently: low-engagement pupils −42.3%, high-engagement pupils −35.0% – no group masking the other"],
          ["58%", "of pupils (19 of 33) showed sustained individual improvement across the terms they have data for"],
          ["33 / 33", "attendees recorded as Pupil Premium – the club reaches exactly the overlap (SEN × disadvantage) where national gaps are widest"]
        ],
        note: "Every pupil who attended in any capacity, Years 7–11, from one-session tasters to 86 logged sessions. The two cohorts track slightly different measures (general behaviour incidents for low-engagement, homework-submission incidents for high-engagement) – shown separately, never blended into a single claim. Honest ledger: 9 pupils (27%) saw incidents rise – each identified for further support next term."
      },
      closing: "Where it lands: the Achievement priority 'clear expectations for work completed outside lessons' (JAN/CDA/BFO, Oct & Jan checkpoints) now has measured mechanisms behind it, funded through the PP strategy's targeted tier (compulsory after-school study with a hot supper). EEF: homework (secondary) +5 months, extending school time – structured and supervised, exactly the conditions the evidence asks for."
    },
    closing: "One page, one claim: the school's biggest named weakness is being answered with the same discipline as its strengths – screened universally, intervened in tiers, measured pupil by pupil, staffed through whole-school CPD, and honest about what hasn't moved yet (Year 8's partial cohort, nine study-club pupils needing more). The Curriculum grade rationale says 'when those move, this grade moves'. The summer tests are the first movement."
  },

  askSuggestions: [
    "Give me the strongest 60-second case for Exceptional leadership",
    "How do I explain the disadvantaged gap widening?",
    "Chart our Progress 8 against national since 2023",
    "What's our answer on Year 11 attendance?",
    "How does our inclusion evidence map to the toolkit?",
    "What do I say about the 2025 SISRA estimates?",
    "What impact has the reading strategy had this year?",
    "Talk me through the study-club homework evidence",
    "What are our safeguarding headlines?"
  ]
};

if (typeof module !== "undefined") module.exports = ASCC;
