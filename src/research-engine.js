// ══════════════════════════════════════════════════════════════
// RESEARCH ENGINE — Ported from EloElo Thumbnail Analyzer V4
// All CTR research, content classification, and scoring logic
// ══════════════════════════════════════════════════════════════

// ── Content Type Classification ──
const EARNING_KEYWORDS = [
  '₹', 'rs ', 'rs.', 'rupee', 'rupaye', 'kamao', 'kamai', 'kamaye',
  'income', 'salary', 'paisa', 'paise', 'earning', 'earn ', 'munafa',
  'profit', 'lakh', 'crore', 'monthly income', 'daily income',
  'per month', 'per day', 'investment return', 'kaise kamaye',
  'kitna milega', 'kitna kamate', 'kamane ka', 'paisa kaise'
];

const URGENCY_KEYWORDS = [
  'breaking', 'urgent', 'last date', 'deadline', 'abhi karo',
  'jaldi karo', 'aaj hi', 'turant', 'chetavani', 'warning',
  'alert', 'kal se band', 'hataya gaya', 'banned', 'new rule',
  'naya niyam', 'sarkari update', 'notification out'
];

const CURIOSITY_KEYWORDS = [
  ' ya ', ' ya?', 'trap', 'scam', 'fraud', 'dhoka', 'jhooth',
  'sach ', 'sachai', 'secret', 'raaz', 'rahasya', 'galti',
  'mistake', 'chaukane wala', 'shocking', 'pata nahi tha',
  'koi nahi batata', 'hidden', 'chhupa', 'asli sach',
  'nakli', 'real vs fake', 'truth', 'expose', 'reality'
];

const LISTICLE_PATTERNS = [
  /top\s*\d+/, /best\s*\d+/, /\d+\s*tips/, /\d+\s*tarike/,
  /\d+\s*ways/, /\d+\s*steps/, /\d+\s*galti/, /\d+\s*mistakes/,
  /\d+\s*cheeze/, /\d+\s*tools/, /\d+\s*apps/, /\d+\s*methods/,
  /sabse\s*(best|accha|top)/, /\d+\s*tricks/, /\d+\s*hacks/
];

const COMPARISON_KEYWORDS = [
  ' vs ', ' versus ', 'ya phir', 'konsa best', 'kaun sa',
  'better', 'comparison', 'difference', 'farak', 'compare'
];

const EDUCATION_KEYWORDS = [
  'kya hai', 'kya hota', 'kya hoti', 'meaning', 'matlab',
  'samjho', 'seekho', 'sikhiye', 'jaaniye', 'jaano',
  'psychology', 'mindset', 'explained', 'guide', 'complete guide',
  'basics', 'beginner', 'shuru kaise', 'kaise kare', 'kaise karte',
  'full information', 'puri jankari', 'simply explained'
];

export function classifyTitleContent(title) {
  if (!title) return 'DEFAULT';
  const t = title.toLowerCase().trim();

  for (const kw of EARNING_KEYWORDS) {
    if (t.includes(kw)) return 'EARNING_AMOUNT';
  }
  for (const kw of URGENCY_KEYWORDS) {
    if (t.includes(kw)) return 'URGENCY_NEWS';
  }
  for (const kw of CURIOSITY_KEYWORDS) {
    if (t.includes(kw)) return 'CURIOSITY_HOOK';
  }
  for (const pat of LISTICLE_PATTERNS) {
    if (pat.test(t)) return 'LISTICLE';
  }
  for (const kw of COMPARISON_KEYWORDS) {
    if (t.includes(kw)) return 'COMPARISON';
  }
  for (const kw of EDUCATION_KEYWORDS) {
    if (t.includes(kw)) return 'EDUCATION';
  }

  return 'DEFAULT';
}

