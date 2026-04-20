// frame — seed data derived from Interview-Prep_Evaluation_v2
// Themes: A Identity/Frame · B People · C Craft · D Strategy · E Entry/Close
// Types: framework | story
// Baseline strength averages v2 three-lens scores (rounded down, min 2)

export const THEMES = {
  A: { name: 'Identity & frame', tag: 'A' },
  B: { name: 'People leadership', tag: 'B' },
  C: { name: 'Craft & process', tag: 'C' },
  D: { name: 'Strategy & influence', tag: 'D' },
  E: { name: 'Entry & closing', tag: 'E' },
};

export const SEED_QUESTIONS = [
  {
    id: 'q01-philosophy',
    order: 1,
    theme: 'A',
    type: 'framework',
    title: 'Your design philosophy',
    prompt: 'Walk me through your design philosophy — what do you believe about design and why does it make products better?',
    answer: `- Brand and product as one → coherent story → trust, real impact
- Simplicity → quick aha and benefit → higher usage, word of mouth
- Good to start → learn quickly → ensure success → optimise → perfect later
- Never be boring → become memorable
- Recipe for long-term business impact`,
    anchor: 'Brand and product as one — that is the through-line that earns trust. And trust is the recipe for long-term business impact.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q02-underperformance',
    order: 2,
    theme: 'B',
    type: 'framework',
    title: 'Handling underperformance',
    prompt: 'How do you handle a designer who is underperforming?',
    answer: `- Understand role fit
- Align on clear expectations
- Provide learning path
- Documentation throughout, HR looped early, same as the person
- No change: 1:1 addressing the gap, timed 30/60/90 success plan
- No change: alternative role or part ways
- Dignity: detach craft fit from person
- Example: the Petter learning — hire where I want the team to be, not where someone might get`,
    anchor: 'Understand the role fit first. Then clear expectations, learning path, documented throughout. If nothing changes, a timed 30-60-90 success plan. If still nothing, we part ways — with dignity. The problem is craft fit, not the person.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q03-bad-designs',
    order: 3,
    theme: 'C',
    type: 'framework',
    title: 'A designer brings bad designs',
    prompt: 'What do you do when a designer consistently brings you bad work?',
    answer: `- Assume best intent (not a bad designer)
- Ask to understand: brief, constraints, research
- Feedback on the work (not the person), around user and business, not taste
- Direction, not solution (so they learn)
- Summarise and document
- No change: sharpen brief, better research, co-design with team or me
- Still no change: 1:1 topic`,
    anchor: 'Bad design is usually a symptom, not a verdict. I assume best intent, ask to understand the brief and constraints, then give direction — not the solution.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q04-grow-designer',
    order: 4,
    theme: 'B',
    type: 'framework',
    title: 'Growing a designer',
    prompt: 'How do you grow designers on your team?',
    answer: `- Understand the career goal and accept it
- Set or adjust career plan with metrics
- Pair, involve, task
- Feedback and review cycles
- Real growth happens through stretch (leaving comfort), exposure to leadership, ownership of something visible
- Example: Experience Design team — career plans in place, ownership (motion design → UX guidelines, team representation)`,
    anchor: 'Understand their goal, accept it, then set a career plan with metrics. But real growth happens through stretch, exposure to leadership, and ownership of something visible.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q05-hire',
    order: 5,
    theme: 'B',
    type: 'framework',
    title: 'Hiring',
    prompt: 'What do you look for when hiring designers?',
    answer: `- Better skill than me in what matters → learn in interview
- Open to learn → first question: what do you want to learn
- Collab → process clear
- Comms → cohesive story and answers
- Critique capable → share feedback, learning
- Diversity
- 9-person team built from zero at SumUp, 90+ design community co-built. I have hired at scale.`,
    anchor: 'Hire above the bar. Better skill than me in what matters, open to learn, collaborative, clear in comms, critique-capable. I have built a team of 9 from zero and co-built a 90+ design community.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q06-manage',
    order: 6,
    theme: 'B',
    type: 'framework',
    title: 'How you manage',
    prompt: 'Walk me through how you manage a design team.',
    answer: `Set direction and get out of the way. Three layers:
- Set context: purpose (mission and strategy), guardrails (principles), success metrics
- Hire above the bar (better skill, open to learn, collab, comms)
- Protect three rituals — craft, impact, growth:
  - craft (critiques, availability)
  - impact (cocreations, share-outs, retros)
  - growth (1:1s, career plan, peer feedback)`,
    anchor: 'Set direction and get out of the way. Three layers: set context, hire above the bar, protect three rituals — craft, impact, growth.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q07-ideal-position',
    order: 7,
    theme: 'A',
    type: 'framework',
    title: 'Your ideal position',
    prompt: 'What does your ideal role look like?',
    answer: `- 70% strategy, 30% operational (create an impactful team even when I am not around)
- Hands-on to stay up to date
- 5–8 direct reports most effective
- Influence in brand`,
    anchor: 'Seventy-thirty. Strategy mostly, operational enough to keep the bar honest. Five to eight direct reports. Hands-on enough to stay current. Influence in brand where brand and product meet.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q08-research',
    order: 8,
    theme: 'C',
    type: 'framework',
    title: 'Your experience with research',
    prompt: 'Tell me about your experience with research.',
    answer: `- Not by title and never led research, but woven into every step of my process
- Fjord: starting point of engagements → desk research, interviews → listen, then build
- Nokia / HERE: deep research and foresight, user testings, public feedback
- SumUp: guerilla research, shadowing, behavioural data, market foresight
- Approach: ensure research is done to understand the problem or evaluate the solution to control risk. Tools depend. Research shall support decision-making, not slow it down. Findings shall travel through the company.`,
    anchor: 'Not by title, never led research — but woven into every step of my process for 15 years. From Fjord to SumUp, my job was always to make sure research supports the decision, not slow it down.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q09-brand-product',
    order: 9,
    theme: 'D',
    type: 'framework',
    title: 'Brand and product',
    prompt: 'How do you think about the relationship between brand and product?',
    answer: `- Two disciplines, but same appearance for users → if one is different, credibility is lost
- Central design in smaller domains, shared ownership in larger domains
- Example: built the Experience Design team (multi-disciplines, increase knowledge, cocreation, belief in ownership) → holistic product vision, spoke for two domains, larger impact`,
    anchor: 'Two disciplines, one appearance for users. If one is different, credibility is lost. At SumUp I built the Experience Design team to make that real.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q10-ftu',
    order: 10,
    theme: 'D',
    type: 'story',
    title: 'A project with real business impact',
    prompt: 'Tell me about a project that had real business impact.',
    answer: `- Led redesign of FTU at SumUp to accelerate multi-product growth
- New merchants bought a card reader but only 20% added a second product within 30 days
- Acquisition after was slow and expensive
- Gap: I defined an intent-based and progressive onboarding framework
- How: understand the profile early, the one right product at the right time → a partner, not just a reader
- Risk control: aligned PM and Eng on incremental rollout
- Shipped 3 key secondary products in UK, GER, FR, BR
- Result: within 30 days, 10% of merchants used faster payout and payment alternatives → 4.5% impact on total transaction volume
- What was wrong: design-driven argumentation for buy-in failed first time; bumpy road to get it going`,
    anchor: 'At SumUp I led the FTU redesign to accelerate multi-product growth. Within 30 days, 10% of new merchants adopted faster payout and payment alternatives — that moved total transaction volume by 4.5%.',
    beats: [
      'Problem: 20% +1-product within 30d, slow expensive acquisition',
      'Gap I defined: intent-based, progressive onboarding framework',
      'How: profile early, right product at right time — partner not reader',
      'Risk control: PM + Eng aligned on incremental rollout',
      'Result: 10% merchants in 30d, 4.5% TPV uplift',
      'What went wrong: first buy-in attempt failed, bumpy start',
      'Role split: I set framework + metrics; team owned design; PM + Eng owned rollout',
    ],
    baseline: 5,
  },
  {
    id: 'q11-measure-success',
    order: 11,
    theme: 'C',
    type: 'framework',
    title: 'How you measure success',
    prompt: 'How do you measure design success?',
    answer: `- Craft: internal (DS adoption, market comparison); external (reputation, portfolios, app store, Trustpilot)
- Business: KPIs, conversion, activation, retention, revenue attributed to design
- Team: eNPS, retention, time to productivity, internal reputation (applications, recruiters)
- All together, not in isolation
- Cadence: depends. Good balance between seeing traction and not over-scanning.`,
    anchor: 'Three axes — craft, business, team. All together, not in isolation. Cadence depends — enough to see traction, not so much you over-scan.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q12-design-strategy',
    order: 12,
    theme: 'D',
    type: 'framework',
    title: 'Building design strategy',
    prompt: 'How do you build a design strategy?',
    answer: `Bridge between business bets and user benefit. Three answers: what we are building, whom for, what good looks like. If a designer can't tell me, we don't have one yet.
1. Business strategy bets for 1–2 years, without the useless ones
2. Map product to understand frictions and opportunities
3. Pick 2–3 big bets with biggest business impact (success metric and owner)
4. Develop "solutions" with the team (not too deep) and align with C-level
5. Socialize to product, engineering, marketing, research, leadership, design
6. Keep it alive`,
    anchor: 'Design strategy is the bridge between business bets and user benefit. Three answers: what we are building, who for, what good looks like. If a designer cannot tell me, we do not have one yet.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q13-scale-craft',
    order: 13,
    theme: 'C',
    type: 'framework',
    title: 'Scale design without killing craft',
    prompt: 'How do you scale design without killing the craft?',
    answer: `- Avoid too much process, it kills craft. Scale clarity, not paperwork.
- Design system alive and source of truth (tokens, variants, accessibility baked in) → designers spend more time on the problem
- Rituals to protect craft: weekly critiques, monthly share-outs, quarterly design strategy reviews
- Clear ownership: squads own delivery, tribes own strategy, ops own the system
- Clear definition of done: ships on time, meets accessibility bar, holds up in critique, moves a metric
- Keep speed: focused onboarding. 90-day expectation management. Slow exposure. Quick deliverables. Buddy.`,
    anchor: 'Scale clarity, not paperwork. Design system as living source of truth, rituals to protect craft, clear ownership — squads deliver, tribes strategize, ops owns the system.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q14-c-level',
    order: 14,
    theme: 'D',
    type: 'framework',
    title: 'Working with C-Level',
    prompt: 'How do you work with C-level?',
    answer: `- Align on goals, KPIs, outcomes. Avoid how-debates. Commit to outcome.
- Accept accountability on the outcome in exchange for room to solve it creatively
- Create discovery space for the how. Explore a large range of opportunities to learn fast. Evaluate.
- Share progress async and tangibly: prototypes, experiment results, milestones, release plans. Visual when possible, data when needed.
- When risk is manageable and critical feedback is addressed, keep moving. Don't wait for perfection.
- Example: show both versions, clearly explain opportunity and impact differences. Disagree and commit.`,
    anchor: 'Align on outcomes, not on how. I accept accountability for the outcome in exchange for room to solve creatively.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q15-conflict',
    order: 15,
    theme: 'D',
    type: 'story',
    title: 'Conflict between design, product, engineering',
    prompt: 'How do you handle conflict between design, product, and engineering?',
    answer: `- Curiosity first. Understand the situation. Ask what they are seeing that I am not.
- Reframe around user and business. Design talks experience. Product → roadmap. Engineering → feasibility.
- Bring back to: what does this change for the user, what does it change for the business?
- Still disagree → go to decision maker, present trade-off, agree / disagree but commit.
- Example: Profile & Settings. List item improvement for findability, rollout at risk due to dev effort for custom component. Align: reconvey need, release with current to ship fast, improve list item in second stage.`,
    anchor: 'Curiosity first. I reframe around user and business — design talks experience, product talks roadmap, engineering talks feasibility. If we still disagree, we escalate with the trade-off written down, and commit.',
    beats: [
      'Situation: Profile & Settings, list item for findability',
      'Conflict: dev effort for custom component threatens rollout',
      'My move: reconvey the user need',
      'Resolution: ship v1 with current component, improve in v2',
      'Learning: sequencing beats winning',
    ],
    baseline: 5,
  },
  {
    id: 'q16-influence',
    order: 16,
    theme: 'D',
    type: 'story',
    title: 'Influence without authority',
    prompt: 'How do you influence without authority?',
    answer: `- Be useful before you are important. Provide insights, knowledge, expertise. Valuable → invited to conversations that matter, not by org chart.
- Speak their language. PM, EM, marketing. Translate design into their domain (UX principle vs click rate vs DS adjustment).
- Build track record. One good bet earns the right to the next. Grows over quarters.
- Slower than authority, but scales further. Team keeps going even without you.
- Example: the success of the Experience Design team was a major contributor to hiring the 90+ design org.`,
    anchor: 'Be useful before you are important. Speak their language. Build track record. Slower than authority — but scales further.',
    beats: [
      'Belief: invited by value, not by org chart',
      'Tactic: translate design into their language',
      'Mechanism: track record compounds over quarters',
      'Proof: Experience Design team → 90+ org hires',
      'Closing thought: team keeps going without me',
    ],
    baseline: 5,
  },
  {
    id: 'q17-maturity',
    order: 17,
    theme: 'D',
    type: 'framework',
    title: 'Influencing design maturity',
    prompt: 'How do you move a company up the design maturity curve?',
    answer: `- Three levels: low (beautify), medium (completes given roadmap), high (part of strategy). One of the key jobs of a design director.
- Diagnose the step honestly (design lead above personal preference)
- Make impact visible in business language:
  - Shift the conversation to outcomes — adoption, activation, retention, revenue — tie design work to them as early as possible
  - Rituals to make design quality visible: critiques, share-outs, strategy reviews, traveling design docs
  - Pick 2–3 wins and make them public
- Hire ahead of the curve — where the team should be in 1–2 years
- Patience. Maturity compounds. Track small signals. 1–2 years, not weeks.
- Example: Experience Design team members incrementally invited into more important topics. Success. Education on how to say no.`,
    anchor: 'Three levels — beautify, complete, strategy. Diagnose honestly. Then three moves: make impact visible in business language, hire ahead of the curve, and stay patient — maturity compounds in years, not weeks.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q18a-failure-petter',
    order: 18,
    theme: 'B',
    type: 'story',
    title: 'A time you failed — people (Petter)',
    prompt: 'Tell me about a time you failed as a manager.',
    answer: `- Hired a new joiner. Ok fit for role (craft), excelled in operational tasks.
- Saw potential to grow quickly and become my backup → onboarding and 6-month growth plan for trial period.
- Results not satisfying. Craft did not accelerate. Team not satisfied.
- Part ways at end of trial period → terrible for team and candidate.
- Learning: don't hire where I want people to be — hire where I want the team to be. Hire ahead of the curve.`,
    anchor: 'I bet on potential over current craft. It failed. I learned to hire for where the team needs to be, not where someone might get.',
    beats: [
      'Setup: new joiner, ok craft, strong ops, strong comms',
      'My bet: potential to grow into my backup',
      'What went wrong: craft did not accelerate, team unsatisfied',
      'Decision: part ways at end of trial',
      'Cost: terrible for team and candidate',
      'Learning: hire for where the team needs to be, not where someone might get',
    ],
    baseline: 5,
  },
  {
    id: 'q18b-failure-lighthouse',
    order: 19,
    theme: 'B',
    type: 'story',
    title: 'A time you failed — project (Experience Lighthouse)',
    prompt: 'Tell me about a strategic initiative that didn\'t land.',
    answer: `- Design fragmented, new central team, needed to build reputation
- Internal alignment needed → improve design quality by communicating a cohesive 1-year design vision
- C-level loved it and shared company-wide → I was proud
- Domain owners and design complained I had gone beyond domains and set roadmaps
- Bad reputation. I had to explain: it's an outlook, not a detailed solution.
- Learning: no one likes someone else telling them what to do.
- What I do now: share earlier, over-communicate purpose, over-involve key stakeholders.`,
    anchor: 'I launched a design vision that C-level loved and the domains hated. The learning: no one likes someone else telling them what to do.',
    beats: [
      'Context: fragmented design, new central team, reputation needed',
      'Initiative: 1-year cohesive design vision, aligned with C-level',
      'Reception: C-level shared company-wide — I was proud',
      'Backlash: domains and design felt overrun',
      'Why it failed: vision looked like a roadmap',
      'What I do now: share earlier, over-communicate purpose, over-involve',
    ],
    baseline: 5,
  },
  {
    id: 'q19-ai',
    order: 20,
    theme: 'C',
    type: 'framework',
    title: 'AI in design',
    prompt: 'What do you think about AI in design?',
    answer: `- Same sparks as when the smartphone came to life
- For users: huge potential in the background (personalisation, intelligence, language). Less in the foreground (chatbots).
- For designers: faster to discover the problem — faster research, quicker explorations, prototyping, content. Gives tools to make better decisions, which should not yet be made by AI. At org level, shifts team mix toward fewer, more senior designers.
- Risk: outsourcing taste and decision-making. Avoid content overload. Same as design after the computer — the challenge is keeping the quality bar.
- Example: desk research, problem scope, prototype, UX analysis.`,
    anchor: 'Same sparks as the smartphone arrival. For users it is a background story — personalisation, intelligence, language — not chatbots. For designers it compresses research and exploration. The risk is outsourcing taste.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q20-remote',
    order: 21,
    theme: 'B',
    type: 'framework',
    title: 'Leading remote or distributed teams',
    prompt: 'How do you lead remote or distributed teams?',
    answer: `- Async by default. Meetings are expensive, sometimes not possible due to timezones. Push for written decisions, structured documentation — not whiteboards.
- Few but good rituals: weekly critique, monthly share-outs, quarterly in-person if possible to build trust quicker. Push what remote does better: deep focus, diverse hiring, flexible life pattern.
- Present as a leader: available, quick, responsive. Not omnipresent, but reliably available. My team should never wonder where I stand on their work. The challenge is growing junior designers.
- Example: SumUp, built and led team of 9 through 1.5 years of COVID.`,
    anchor: 'Async by default. Few but good rituals. Present as a leader — available, quick, responsive. My team should never wonder where I stand on their work.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q21-first-90',
    order: 22,
    theme: 'E',
    type: 'framework',
    title: 'Your first 90 days',
    prompt: 'Walk me through your first 90 days in a new role.',
    answer: `- Day 30: listen (C-level, team), map, understand key product challenges, design org, engineering, company
- Day 60: identify and evaluate opportunities, build relationships
- Day 90: propose strategy and metrics, a quick win visible in business signals, team rituals like feedback culture in place
- No team or org changes`,
    anchor: 'Day 30: listen, map, understand. Day 60: identify opportunities, build relationships. Day 90: propose strategy with metrics, one quick win, rituals in place. No team or org changes yet.',
    beats: [],
    baseline: 4,
  },
  {
    id: 'q22-weakness',
    order: 23,
    theme: 'A',
    type: 'story',
    title: 'Your biggest weakness',
    prompt: 'What is your biggest weakness?',
    answer: `- Over-invest in coherence. I want brand, product, and story to feel as one thing. Sometimes I've pushed too hard.
- Learned to separate better: is this coherent at the system level, and does it need to be coherent right now?
- Now I agree with the team what "good enough" is to evaluate the bet early.
- Example: data visualisation. Built a wide range of charts, delayed the system. Two early ones would have given benefit to users and business already.`,
    anchor: 'I over-invest in coherence. I want brand, product, and story to feel like one thing — and I have pushed for that when the right move was to ship messier and faster. Now I separate: is this coherent at the system level, and does it need to be coherent right now?',
    beats: [
      'Weakness: over-investment in coherence',
      'Cost: delay over speed when speed was the right call',
      'Reframe: system-level coherence vs. right-now coherence are different',
      'Fix: agree with team what good enough is, per bet',
      'Example: data viz — shipped all charts instead of two that mattered',
    ],
    baseline: 5,
  },
  {
    id: 'q23-compensation',
    order: 24,
    theme: 'E',
    type: 'framework',
    title: 'Compensation and notice',
    prompt: 'What are your compensation expectations?',
    answer: `- Notice: 3 months
- Comp: understand full role first → range → seniority package reflecting role ambitions
- Base + equity + benefits equally important
- Flexible in structure`,
    anchor: 'Three months notice. I want to understand the full role first, then the range. Base, equity, benefits — equally important. Flexible in structure.',
    beats: [],
    baseline: 3,
  },
  {
    id: 'q24-ownership',
    order: 25,
    theme: 'C',
    type: 'framework',
    title: 'Design ownership and decision-making',
    prompt: 'How do you think about design ownership and decision-making?',
    answer: `Three categories, agreed before kickoff:
- Owns end-to-end → not output, outcome
- Co-owns with product or engineering → shared accountability, I moderate
- Influences but doesn't own → tricky (e.g. marketing page), visible perspective and documented, disagree and commit
How disputes get resolved when we disagree: the metric decides, or the roadmap, or we get in a room. If all three fail, I bring it to the decision-maker with a trade-off memo.
Example: FTU — design owned the framework and metrics, PM owned roadmap, Eng owned rollout. A clean ownership story.`,
    anchor: 'Three categories, agreed before kickoff. What design owns end-to-end — outcome, not output. What we co-own — shared accountability. What we influence but do not own — visible perspective, documented, disagree and commit.',
    beats: [],
    baseline: 5,
  },
  {
    id: 'q25-questions-back',
    order: 26,
    theme: 'E',
    type: 'framework',
    title: 'Questions for the company',
    prompt: 'What questions do you have for us?',
    answer: `By audience:
- For a CEO or founder: What is the one thing design could help you unlock in the next twelve months that it isn't unlocking today? How do you think about the relationship between brand and product in this company? What would success for the design director look like a year in, in your words?
- For a product leader: Where does the design and product relationship work well today, and where does it hurt? What is the decision you wish design would push harder on?
- For a design leader or peer: What is the hardest thing about doing design here that nobody writes about in the job description? What is the team most proud of, and most frustrated by?
- For anyone: What would make the next person in this role fail? And what would make them legendary? (That last one almost always opens the real conversation.)`,
    anchor: 'I ask by audience. To a CEO: what could design unlock in twelve months that it is not today? To a product leader: where does the design-product relationship hurt? To a peer: what is the hardest thing about doing design here that nobody writes about? And to anyone: what would make the next person fail — and what would make them legendary?',
    beats: [],
    baseline: 5,
  },
];

export function totalQuestions() {
  return SEED_QUESTIONS.length;
}
