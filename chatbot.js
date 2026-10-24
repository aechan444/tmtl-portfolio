// TMTL Helper: a small offline FAQ chatbot that answers questions about the portfolio by keyword matching.
(function () {
  const doc = (href, label) => `<a href="${href}" data-chat-view>${label}</a>`;
  const go = (hash, label) => `<a href="${hash}" data-chat-go>${label} →</a>`;

  // Order matters on ties: more specific topics come first.
  const TOPICS = [
    {
      keys: ['desmos'],
      answer: `<b>Desmos</b> was used by Teacher J in a Geometry lesson. Students changed the values in linear equations and watched the slope and position of the line change in real time, instead of only plotting points on paper. We classified this as <b>Modification</b> on the SAMR model.<br>${go('#field-study', 'Field Study Highlights')}`,
    },
    {
      keys: ['deltamath', 'delta math'],
      answer: `<b>DeltaMath</b> was used in Teacher J's Algebra 1 class for practice on simplifying expressions and the properties of exponents. It checks answers automatically and gives immediate feedback, which saved grading time and helped students fix mistakes right away.<br>${go('#field-study', 'Field Study Highlights')}`,
    },
    {
      keys: ['tpack', 'pedagogical', 'content knowledge'],
      answer: `<b>TPACK</b> looks at how Technology, Pedagogy, and Content Knowledge work together. In our field study:<ul><li><b>CK:</b> linear graphs, algebraic expressions, exponents</li><li><b>PK:</b> guided practice, step-by-step explanations, peer discussion</li><li><b>TK:</b> Desmos for dynamic graphs, DeltaMath for practice and feedback</li></ul>${go('#field-study', 'See the framework analysis')}`,
    },
    {
      keys: ['samr', 'substitution', 'augmentation', 'modification', 'redefinition'],
      answer: `<b>SAMR</b> describes how technology changes a learning task: <b>S</b>ubstitution, <b>A</b>ugmentation, <b>M</b>odification, <b>R</b>edefinition. Teacher J's Desmos lesson reached <b>Modification</b>, because students manipulated equations to investigate graph transformations, which substantially changed the task.<br>${go('#field-study', 'See the framework analysis')}`,
    },
    {
      keys: ['constraint', 'challenge', 'problem', 'limitation', 'internet', 'device', 'electricity'],
      answer: `Constraints Teacher J faced, and how they responded:<ul><li>Limited resources → choose accessible tools that fit the objectives</li><li>Limited devices, internet, or electricity → printed worksheets and in-class work time</li><li>Technology dependence → step-by-step solutions and peer explanations</li><li>Uncertain learning gains → compare assessment results</li><li>Hard-to-visualize concepts → interactive tools</li></ul>${go('#field-study', 'Field Study Highlights')}`,
    },
    {
      keys: ['improvement', 'warm-up', 'warm up', 'recommend', 'proposal', 'proposed'],
      answer: `Our proposed improvement is a short <b>low-technology warm-up</b> before digital activities:<ol><li>Start on paper</li><li>Explore digitally with Desmos or DeltaMath</li><li>Compare results</li><li>Explain reasoning without relying only on the tool</li></ol>${go('#field-study', 'Field Study Highlights')}`,
    },
    {
      keys: ['lesson', 'advice', 'beginning teacher', 'tips', 'learned'],
      answer: `Lessons for beginning mathematics teachers from the field study:<ul><li>Align tools with objectives</li><li>Plan for accessibility</li><li>Prioritize reasoning</li><li>Evaluate learning, not just engagement</li><li>Keep developing your tech skills</li></ul>Teacher J's advice: <i>“Choose technology that supports your learning objectives, is easy to use, and is accessible to all students. Always have a backup plan.”</i>`,
    },
    {
      keys: ['teacher j', 'interview', 'steam academy', 'ferguson', 'missouri', 'participant'],
      answer: `<b>Teacher J</b> teaches mathematics (Grades 7–12) at STEAM Academy Middle School in Ferguson, Missouri, with 9 years of experience. We interviewed them on October 8–11, 2026 through an asynchronous Google Forms survey with 10 questions, after asking permission by letter.<br>${doc('files/MODULE%204/FIELD%20REPORT.pdf', 'Open the Field Report')} · ${go('#field-study', 'Highlights')}`,
    },
    {
      keys: ['role play', 'roleplay', 'misleading', 'graph', 'new haven', 'temperature', 'scene'],
      answer: `Our role play taught <b>“Misleading Digital Media Graphs.”</b> A temperature graph of New Haven, Connecticut shows only January to July, so it looks like the temperature keeps rising. Students spot the missing months and rebuild the graph with all twelve. The key question: <i>“Is the graph showing all the relevant data?”</i><br>${doc('files/MODULE%203/ROLE%20PLAY%20SCRIPT%20AND%20FLOW.pdf', 'Open the script')} · ${go('#modules', 'Module 3')}`,
    },
    {
      keys: ['fraction', 'decimal', 'redesign', 'grade 7', 'deped', 'match and explain', 'learning experience'],
      answer: `Our redesigned lesson is <b>“Fraction–Decimal Match and Explain”</b> for Grade 7, based on DepEd Mathematics 7, Quarter 1 Module 5. Learners work in pairs to predict, match, and justify fraction and decimal cards (like 3/4 = 75/100 = 0.75) before formalizing the rule. It works fully offline, and a calculator is only optional for checking.<br>${doc('files/MODULE%203/Mathematics_Learning_Experience_Analysis_and_Redesign_.pdf', 'Open the redesign')} · ${go('#modules', 'Module 3')}`,
    },
    {
      keys: ['concept map', 'module 2', 'map', 'geogebra'],
      answer: `<b>Module 2</b> is our concept map built around <b>Technology in Mathematics Teaching and Learning</b>. It covers challenges, required skills, learning pathways, uses in math, tools (PowerPoint, Excel, Google Sheets, GeoGebra, math apps), and benefits.<br>${doc('files/MODULE%202/TTL%20CONCEPT%20MAP%20-%20GROUP%204.pdf', 'Open the concept map')} · ${go('#modules', 'Module 2')}`,
    },
    {
      keys: ['module 1'],
      answer: `<b>Module 1</b> doesn't have any files in the portfolio yet. They will be added later.<br>${go('#modules', 'Go to Modules')}`,
    },
    {
      keys: ['module 3'],
      answer: `<b>Module 3</b> has two parts: <b>(1)</b> an analysis and redesign of a Grade 7 fractions-and-decimals lesson, and <b>(2)</b> a classroom role play on misleading digital media graphs. Ask me about either one!<br>${go('#modules', 'Go to Module 3')}`,
    },
    {
      keys: ['module 4', 'field study', 'field report', 'letter', 'appendix', 'appendices'],
      answer: `<b>Module 4</b> is our field study, <i>Application 3: Field-Based Bridge</i>. We wrote a permission letter, interviewed Teacher J through a Google Form, and analyzed the answers using TPACK and SAMR. The appendices include the Messenger conversation and all 10 form responses.<br>${doc('files/MODULE%204/FIELD%20REPORT.pdf', 'Open the Field Report')} · ${go('#field-study', 'Highlights')}`,
    },
    {
      keys: ['module', 'output', 'work'],
      answer: `The portfolio has four modules:<ul><li><b>Module 1:</b> files coming soon</li><li><b>Module 2:</b> TTL Concept Map</li><li><b>Module 3:</b> Learning Experience Redesign &amp; Role Play</li><li><b>Module 4:</b> Field Study with Teacher J</li></ul>${go('#modules', 'Go to Modules')}`,
    },
    {
      keys: ['reflection', 'reflect', 'insight'],
      answer: `Our reflection says technology integration goes beyond using devices. It's about choosing appropriate tools with purpose: <i>“technology integration is not about using the most advanced tools but about using available resources with purpose and creativity to create meaningful learning experiences.”</i><br>${doc('files/REFLECTION/Reflection.pdf', 'Open the Reflection')} · ${go('#reflection', 'Reflection')}`,
    },
    {
      keys: ['member', 'team', 'who', 'group', 'student', 'name'],
      answer: `We are <b>Group 4, BSED-Math 2A Newton</b>:<ul><li>Shyrah Faye Aguirre</li><li>Mae D. Albacite</li><li>Alyssa Mae D. Anor</li><li>Jean Louren Desamparado</li><li>Birthchelda E. Masanque</li><li>Ilexis Wayrint Miano</li><li>one more member, name to be added</li></ul>${go('#members', 'Meet the team')}`,
    },
    {
      keys: ['instructor', 'professor', 'course', 'subject', 'ttl', 'school', 'university', 'ctu', 'argao', 'section'],
      answer: `This portfolio is for <b>Technology for Teaching and Learning in Mathematics (TTL 1)</b>, handled by <b>Judith M. Aleguen</b>, at <b>Cebu Technological University, Argao Campus</b>. We are BSED-Math 2A Newton, Group 4.`,
    },
    {
      keys: ['introduction', 'intro', 'about', 'purpose', 'question', 'mathematical thinking', 'portfolio'],
      answer: `Our guiding question is <i>“How can technology support mathematical thinking?”</i> As future math teachers, we believe technology makes abstract concepts easier to understand, but it should support the teacher's guidance and the learners' own reasoning, never replace them.<br>${doc('files/SHORT%20INTRODUCTION/Introduction.pdf', 'Open the Introduction')} · ${go('#intro', 'Introduction')}`,
    },
    {
      keys: ['edit', 'change', 'save', 'update'],
      answer: `To edit the page, click <b>✎ Edit page</b> in the bottom-right corner, click any text to change it, click a member photo to replace it, then press <b>Save changes</b> (or Ctrl+S). The site must be opened with <b>Start Portfolio.bat</b> for saving to work.`,
    },
    {
      keys: ['file', 'document', 'pdf', 'download', 'open', 'ppt', 'docx'],
      answer: `Click any PDF on the page to read it right here in the viewer. PowerPoint and Word files download when you click them. Which document do you want? Try asking about the <b>concept map</b>, <b>role play</b>, <b>field report</b>, or <b>reflection</b>.`,
    },
    {
      keys: ['thank', 'thanks', 'salamat', 'bye', 'goodbye'],
      answer: `You're welcome! Enjoy exploring our portfolio.`,
    },
    {
      keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'kumusta'],
      answer: `Hi! I'm the <b>TMTL Helper</b>. Ask me anything about Group 4's portfolio: the members, the modules, the field study, or our reflection.`,
    },
  ];

  const FALLBACK = `Sorry, I don't know that one yet. I can answer questions about the <b>members</b>, the <b>modules</b>, the <b>role play</b>, the <b>fraction–decimal lesson</b>, the <b>field study</b>, <b>TPACK</b>, <b>SAMR</b>, and our <b>reflection</b>.`;

  const SUGGESTIONS = [
    'Who are the members?',
    'What are the modules?',
    'Tell me about the role play',
    'Who is Teacher J?',
    'What is SAMR?',
    'What did you reflect on?',
  ];

  function normalize(text) {
    return ' ' + text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  function reply(text) {
    const t = normalize(text);
    let best = null;
    let bestScore = 0;
    for (const topic of TOPICS) {
      let score = 0;
      for (const key of topic.keys) {
        // short keys must be whole words ("hi" should not match "this"); longer keys match word starts ("member" → "members")
        const pattern = key.length <= 3 ? ` ${key} ` : ` ${key}`;
        if (t.includes(pattern)) score += key.split(' ').length;
      }
      if (score > bestScore) { best = topic; bestScore = score; }
    }
    return best ? best.answer : FALLBACK;
  }

  /* ---------- UI ---------- */
  const root = document.createElement('div');
  root.id = 'chatbot';
  root.innerHTML = `
    <button type="button" class="chat-launcher" id="chat-launcher" aria-expanded="false" aria-controls="chat-panel">
      <span class="chat-launcher-icon">∑</span><span>Ask TMTL Helper</span>
    </button>
    <section class="chat-panel" id="chat-panel" hidden aria-label="TMTL Helper chat">
      <header class="chat-head">
        <span class="chat-avatar">∑</span>
        <div><p class="chat-name">TMTL Helper</p><p class="chat-sub">Ask about our portfolio</p></div>
        <button type="button" class="chat-close" id="chat-close" aria-label="Close chat">✕</button>
      </header>
      <div class="chat-log" id="chat-log" aria-live="polite"></div>
      <div class="chat-chips" id="chat-chips"></div>
      <form class="chat-form" id="chat-form" autocomplete="off">
        <input id="chat-input" type="text" placeholder="Type a question…" aria-label="Your question" maxlength="200">
        <button type="submit" aria-label="Send">➤</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const panel = document.getElementById('chat-panel');
  const launcher = document.getElementById('chat-launcher');
  const log = document.getElementById('chat-log');
  const input = document.getElementById('chat-input');
  const chips = document.getElementById('chat-chips');

  function addMessage(html, who) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + who;
    if (who === 'user') msg.textContent = html; else msg.innerHTML = html;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
    return msg;
  }

  function ask(text) {
    text = text.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    const typing = addMessage('<span class="dots"><i></i><i></i><i></i></span>', 'bot typing');
    setTimeout(() => {
      typing.remove();
      addMessage(reply(text), 'bot');
    }, 450);
  }

  SUGGESTIONS.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-chip';
    b.textContent = s;
    b.addEventListener('click', () => ask(s));
    chips.appendChild(b);
  });

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!log.children.length) addMessage(TOPICS.find(t => t.keys.includes('hello')).answer, 'bot');
      input.focus();
    }
  }

  launcher.addEventListener('click', () => setOpen(true));
  document.getElementById('chat-close').addEventListener('click', () => setOpen(false));
  document.getElementById('chat-form').addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden && document.getElementById('viewer').hidden) setOpen(false); });

  // Links inside answers: documents open in the page viewer, section links scroll there
  log.addEventListener('click', e => {
    const viewLink = e.target.closest('a[data-chat-view]');
    if (viewLink && typeof openViewer === 'function') {
      e.preventDefault();
      openViewer(viewLink.getAttribute('href'), viewLink.textContent.replace(/^Open (the )?/, ''));
      return;
    }
    const goLink = e.target.closest('a[data-chat-go]');
    if (goLink && window.matchMedia('(max-width: 720px)').matches) setOpen(false);
  });
})();