// ── Category Default Rules (Fallback) ──
export const CATEGORY_RULES = {
  "Earning Apps":        { rupee: "boost",   number: "boost",   question: "hurts",   exclaim: "neutral" },
  "Finance":             { rupee: "boost",   number: "boost",   question: "hurts",   exclaim: "boost"   },
  "Business":            { rupee: "boost",   number: "boost",   question: "hurts",   exclaim: "neutral" },
  "Astrology":           { rupee: "neutral", number: "hurts",   question: "boost",   exclaim: "neutral" },
  "Devotion":            { rupee: "neutral", number: "neutral", question: "hurts",   exclaim: "neutral" },
  "Government Jobs":     { rupee: "hurts",   number: "boost",   question: "neutral", exclaim: "boost"   },
  "YT/IG Mastery":       { rupee: "boost",   number: "boost",   question: "boost",   exclaim: "boost"   },
  "Technology":          { rupee: "boost",   number: "boost",   question: "boost",   exclaim: "boost"   },
  "Spoken English":      { rupee: "neutral", number: "boost",   question: "boost",   exclaim: "neutral" },
  "AI Tips and Tricks":  { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "boost"   },
  "Government Schemes":  { rupee: "neutral", number: "neutral", question: "boost",   exclaim: "neutral" },
  "Sarkari Services":    { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "neutral" },
  "Career":              { rupee: "neutral", number: "boost",   question: "hurts",   exclaim: "hurts"   },
  "Law":                 { rupee: "neutral", number: "hurts",   question: "boost",   exclaim: "neutral" },
  "Secrets of India":    { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "neutral" },
  "Skill-based Earning": { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "neutral" },
  "Motivation":          { rupee: "neutral", number: "neutral", question: "boost",   exclaim: "neutral" },
  "Scams":               { rupee: "neutral", number: "neutral", question: "boost",   exclaim: "neutral" },
  "Trending":            { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "boost"   }
};

