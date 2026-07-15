# NSF SBIR Project Pitch — Draft (v2, corrected)
### MOSCANA Mathematics LLC / Need to Know Nine

Submit at: https://nsfgov.my.site.com/mywork (NSF typically responds in 1-2 months). Each section below fits inside NSF's stated character limits, with room to spare.

**What changed from v1:** corrected how current usage is characterized (real students on paper for 20+ years; the digital app itself is prototype/sample-data stage, not yet live with real students), fixed your legal name and role history, replaced the "14 years" figure with your actual timeline, and added the math helpER+ tutoring business as real commercial validation.

---

## 1. The Technology Innovation
*(limit 3,500 characters — this draft is 2,370)*

Need to Know Nine (NKN) is an AI-driven K-12 math intervention system built around a core technical bet: that a vision-language model can reliably grade freehand, handwritten math work — not typed answers, not multiple choice — accurately and fairly enough across a K-12 age range to drive real-time adaptive instruction. Existing adaptive math platforms (IXL, DreamBox, ST Math, Zearn) avoid this problem entirely by requiring typed or clicked answers, which discards the work-shown reasoning that is the actual signal of mathematical understanding, and that is standard practice in every real math classroom.

NKN's innovation has two coupled parts. First, an AI grading engine that evaluates a photograph of a student's handwritten answer against developmentally calibrated standards (a five-year-old's wobbly circle is graded on a completely different rubric than a seventeen-year-old's algebra work), and classifies not just correct/incorrect but WHY: a handwriting/legibility slip, a computational error with sound method, or a genuine conceptual gap. This three-way diagnostic classification does not exist in any commercial K-12 math product we are aware of, and it is the foundation for the second innovation: an adaptive Socratic AI tutor that responds differently to each error type, mirroring how an expert RTI specialist actually redirects a struggling student, rather than delivering a generic hint.

The system also runs a spiral curriculum model: nine core math domains are practiced daily rather than sequentially, each domain advancing independently through five mastery tiers based only on that student's performance in that specific skill. This model itself has been developed and refined on paper across more than two decades of the founder's own classroom practice. This is paired with a paper-to-digital bridge (QR-coded printed worksheets that route scanned handwritten work through the same AI grading and mastery-tracking pipeline as the digital app) so that classrooms with limited device access, or teachers who prefer paper-based formative assessment, feed the same adaptive record as fully digital use. The core R&D risk is whether AI-based handwriting evaluation can be made reliable and equitable enough, across this developmental and modality range, to be trusted for real instructional decisions — not merely a novelty grading trick.

---

## 2. The Technical Objectives and Challenges
*(limit 3,500 characters — this draft is 2,485)*

Phase I research and development centers on validating and hardening the AI grading and diagnostic layer. The underlying spiral-review curriculum has over two decades of real classroom use and hand-recorded student data behind it; the AI-driven digital application built on top of it is a working prototype, currently exercised with sample/test data rather than live student use. Phase I would fund the system's first rigorous deployment and validation with real students, alongside the technical hardening below.

**Objective 1 — Grading accuracy and equity validation:** Build a ground-truth dataset of handwritten student work independently double-graded by certified math teachers across grade bands K-12, and measure the AI grading engine's agreement rate, false-positive/false-negative rates, and consistency across handwriting styles, disability accommodations, and English-language-learner populations. Challenge: handwriting variability at the K-2 level is extreme and subjective even among human graders; we will address this by developing explicit, testable per-grade-band rubrics rather than relying on general-purpose model judgment.

**Objective 2 — Error-classification and adaptive tutor validation:** Test whether the three-way error classification (handwriting/computational/conceptual) matches expert teacher judgment, and whether the resulting Socratic tutor interactions measurably improve a student's independent retry success rate compared to a generic hint-based control. Challenge: distinguishing a computational slip from a conceptual gap from a single handwritten artifact is genuinely ambiguous in edge cases; we will address this with confidence scoring and a fallback to flagging ambiguous cases for teacher review rather than guessing.