// ── Smart Context-Aware Rules ──
export function getSmartRule(element, category, contentType, title) {
  const t = (title || '').toLowerCase();

  // ── QUESTION MARK ──
  if (element === 'question') {
    if (contentType === 'CURIOSITY_HOOK') return { rule: 'boost', reason: '? is a CURIOSITY HOOK here — creates intrigue/tension. KEEP IT.' };
    if (contentType === 'COMPARISON') return { rule: 'boost', reason: '? works well for comparison titles — makes viewer want to know the answer.' };
    if (contentType === 'EDUCATION') {
      if (t.includes('kya hai') || t.includes('kya hota') || t.includes('kya hoti'))
        return { rule: 'neutral', reason: '? is natural here — it mirrors the viewer\'s question. OK to keep.' };
      return { rule: 'neutral', reason: '? is acceptable in educational titles if it frames the learning question.' };
    }
    if (contentType === 'EARNING_AMOUNT') return { rule: 'hurts', reason: '? creates DOUBT about earning claims. Use ! for confidence instead.' };
    if (contentType === 'LISTICLE') return { rule: 'hurts', reason: '? weakens authority in listicle titles. Statement format is stronger.' };
    if (contentType === 'URGENCY_NEWS') return { rule: 'hurts', reason: '? undermines urgency. Use ! for authority in breaking/deadline content.' };
    if (t.trim().slice(-1) === '?' && t.split('?').length === 2)
      return { rule: 'neutral', reason: '? at end of title can work as a curiosity hook. Evaluate if it creates intrigue.' };
    const catDefault = (CATEGORY_RULES[category] || {}).question || 'neutral';
    return { rule: catDefault, reason: catDefault === 'hurts' ? '? generally hurts CTR in ' + category + ' (but check if this is a curiosity hook).' : '? is acceptable in ' + category + '.' };
  }

  // ── RUPEE SYMBOL ──
  if (element === 'rupee') {
    if (contentType === 'EARNING_AMOUNT') return { rule: 'boost', reason: '₹ with specific amount boosts CTR for earning content — add if missing.' };
    if (contentType === 'CURIOSITY_HOOK') return { rule: 'neutral', reason: '₹ not needed for curiosity/mystery titles — the intrigue itself drives clicks.' };
    if (contentType === 'EDUCATION') {
      const moneyEduKeywords = ['investment', 'mutual fund', 'stock', 'share market', 'trading', 'sip', 'fd', 'loan', 'emi', 'credit', 'debit', 'bank', 'tax', 'gst'];
      for (const kw of moneyEduKeywords) {
        if (t.includes(kw)) return { rule: 'context', reason: '₹ could work here since the topic involves money, but only if showing a specific amount/rate.' };
      }
      return { rule: 'neutral', reason: '₹ not needed for educational/concept content — focus on clarity instead.' };
    }
    if (contentType === 'LISTICLE') {
      const moneyListKeywords = ['save', 'invest', 'earn', 'kamao', 'bachao', 'money', 'paisa'];
      for (const kw of moneyListKeywords) {
        if (t.includes(kw)) return { rule: 'boost', reason: '₹ boosts CTR for money-related listicles — add specific amount.' };
      }
      return { rule: 'neutral', reason: '₹ not relevant for this listicle topic.' };
    }
    if (contentType === 'URGENCY_NEWS') {
      const finImpactKeywords = ['rbi', 'bank', 'tax', 'gst', 'price', 'rate', 'mehengai', 'sasta'];
      for (const kw of finImpactKeywords) {
        if (t.includes(kw)) return { rule: 'boost', reason: '₹ reinforces financial impact in this news/alert — add if relevant.' };
      }
      return { rule: 'neutral', reason: '₹ only needed in news if it involves financial impact.' };
    }
    const catDefault = (CATEGORY_RULES[category] || {}).rupee || 'neutral';
    if (catDefault === 'boost') return { rule: 'context', reason: '₹ generally boosts CTR in ' + category + ', but check if this specific title is about money.' };
    return { rule: catDefault, reason: catDefault === 'hurts' ? '₹ generally hurts CTR in ' + category + '.' : '₹ has no strong effect in ' + category + ' for this type of content.' };
  }

  // ── SPECIFIC NUMBER ──
  if (element === 'number') {
    if (contentType === 'LISTICLE') return { rule: 'boost', reason: 'Numbers are ESSENTIAL for listicle titles — add count (5 tips, 3 ways, etc.).' };
    if (contentType === 'EARNING_AMOUNT') return { rule: 'boost', reason: 'Specific number (₹50,000, 15%) makes earning claim believable — add if missing.' };
    if (contentType === 'URGENCY_NEWS') return { rule: 'boost', reason: 'Number adds urgency (5 din baaki, 2 crore affected) — add deadline or impact number.' };
    if (contentType === 'CURIOSITY_HOOK') return { rule: 'neutral', reason: 'Numbers reduce mystery — curiosity titles work better without specific counts.' };
    if (contentType === 'EDUCATION') return { rule: 'neutral', reason: 'Numbers not essential for concept explanations unless it\'s a numbered framework.' };
    if (contentType === 'COMPARISON') return { rule: 'context', reason: 'Numbers help in comparisons IF showing specific data points (returns, speed, price).' };
    const catDefault = (CATEGORY_RULES[category] || {}).number || 'neutral';
    return { rule: catDefault, reason: catDefault === 'boost' ? 'Numbers generally boost CTR in ' + category + '.' : catDefault === 'hurts' ? 'Numbers generally hurt CTR in ' + category + ' — use emotional words instead.' : 'Numbers have no strong effect for this content.' };
  }

  // ── EXCLAMATION MARK ──
  if (element === 'exclaim') {
    if (contentType === 'URGENCY_NEWS') return { rule: 'boost', reason: '! reinforces urgency — essential for breaking/deadline content.' };
    if (contentType === 'EARNING_AMOUNT') return { rule: 'boost', reason: '! adds excitement and confidence to earning claims.' };
    if (contentType === 'CURIOSITY_HOOK') return { rule: 'hurts', reason: '! kills curiosity — ? or ... works better for mystery/intrigue titles.' };
    if (contentType === 'EDUCATION') return { rule: 'neutral', reason: '! feels clickbaity on educational content — calm authority works better.' };
    if (contentType === 'LISTICLE') {
      const excitingKeywords = ['best', 'top', 'amazing', 'kamaal', 'dhamaka', 'powerful', 'must'];
      for (const kw of excitingKeywords) {
        if (t.includes(kw)) return { rule: 'boost', reason: '! adds energy to this exciting listicle.' };
      }
      return { rule: 'neutral', reason: '! is optional for informational lists — works for exciting ones, skip for factual ones.' };
    }
    if (contentType === 'COMPARISON') return { rule: 'neutral', reason: '! is optional in comparisons — works if revealing a clear winner.' };
    const catDefault = (CATEGORY_RULES[category] || {}).exclaim || 'neutral';
    return { rule: catDefault, reason: catDefault === 'boost' ? '! generally boosts CTR in ' + category + '.' : catDefault === 'hurts' ? '! generally hurts CTR in ' + category + '.' : '! has no strong effect for this content.' };
  }

  return { rule: 'neutral', reason: '' };
}

// ── Smart Tips (Category × Content Type) ──
const SMART_TIPS = {
  'Finance': {
    'CURIOSITY_HOOK': 'Add a specificity word (Loan, Credit Card, FD, SIP) to make the curiosity targeted — "X Ya Trap?" is good but "Credit Card Offer Ya Trap?" is better.',
    'EARNING_AMOUNT': 'Add exact ₹ amount + timeframe (monthly/yearly) for credibility. "₹50,000/month" > "bahut paisa".',
    'EDUCATION': 'Add "Hindi mein" or "Simply Explained" or "for Beginners" to signal accessibility. Concept titles need trust signals.',
    'LISTICLE': 'Bold the NUMBER on the thumbnail (make it 2x bigger than other text). Listicles live and die by the count.',
    'URGENCY_NEWS': 'Add the DATE or DEADLINE prominently. Financial news without dates feels vague.',
    'COMPARISON': 'Show BOTH options visually on the thumbnail (split-screen or vs badge). Comparison needs visual contrast.',
    'DEFAULT': 'Finance audience responds to specific data. Add one concrete number or percentage on the thumbnail.'
  },
  'Earning Apps': {
    'EARNING_AMOUNT': 'Show WITHDRAWAL PROOF on thumbnail — ₹ amount with payment app logo builds instant trust.',
    'CURIOSITY_HOOK': 'Add "Real or Fake?" or "Sach Ya Jhooth?" — app-related curiosity drives massive clicks.',
    'EDUCATION': 'Replace with "How I Earned ₹X" format — Earning Apps audience wants proof, not theory.',
    'LISTICLE': 'Show the TOP earning app logo/icon prominently on the thumbnail.',
    'URGENCY_NEWS': 'Show the app name + "BANNED?" or "Update Required" — urgency in earning apps creates fear of missing out.',
    'COMPARISON': 'Show both app logos side-by-side with earning amounts. Visual proof of which pays more.',
    'DEFAULT': 'Earning Apps audience needs PROOF. Add payment screenshot or ₹ amount on thumbnail.'
  },
  'Business': {
    'EARNING_AMOUNT': 'Show "Investment: ₹X → Return: ₹Y" format on thumbnail. Business audience wants ROI clarity.',
    'CURIOSITY_HOOK': 'Business curiosity works great — just add the business type for specificity.',
    'EDUCATION': 'Add "Step-by-Step" or "Full Plan" to make business education feel actionable, not theoretical.',
    'LISTICLE': 'Show the business type icons/images for each list item on the thumbnail.',
    'URGENCY_NEWS': 'Add "New GST Rule" or "License Update" with date — business owners fear missing compliance deadlines.',
    'COMPARISON': 'Show investment vs return for both options. Business comparisons need ROI clarity.',
    'DEFAULT': 'Business audience wants real examples. Add a shop/product image or revenue number on thumbnail.'
  },
  'Astrology': {
    'CURIOSITY_HOOK': 'Add specific RASHI name in the thumbnail — personalization drives clicks in Astrology.',
    'EDUCATION': 'Use mystical/zodiac imagery. Astrology education should feel cosmic, not academic.',
    'EARNING_AMOUNT': 'Astrology + money is rare. If showing "lucky numbers for wealth", use zodiac imagery not ₹.',
    'LISTICLE': 'Show rashi symbols for each list item. "Top 3 Lucky Rashis" needs zodiac visuals.',
    'URGENCY_NEWS': 'Add exact DATE prominently — "25 Feb ke baad". Astrology urgency = planetary timing.',
    'COMPARISON': 'Show both rashis/planets visually. Cosmic comparison imagery works better than text.',
    'DEFAULT': 'Astrology needs mystery + personalization. Add rashi symbol and mystical background colors.'
  },
  'Devotion': {
    'CURIOSITY_HOOK': 'Add "Kya Aapko Pata Hai?" with deity imagery — devotional curiosity must stay respectful.',
    'EDUCATION': 'Show mantra text or puja items prominently. Devotion education = visual guide to rituals.',
    'LISTICLE': 'Show divine symbols for each item. "5 Powerful Mantras" needs spiritual imagery per mantra.',
    'URGENCY_NEWS': 'Add festival name + date prominently. "Navratri Special" or "Shivratri — Aaj Raat" drives clicks.',
    'COMPARISON': 'Devotion comparisons are rare. If present, keep both options reverential — no "vs" battle format.',
    'DEFAULT': 'Devotion audience responds to deity images, warm golden tones, and mantra text. Keep it reverent.'
  },
  'Government Jobs': {
    'EARNING_AMOUNT': 'Show SALARY GRADE prominently (₹25,000 - ₹60,000/month). Job seekers scan for pay first.',
    'CURIOSITY_HOOK': 'Add "Kya Aap Eligible Ho?" — Sarkari job curiosity = eligibility check anxiety.',
    'EDUCATION': 'Show syllabus/exam name prominently. Govt job education = exam prep guidance.',
    'LISTICLE': 'Show salary range prominently. Job seekers scan for pay grade instantly.',
    'URGENCY_NEWS': 'LAST DATE in big red text + vacancy count in yellow. Urgency is everything for Sarkari job seekers.',
    'COMPARISON': 'Show both jobs with salary + vacancy count. Comparison needs clear data points.',
    'DEFAULT': 'Govt Jobs audience needs: Vacancy count + Last Date + Salary. Add all three on thumbnail.'
  },
  'YT/IG Mastery': {
    'EARNING_AMOUNT': 'Show YOUR analytics screenshot or follower count as proof. Creator audience trusts practitioners.',
    'CURIOSITY_HOOK': 'Add "Algorithm Secret" or "Hack" language — creators are obsessed with growth shortcuts.',
    'EDUCATION': 'Show the platform interface (YouTube Studio, IG Insights) — creators recognize and trust these visuals.',
    'LISTICLE': 'Show growth graph or before→after follower counts on the thumbnail.',
    'URGENCY_NEWS': 'Add "New Algorithm Update" or "Policy Change" — creators fear platform changes immediately.',
    'COMPARISON': 'Show both platform logos with growth metrics. Creator comparisons need data proof.',
    'DEFAULT': 'Creator audience wants PROOF of growth. Show follower counts, analytics, or earning screenshots.'
  },
  'Technology': {
    'CURIOSITY_HOOK': 'Show the tech/AI output RESULT on thumbnail — curiosity + wow factor combined.',
    'EDUCATION': 'Show the app/tool interface screenshot. Tech audience wants to see before they learn.',
    'EARNING_AMOUNT': 'Show the tool + "FREE" badge or pricing. Tech + money = show what you save or earn with the tool.',
    'LISTICLE': 'Show app/tool icons for each item. "Top 5 AI Tools" needs visual logos.',
    'URGENCY_NEWS': 'Add "New Launch" or "Update" badge. Tech audience follows releases closely.',
    'COMPARISON': 'Split-screen showing both tools\' outputs. Tech comparisons need visual proof of capability.',
    'DEFAULT': 'Tech audience wants to SEE the tool working. Add a screenshot or demo result on thumbnail.'
  },
  'Spoken English': {
    'EDUCATION': 'Show the 3 words/phrases ON the thumbnail itself. English learners want to preview what they\'ll learn.',
    'LISTICLE': 'Show the words in big English text with Hindi below. Bilingual layout works best.',
    'CURIOSITY_HOOK': 'Add "Yeh Word Bol Diya Toh..." — English curiosity = social situation + confidence fear.',
    'EARNING_AMOUNT': 'English + earning is rare but powerful: "English Seekho = Better Salary". Show the career upgrade angle.',
    'URGENCY_NEWS': 'Add "Interview Kal Hai?" or exam date — English urgency = upcoming opportunity.',
    'COMPARISON': 'Show wrong vs right pronunciation or usage. Before/after confidence imagery works.',
    'DEFAULT': 'English learners respond to 3-5 words shown on thumbnail + Hindi meaning. Keep it bilingual and simple.'
  },
  'AI Tips and Tricks': {
    'CURIOSITY_HOOK': 'Show the AI output that looks "impossible" — AI curiosity = "Yeh AI Ne Banaya?!" wow factor.',
    'EDUCATION': 'Show the ChatGPT/AI interface with a prompt. AI education = prompt engineering visual.',
    'EARNING_AMOUNT': 'Show "AI Se ₹X Kamao" with an AI tool logo. AI + earning = freelance automation angle.',
    'LISTICLE': 'Show AI tool logos for each item. "Top 5 Free AI Tools" needs recognizable icons.',
    'URGENCY_NEWS': 'Add "NEW AI Tool" badge or "GPT Update" — AI audience follows tool launches obsessively.',
    'COMPARISON': 'Show both AI tools\' outputs side-by-side. AI comparisons need visual quality proof.',
    'DEFAULT': 'AI audience wants to see the MAGIC. Show the AI output/result prominently on thumbnail.'
  },
  'Government Schemes': {
    'EARNING_AMOUNT': 'Show exact benefit amount prominently: "₹6,000/Saal" or "₹2 Lakh Loan". Scheme audience needs the number.',
    'CURIOSITY_HOOK': 'Add "Kya Aap Eligible Ho?" — scheme curiosity = "Am I missing free money?" anxiety.',
    'EDUCATION': 'Show the official form/portal screenshot. Scheme education = step-by-step application guide.',
    'LISTICLE': 'Show benefit amounts for each scheme. "5 Schemes" needs ₹ amounts per scheme.',
    'URGENCY_NEWS': 'Add LAST DATE or "Registration Open" in red. Scheme urgency = deadline to apply.',
    'COMPARISON': 'Show both schemes with benefit amounts and eligibility. Data comparison format.',
    'DEFAULT': 'Scheme audience needs: WHO is eligible + HOW MUCH money. Add both on thumbnail.'
  },
  'Sarkari Services': {
    'EDUCATION': 'Show the government portal/app interface. Sarkari Services = digital process walkthrough.',
    'CURIOSITY_HOOK': 'Add "Ghar Baithe Ho Jayega?" — service curiosity = "Can I really do this from home?" surprise.',
    'LISTICLE': 'Show the document/service icons for each item. "5 Services Online" needs portal screenshots.',
    'URGENCY_NEWS': 'Add "New Portal Launch" or "System Update" — Sarkari service changes need immediate attention.',
    'COMPARISON': 'Show online vs offline process comparison. Speed/convenience visual (5 min vs 5 hours).',
    'DEFAULT': 'Sarkari Services audience wants step-by-step clarity. Show the app/portal interface on thumbnail.'
  },
  'Career': {
    'EARNING_AMOUNT': 'Show SALARY RANGE prominently (₹X - ₹Y/month). Career audience makes decisions based on ROI.',
    'CURIOSITY_HOOK': 'Add "Kya Yeh Career Sahi Hai?" — career curiosity = "Am I choosing the right path?" anxiety.',
    'EDUCATION': 'Show a career roadmap visual (Class 12 → Degree → Job). Career education = clear path visualization.',
    'LISTICLE': 'Show salary ranges per career. "Top 5 Careers After 12th" needs salary data per option.',
    'URGENCY_NEWS': 'Add "New Hiring" or "Placement Drive" with company logos. Career urgency = job opportunity window.',
    'COMPARISON': 'Show both careers with salary, growth rate, and demand. Side-by-side career comparison.',
    'DEFAULT': 'Career audience responds to salary data and clear career paths. Add salary range on thumbnail.'
  },
  'Law': {
    'CURIOSITY_HOOK': 'Add the CONSEQUENCE: "₹X Fine" or "Y Saal Jail" — Law curiosity = fear of punishment.',
    'EDUCATION': 'Show a gavel or Constitution image with the IPC/BNS section number. Law education = authority visual.',
    'EARNING_AMOUNT': 'Law + money = fine amounts or compensation. Show "₹X Ka Fine!" prominently.',
    'LISTICLE': 'Show consequence severity for each law. "5 Laws Everyone Breaks" needs punishment data.',
    'URGENCY_NEWS': 'Add "New Law" or "Supreme Court Order" with date. Legal news = compliance urgency.',
    'COMPARISON': 'Show old vs new law comparison or punishment comparison. Legal comparisons need section numbers.',
    'DEFAULT': 'Law audience responds to real case stories and consequences. Add fine/jail term on thumbnail.'
  },
  'Secrets of India': {
    'CURIOSITY_HOOK': 'Show a STUNNING visual of the secret location/fact + "99% Indians Don\'t Know" badge.',
    'EDUCATION': 'Show historical imagery with "Real History" or "Puri Kahani" text. Secrets education = deep-dive visual.',
    'LISTICLE': 'Show mind-blowing images for each secret. "5 Hidden Places" needs aerial/discovery photos.',
    'URGENCY_NEWS': 'Add "Just Discovered" or "New Finding" — Secrets urgency = archaeological/historical news.',
    'COMPARISON': 'Show India vs World comparison. National pride imagery + surprising statistics.',
    'DEFAULT': 'Secrets of India lives on SHOCK VALUE. Show the most stunning visual + a "99% Don\'t Know" type hook.'
  },
  'Skill-based Earning': {
    'EARNING_AMOUNT': 'Show FINISHED PRODUCT + ₹ earned from it. Skill + earning = proof of monetization.',
    'CURIOSITY_HOOK': 'Add "Yeh Skill Seekho, Life Set" — Skill curiosity = "Can this skill change my life?" hope.',
    'EDUCATION': 'Show hands doing the work (typing, designing, cooking). Skill education = craftsperson imagery.',
    'LISTICLE': 'Show earning ranges per skill. "Top 5 Freelance Skills" needs ₹/month data per skill.',
    'URGENCY_NEWS': 'Add "Demand Badh Rahi Hai" or "Trending Skill 2026" — Skill urgency = market opportunity.',
    'COMPARISON': 'Show both skills with earning potential and learning time. Practical comparison data.',
    'DEFAULT': 'Skill-based Earning needs: Show the RESULT first, then the earning. Product + ₹ amount.'
  },
  'Motivation': {
    'CURIOSITY_HOOK': 'Add a personal struggle hook: "Sab Kuch Kho Diya..." — Motivation curiosity = relatable pain.',
    'EDUCATION': 'Show a transformation visual (struggle → success). Motivation education = before-after life change.',
    'LISTICLE': 'Show powerful visuals per point. "5 Habits of Successful People" needs strong imagery.',
    'URGENCY_NEWS': 'Add "Aaj Se Shuru Karo" — Motivation urgency = "Start now" energy with date/deadline.',
    'COMPARISON': 'Show "successful vs unsuccessful" habits/mindset. Split-screen contrast imagery.',
    'DEFAULT': 'Motivation audience responds to personal stories and transformation. Show emotion on face + struggle visual.'
  },
  'Scams': {
    'CURIOSITY_HOOK': 'Show the SCAM METHOD partially — "Yeh Message Aaya Toh..." — Scam curiosity = "Am I at risk?" fear.',
    'EDUCATION': 'Show the scam screenshot/method with a WARNING badge. Scam education = recognition training.',
    'EARNING_AMOUNT': 'Show the LOSS amount prominently: "₹X Chori Ho Gaye!" — Scam + money = victim\'s loss.',
    'LISTICLE': 'Show scam types with danger icons. "5 New Scams 2026" needs warning imagery per scam.',
    'URGENCY_NEWS': 'Add "NEW SCAM Alert" in red with warning icon. Scam urgency = protect yourself NOW.',
    'COMPARISON': 'Show real vs fake side-by-side. Scam comparisons = spot-the-difference visual.',
    'DEFAULT': 'Scam audience responds to WARNING visuals and victim stories. Show loss amount + alert icon.'
  },
  'Trending': {
    'CURIOSITY_HOOK': 'Show the viral image/moment + "Sachai Kya Hai?" — Trending curiosity = "What really happened?"',
    'EDUCATION': 'Show news screenshot + "Matlab Kya Hai?" — Trending education = explain the trend simply.',
    'EARNING_AMOUNT': 'Show how the trend affects money: "₹X Ka Nuksan!" — Trending + money = financial impact.',
    'LISTICLE': 'Show the trend moments/screenshots. "5 Viral Moments" needs the actual viral content.',
    'URGENCY_NEWS': 'Add "BREAKING" or "ABHI KI NEWS" in red banner. Trending urgency = be the first to know.',
    'COMPARISON': 'Show both sides of the trending debate. Trending comparisons = opinion vs reality.',
    'DEFAULT': 'Trending audience wants TIMELY visuals. Show the news/event screenshot + connect to viewer impact.'
  }
};