**Objective 3 — Paper-to-digital data integrity:** Build and stress-test a shared backend (replacing the current per-device local storage prototype) so that scanned paper work and digital work reconcile into one accurate per-student mastery record with no data loss or misattribution, including a batch-scan workflow where a teacher processes many students' papers in one session.

**Objective 4 — Learning-outcome pilot:** Deploy the validated system, for the first time with real students, in a small number of partner classrooms (public, private, and RTI-service settings) for a full grading period, measuring mastery-tier progression and standardized-assessment correlation against a comparable control group.

---

## 3. The Market Opportunity
*(limit 1,750 characters — this draft is 1,523)*

NKN's primary customers are K-12 schools and districts running Response to Intervention (RTI) and special education programs, which are required by law to collect frequent, documented progress-monitoring data and currently do this largely by hand. Secondary markets include private tutoring practices, homeschool families, and individual classroom teachers seeking daily low-lift formative assessment. The founder has spent over two decades as a classroom teacher and district specialist generating exactly this kind of documentation manually, and built NKN to solve her own daily workflow problem first. She has also operated a paying tutoring business, the math helpER+, under MOSCANA Mathematics LLC since 2014 — real commercial validation of demand for this method, independent of any school district relationship.

Competing adaptive platforms (IXL, DreamBox, ST Math, Zearn, Khan Academy) are built around typed or multiple-choice input and cannot grade handwritten work shown, which is both the pedagogical gold standard and, for RTI/IEP compliance, often a documentation requirement. None of the major platforms offer a paper-first or paper/digital hybrid pathway, which excludes classrooms and homes with limited device access — a meaningful gap in lower-income districts. NKN's competitive position rests on two decades of proprietary, classroom-validated curriculum content, a working AI grading prototype, and a founder with direct, ongoing access to the RTI/special-education buyer as a practitioner herself.

---

## 4. The Company and Team
*(limit 1,750 characters — this draft is 1,603)*

Maria Assunta Scanapieco (known professionally as Susie Scanapieco) is the founder and technical/pedagogical lead of MOSCANA Mathematics LLC, which she founded in November 2013. She holds a B.A. in Mathematics (Manhattanville College, 2001) and an M.S. in Secondary Education (Mercy College, 2004), and has taught math continuously since September 2002, including in the Bronx (NYC public schools) and, since 2004, at Providence Public Schools' Gilbert Stuart Middle School and Chariho Regional School District, where she has held several district roles including RTI Math Specialist (2011–2015) and STEM Specialist (2015–present). She personally developed the Need to Know Nine spiral-review method over more than two decades of classroom practice, and since 2014 has also operated a tutoring business, the math helpER+, under MOSCANA Mathematics LLC. She independently designed and built the current AI-driven application prototype, including its grading engine, adaptive tutor, and teacher/student portal.

Susie is committing 20+ hours per week to MOSCANA Mathematics LLC alongside her Chariho position, which will not be affected. The primary gap on the team is dedicated software engineering capacity to take the current founder-built prototype through the hardening, validation, and scaling work described in the technical objectives; Phase I funds are intended to bring on contract engineering support (and, if warranted, a UX/product design contractor) reporting to Susie as technical lead, while she continues to own curriculum design, pedagogical validation, and district/school partnerships.

---

## Reference timeline (for your own use while reviewing — not part of the submitted text)
- Sept 2002: began teaching, NYC public schools (Bronx)
- 2004–2006: Providence Public Schools, Gilbert Stuart Middle School
- 2006–2009: Chariho, RYSE program (grades 7–12)
- 2009–2011: Chariho, special education and honors classes
- 2011–2015: Chariho, Math Specialist for RTI
- Nov 2013: founded MOSCANA Mathematics LLC; began writing Need to Know Nine
- March 2014: opened the math helpER+ tutoring practice (dba under MOSCANA)
- Sept 2015–present: Chariho, STEM Specialist

## Still worth a final check before you submit
- The reference timeline above is taken directly from your notes — a last glance to make sure nothing's missing (e.g., any other credentials, certifications, or degrees you'd want NSF to see) is worth doing.
- Confirm you're comfortable citing "20+ years" for the curriculum's real-classroom track record and "since 2013" for the company/digital work specifically — that's the distinction the draft now makes.