const GENERIC_TIPS = {
  'CURIOSITY_HOOK': 'Curiosity titles need visual mystery — dark/dramatic colors, question on face, partial reveal.',
  'EARNING_AMOUNT': 'Money titles need ₹ amount in BIG bold text + proof element (screenshot, graph).',
  'EDUCATION': 'Educational titles need clean, trustworthy design — avoid flashy colors, use blue/green tones.',
  'LISTICLE': 'Listicle titles need the NUMBER prominently displayed — make it the biggest element.',
  'URGENCY_NEWS': 'Urgency titles need RED accents, bold text, deadline date prominently displayed.',
  'COMPARISON': 'Comparison titles need split-screen or VS badge — show both options visually.',
  'DEFAULT': ''
};

export function getSmartTip(category, contentType, title) {
  const catTips = SMART_TIPS[category] || {};
  return catTips[contentType] || GENERIC_TIPS[contentType] || '';
}

// ── Visual Guidance ──
export const CATEGORY_VISUAL_GUIDANCE = {
  "Earning Apps": "Phone screens with earning proof, money visuals, app interface. Excited face works well.",
  "Finance": "Calculator, money stacks, graphs going up, comparison visuals. Serious face with pointing gesture.",
  "Business": "Shop/store setup, product images, before-after transformation. Confident face with business context.",
  "Astrology": "Zodiac symbols, celestial imagery, kundli charts, mystical backgrounds. Mysterious/knowing expression. No money imagery.",
  "Devotion": "Temple imagery, deity illustrations, diyas, spiritual symbols. Serene/respectful face. Reverent, not flashy.",
  "Government Jobs": "Official buildings, exam papers, badge/uniform, ID card visuals. Serious face with determination. No ₹ signs.",
  "YT/IG Mastery": "Phone with social media screens, follower counts, growth graphs. Excited face pointing at screen/numbers.",
  "Technology": "Gadgets, AI visuals, futuristic graphics, screen interfaces. Curious/amazed face.",
  "Spoken English": "Speech bubbles, microphone, confident speaking pose, before-after fluency. Confident face speaking.",
  "AI Tips and Tricks": "AI interface, robot/tech graphics, ChatGPT-style screens. Amazed/mind-blown face.",
  "Government Schemes": "Official forms, Aadhaar/documents, government building. Helpful face pointing at key info.",
  "Sarkari Services": "Application forms, CSC center, mobile gov portal. Helpful/informative face.",
  "Career": "Office environment, laptop, interview setting, growth chart. Professional face in formal context.",
  "Law": "Gavel, court, legal documents, Constitution imagery. Authoritative face with serious expression.",
  "Secrets of India": "Stunning India locations, monuments, hidden places, aerial views. Amazed/curious face. Mystery vibe.",
  "Skill-based Earning": "Tools/equipment of the skill, workspace, hands doing work. Determined face with DIY energy.",
  "Motivation": "Before-after transformation, success symbols, powerful visual metaphors. Intense/inspired face.",
  "Scams": "Warning signs, broken phone, fake messages, shield icons. Worried/alert face.",
  "Trending": "News-style graphics, trending arrows, social media buzz. Surprised/informed face."
};

// ── Scoring ──
export function calculateScore(analysis, category, title) {
  const contentType = classifyTitleContent(title);

  // Design Quality Score (75 pts)
  let designScore = 0;
  const designBreakdown = [];

  if (analysis.text_readable) { designScore += 20; } else { designBreakdown.push("TEXT NOT READABLE"); }
  if (analysis.high_contrast) { designScore += 15; } else { designBreakdown.push("Low contrast"); }
  if (analysis.bold_font) { designScore += 10; } else { designBreakdown.push("Use bolder font"); }
  if (analysis.clean_layout) { designScore += 10; } else { designBreakdown.push("Too cluttered"); }
  if (analysis.word_count_ok) { designScore += 8; } else { designBreakdown.push("Too many words"); }
  if (analysis.face_visible) { designScore += 7; } else { designBreakdown.push("Add face"); }
  if (analysis.hindi_text) { designScore += 5; } else { designBreakdown.push("Use Hindi text"); }

  // Category Fit Score (25 pts)
  let catScore = 0;
  const catWarnings = [];
  const catTips = [];

  const elements = [
    { key: "rupee",    detected: analysis.has_rupee,    label: "₹ symbol",         boostPts: 8, hurtPts: -8 },
    { key: "number",   detected: analysis.has_number,   label: "Specific number",   boostPts: 7, hurtPts: -7 },
    { key: "question", detected: analysis.has_question,  label: "Question mark (?)", boostPts: 5, hurtPts: -5 },
    { key: "exclaim",  detected: analysis.has_exclaim,   label: "Exclamation (!)",   boostPts: 5, hurtPts: -5 }
  ];

  for (const el of elements) {
    const smartResult = getSmartRule(el.key, category, contentType, title);
    const rule = smartResult.rule;

    if (rule === "boost" && el.detected) {
      catScore += el.boostPts;
    } else if (rule === "boost" && !el.detected) {
      catTips.push("Add " + el.label + " — " + smartResult.reason);
    } else if (rule === "hurts" && el.detected) {
      catScore += el.hurtPts;
      catWarnings.push("REMOVE " + el.label + " — " + smartResult.reason);
    } else if (rule === "hurts" && !el.detected) {
      catScore += 3;
    } else if (rule === "context") {
      catTips.push(el.label + ": " + smartResult.reason);
    }
  }

  const smartTip = getSmartTip(category, contentType, title);
  if (smartTip) catTips.push("💡 " + smartTip);

  const totalScore = Math.max(0, Math.min(100, designScore + catScore));

  return {
    totalScore,
    designScore,
    catScore,
    contentType,
    designBreakdown,
    catWarnings,
    catTips,
    verdict: getVerdict(totalScore)
  };
}

export function getVerdict(score) {
  if (score >= 70) return 'PUBLISH';
  if (score >= 45) return 'REVISE';
  return 'REDESIGN';
}

export function getAllCategories() {
  return Object.keys(CATEGORY_RULES);
}

export function buildDesignChecklist(analysis) {
  return [
    { label: 'Readable', pass: !!analysis.text_readable },
    { label: 'Contrast OK', pass: !!analysis.high_contrast },
    { label: 'Bold Font', pass: !!analysis.bold_font },
    { label: 'Clean Layout', pass: !!analysis.clean_layout },
    { label: 'Word Count OK', pass: !!analysis.word_count_ok },
    { label: 'Face Visible', pass: !!analysis.face_visible },
    { label: 'Hindi Text', pass: !!analysis.hindi_text }
  ];
}
