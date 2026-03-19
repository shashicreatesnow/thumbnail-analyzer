// ------------------------------------------------------------
// EloElo THUMBNAIL DESIGN ANALYZER V4 — Context-Aware — Google Apps Script
// Powered by Gemini Vision API + SMART Context-Aware CTR Rules
// ------------------------------------------------------------
// V4 CHANGE: FIXES the blanket category rules problem.
// Previously: "REMOVE ? — HURTS CTR in Finance!" on EVERY Finance thumbnail
// Now: Classifies each title's CONTENT TYPE first, then applies rules smartly.
//
// Example: "Festive Offer Ya Trap?" → CURIOSITY_HOOK → KEEP the ? (it's working!)
// Example: "₹50,000 Monthly Income!" → EARNING_AMOUNT → Remove ? if present, ₹ is great
// Example: "Mutual Fund Kya Hai?" → EDUCATION → ? is fine (viewer's question)
//
// Column B = Optional script, Column H = Category Warnings (NOW CONTEXT-AWARE)
// All other columns remain the same as V3.
// ------------------------------------------------------------
// SETUP:
// 1. Go to https://aistudio.google.com/apikey → Create API Key (free)
// 2. In Google Sheets → Extensions → Apps Script
// 3. Paste this ENTIRE script (replaces V3)
// 4. Click ⚙️ Project Settings → Script Properties → Add:
//    Key: GEMINI_API_KEY   Value: [your API key]
// 5. Save → Close Apps Script → Refresh the Sheet
// 6. You'll see a new menu "🎨 Thumbnail Analyzer" in the menu bar
//
// MODEL: Uses gemini-2.5-flash (free tier: 10 RPM, 250 req/day)
// ------------------------------------------------------------

// ══════════════════════════════════════════════════════════════════════
// V4: CONTEXT-AWARE TITLE CONTENT CLASSIFIER
// Instead of blanket "? hurts Finance", we first understand WHAT the
// title is about, THEN decide if ?, ₹, numbers, ! help or hurt.
// ══════════════════════════════════════════════════════════════════════

/**
 * Classifies a video title into a content type.
 * This is the KEY V4 innovation — rules are applied per content type, not per category.
 *
 * Content Types:
 *   EARNING_AMOUNT   — About specific money, earnings, income (₹ and numbers help)
 *   LISTICLE         — Top X, Best Y, numbered lists (numbers help, ? hurts)
 *   CURIOSITY_HOOK   — A/B tension, trap, scam, secret (? helps, ! hurts)
 *   EDUCATION        — Kya hai, meaning, concept explanation (? is OK, ₹ not needed)
 *   URGENCY_NEWS     — Breaking, last date, deadline (! helps, ? hurts)
 *   COMPARISON       — X vs Y, better, best between options (? can help)
 *   DEFAULT          — None of above, fall back to category rule
 */
function classifyTitleContent_(title) {
  if (!title) return 'DEFAULT';
  var t = title.toLowerCase().trim();

  // ── EARNING_AMOUNT: Specific money/earning content ──
  var earningKeywords = [
    '₹', 'rs ', 'rs.', 'rupee', 'rupaye', 'kamao', 'kamai', 'kamaye',
    'income', 'salary', 'paisa', 'paise', 'earning', 'earn ', 'munafa',
    'profit', 'lakh', 'crore', 'monthly income', 'daily income',
    'per month', 'per day', 'investment return', 'kaise kamaye',
    'kitna milega', 'kitna kamate', 'kamane ka', 'paisa kaise'
  ];
  for (var i = 0; i < earningKeywords.length; i++) {
    if (t.indexOf(earningKeywords[i]) !== -1) return 'EARNING_AMOUNT';
  }

  // ── URGENCY_NEWS: Breaking news, deadlines ──
  var urgencyKeywords = [
    'breaking', 'urgent', 'last date', 'deadline', 'abhi karo',
    'jaldi karo', 'aaj hi', 'turant', 'chetavani', 'warning',
    'alert', 'kal se band', 'hataya gaya', 'banned', 'new rule',
    'naya niyam', 'sarkari update', 'notification out'
  ];
  for (var i = 0; i < urgencyKeywords.length; i++) {
    if (t.indexOf(urgencyKeywords[i]) !== -1) return 'URGENCY_NEWS';
  }

  // ── CURIOSITY_HOOK: Mystery, A-vs-B tension, trap/scam reveal ──
  var curiosityKeywords = [
    ' ya ', ' ya?', 'trap', 'scam', 'fraud', 'dhoka', 'jhooth',
    'sach ', 'sachai', 'secret', 'raaz', 'rahasya', 'galti',
    'mistake', 'chaukane wala', 'shocking', 'pata nahi tha',
    'koi nahi batata', 'hidden', 'chhupa', 'asli sach',
    'nakli', 'real vs fake', 'truth', 'expose', 'reality'
  ];
  for (var i = 0; i < curiosityKeywords.length; i++) {
    if (t.indexOf(curiosityKeywords[i]) !== -1) return 'CURIOSITY_HOOK';
  }

  // ── LISTICLE: Numbered lists, top X, rankings ──
  var listiclePatterns = [
    /top\s*\d+/, /best\s*\d+/, /\d+\s*tips/, /\d+\s*tarike/,
    /\d+\s*ways/, /\d+\s*steps/, /\d+\s*galti/, /\d+\s*mistakes/,
    /\d+\s*cheeze/, /\d+\s*tools/, /\d+\s*apps/, /\d+\s*methods/,
    /sabse\s*(best|accha|top)/, /\d+\s*tricks/, /\d+\s*hacks/
  ];
  for (var i = 0; i < listiclePatterns.length; i++) {
    if (listiclePatterns[i].test(t)) return 'LISTICLE';
  }

  // ── COMPARISON: X vs Y, which is better ──
  var comparisonKeywords = [
    ' vs ', ' versus ', 'ya phir', 'konsa best', 'kaun sa',
    'better', 'comparison', 'difference', 'farak', 'compare'
  ];
  for (var i = 0; i < comparisonKeywords.length; i++) {
    if (t.indexOf(comparisonKeywords[i]) !== -1) return 'COMPARISON';
  }

  // ── EDUCATION: Concept explanations ──
  var educationKeywords = [
    'kya hai', 'kya hota', 'kya hoti', 'meaning', 'matlab',
    'samjho', 'seekho', 'sikhiye', 'jaaniye', 'jaano',
    'psychology', 'mindset', 'explained', 'guide', 'complete guide',
    'basics', 'beginner', 'shuru kaise', 'kaise kare', 'kaise karte',
    'full information', 'puri jankari', 'simply explained'
  ];
  for (var i = 0; i < educationKeywords.length; i++) {
    if (t.indexOf(educationKeywords[i]) !== -1) return 'EDUCATION';
  }

  return 'DEFAULT';
}

// ══════════════════════════════════════════════════════════════════════
// V4: SMART CONTEXT-AWARE RULES
// For each element (?, ₹, number, !), the rule depends on BOTH
// the category AND the title's content type.
// ══════════════════════════════════════════════════════════════════════

/**
 * Returns context-aware rule for a specific element.
 * Instead of blanket "hurts" or "boost", returns one of:
 *   "boost"   — element definitely helps, add it
 *   "hurts"   — element definitely hurts, remove it
 *   "neutral" — no strong effect either way
 *   "context" — depends, give nuanced advice
 *
 * @param {string} element - "rupee", "number", "question", or "exclaim"
 * @param {string} category - e.g. "Finance"
 * @param {string} contentType - from classifyTitleContent_()
 * @param {string} title - original title for additional checks
 * @returns {object} { rule: string, reason: string }
 */
function getSmartRule_(element, category, contentType, title) {
  var t = (title || '').toLowerCase();

  // ════════════════════════════════════════════
  // QUESTION MARK (?) — Most context-dependent
  // ════════════════════════════════════════════
  if (element === 'question') {
    if (contentType === 'CURIOSITY_HOOK') {
      return { rule: 'boost', reason: '? is a CURIOSITY HOOK here — creates intrigue/tension. KEEP IT.' };
    }
    if (contentType === 'COMPARISON') {
      return { rule: 'boost', reason: '? works well for comparison titles — makes viewer want to know the answer.' };
    }
    if (contentType === 'EDUCATION') {
      // "Kya Hai?" type questions are the viewer's own question — ? is natural
      if (t.indexOf('kya hai') !== -1 || t.indexOf('kya hota') !== -1 || t.indexOf('kya hoti') !== -1) {
        return { rule: 'neutral', reason: '? is natural here — it mirrors the viewer\'s question. OK to keep.' };
      }
      return { rule: 'neutral', reason: '? is acceptable in educational titles if it frames the learning question.' };
    }
    if (contentType === 'EARNING_AMOUNT') {
      return { rule: 'hurts', reason: '? creates DOUBT about earning claims. Use ! for confidence instead.' };
    }
    if (contentType === 'LISTICLE') {
      return { rule: 'hurts', reason: '? weakens authority in listicle titles. Statement format is stronger.' };
    }
    if (contentType === 'URGENCY_NEWS') {
      return { rule: 'hurts', reason: '? undermines urgency. Use ! for authority in breaking/deadline content.' };
    }
    // DEFAULT: check if title ends with ? (likely a curiosity hook) vs mid-sentence ?
    if (t.trim().slice(-1) === '?' && t.split('?').length === 2) {
      return { rule: 'neutral', reason: '? at end of title can work as a curiosity hook. Evaluate if it creates intrigue.' };
    }
    // Fall back to category default
    var catDefault = (CATEGORY_RULES[category] || {}).question || 'neutral';
    return { rule: catDefault, reason: catDefault === 'hurts' ? '? generally hurts CTR in ' + category + ' (but check if this is a curiosity hook).' : '? is acceptable in ' + category + '.' };
  }

  // ════════════════════════════════════════════
  // RUPEE SYMBOL (₹)
  // ════════════════════════════════════════════
  if (element === 'rupee') {
    if (contentType === 'EARNING_AMOUNT') {
      return { rule: 'boost', reason: '₹ with specific amount boosts CTR for earning content — add if missing.' };
    }
    if (contentType === 'CURIOSITY_HOOK') {
      // "Festive Offer Ya Trap?" — ₹ not needed, mystery works better
      return { rule: 'neutral', reason: '₹ not needed for curiosity/mystery titles — the intrigue itself drives clicks.' };
    }
    if (contentType === 'EDUCATION') {
      // Only suggest ₹ if the education is about money topics
      var moneyEduKeywords = ['investment', 'mutual fund', 'stock', 'share market', 'trading', 'sip', 'fd', 'loan', 'emi', 'credit', 'debit', 'bank', 'tax', 'gst'];
      for (var i = 0; i < moneyEduKeywords.length; i++) {
        if (t.indexOf(moneyEduKeywords[i]) !== -1) {
          return { rule: 'context', reason: '₹ could work here since the topic involves money, but only if showing a specific amount/rate.' };
        }
      }
      return { rule: 'neutral', reason: '₹ not needed for educational/concept content — focus on clarity instead.' };
    }
    if (contentType === 'LISTICLE') {
      // "Top 5 ways to save money" → ₹ could help. "Top 5 apps" → not needed.
      var moneyListKeywords = ['save', 'invest', 'earn', 'kamao', 'bachao', 'money', 'paisa'];
      for (var i = 0; i < moneyListKeywords.length; i++) {
        if (t.indexOf(moneyListKeywords[i]) !== -1) {
          return { rule: 'boost', reason: '₹ boosts CTR for money-related listicles — add specific amount.' };
        }
      }
      return { rule: 'neutral', reason: '₹ not relevant for this listicle topic.' };
    }
    if (contentType === 'URGENCY_NEWS') {
      var finImpactKeywords = ['rbi', 'bank', 'tax', 'gst', 'price', 'rate', 'mehengai', 'sasta'];
      for (var i = 0; i < finImpactKeywords.length; i++) {
        if (t.indexOf(finImpactKeywords[i]) !== -1) {
          return { rule: 'boost', reason: '₹ reinforces financial impact in this news/alert — add if relevant.' };
        }
      }
      return { rule: 'neutral', reason: '₹ only needed in news if it involves financial impact.' };
    }
    // Fall back to category default
    var catDefault = (CATEGORY_RULES[category] || {}).rupee || 'neutral';
    if (catDefault === 'boost') {
      return { rule: 'context', reason: '₹ generally boosts CTR in ' + category + ', but check if this specific title is about money.' };
    }
    return { rule: catDefault, reason: catDefault === 'hurts' ? '₹ generally hurts CTR in ' + category + '.' : '₹ has no strong effect in ' + category + ' for this type of content.' };
  }

  // ════════════════════════════════════════════
  // SPECIFIC NUMBER
  // ════════════════════════════════════════════
  if (element === 'number') {
    if (contentType === 'LISTICLE') {
      return { rule: 'boost', reason: 'Numbers are ESSENTIAL for listicle titles — add count (5 tips, 3 ways, etc.).' };
    }
    if (contentType === 'EARNING_AMOUNT') {
      return { rule: 'boost', reason: 'Specific number (₹50,000, 15%) makes earning claim believable — add if missing.' };
    }
    if (contentType === 'URGENCY_NEWS') {
      return { rule: 'boost', reason: 'Number adds urgency (5 din baaki, 2 crore affected) — add deadline or impact number.' };
    }
    if (contentType === 'CURIOSITY_HOOK') {
      return { rule: 'neutral', reason: 'Numbers reduce mystery — curiosity titles work better without specific counts.' };
    }
    if (contentType === 'EDUCATION') {
      return { rule: 'neutral', reason: 'Numbers not essential for concept explanations unless it\'s a numbered framework.' };
    }
    if (contentType === 'COMPARISON') {
      return { rule: 'context', reason: 'Numbers help in comparisons IF showing specific data points (returns, speed, price).' };
    }
    // Fall back to category default
    var catDefault = (CATEGORY_RULES[category] || {}).number || 'neutral';
    return { rule: catDefault, reason: catDefault === 'boost' ? 'Numbers generally boost CTR in ' + category + '.' : catDefault === 'hurts' ? 'Numbers generally hurt CTR in ' + category + ' — use emotional words instead.' : 'Numbers have no strong effect for this content.' };
  }

  // ════════════════════════════════════════════
  // EXCLAMATION MARK (!)
  // ════════════════════════════════════════════
  if (element === 'exclaim') {
    if (contentType === 'URGENCY_NEWS') {
      return { rule: 'boost', reason: '! reinforces urgency — essential for breaking/deadline content.' };
    }
    if (contentType === 'EARNING_AMOUNT') {
      return { rule: 'boost', reason: '! adds excitement and confidence to earning claims.' };
    }
    if (contentType === 'CURIOSITY_HOOK') {
      return { rule: 'hurts', reason: '! kills curiosity — ? or ... works better for mystery/intrigue titles.' };
    }
    if (contentType === 'EDUCATION') {
      return { rule: 'neutral', reason: '! feels clickbaity on educational content — calm authority works better.' };
    }
    if (contentType === 'LISTICLE') {
      // Exciting lists (Top 5 BEST!) vs informational lists (5 types of accounts)
      var excitingKeywords = ['best', 'top', 'amazing', 'kamaal', 'dhamaka', 'powerful', 'must'];
      for (var i = 0; i < excitingKeywords.length; i++) {
        if (t.indexOf(excitingKeywords[i]) !== -1) {
          return { rule: 'boost', reason: '! adds energy to this exciting listicle.' };
        }
      }
      return { rule: 'neutral', reason: '! is optional for informational lists — works for exciting ones, skip for factual ones.' };
    }
    if (contentType === 'COMPARISON') {
      return { rule: 'neutral', reason: '! is optional in comparisons — works if revealing a clear winner.' };
    }
    // Fall back to category default
    var catDefault = (CATEGORY_RULES[category] || {}).exclaim || 'neutral';
    return { rule: catDefault, reason: catDefault === 'boost' ? '! generally boosts CTR in ' + category + '.' : catDefault === 'hurts' ? '! generally hurts CTR in ' + category + '.' : '! has no strong effect for this content.' };
  }

  return { rule: 'neutral', reason: '' };
}

/**
 * Returns a smart tip specific to category + content type combination.
 */
function getSmartTip_(category, contentType, title) {
  var tips = {
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

  var catTips = tips[category] || {};
  var tip = catTips[contentType] || '';

  if (!tip) {
    // Generic fallback tips by content type
    var genericTips = {
      'CURIOSITY_HOOK': 'Curiosity titles need visual mystery — dark/dramatic colors, question on face, partial reveal.',
      'EARNING_AMOUNT': 'Money titles need ₹ amount in BIG bold text + proof element (screenshot, graph).',
      'EDUCATION': 'Educational titles need clean, trustworthy design — avoid flashy colors, use blue/green tones.',
      'LISTICLE': 'Listicle titles need the NUMBER prominently displayed — make it the biggest element.',
      'URGENCY_NEWS': 'Urgency titles need RED accents, bold text, deadline date prominently displayed.',
      'COMPARISON': 'Comparison titles need split-screen or VS badge — show both options visually.',
      'DEFAULT': ''
    };
    tip = genericTips[contentType] || '';
  }

  return tip;
}


// ── CATEGORY-SPECIFIC DEFAULT RULES (fallback when content type is DEFAULT) ──
// These are the same as V3, used ONLY when title can't be classified
var CATEGORY_RULES = {
  "Earning Apps":       { rupee: "boost",   number: "boost",   question: "hurts",   exclaim: "neutral" },
  "Finance":            { rupee: "boost",   number: "boost",   question: "hurts",   exclaim: "boost"   },
  "Business":           { rupee: "boost",   number: "boost",   question: "hurts",   exclaim: "neutral" },
  "Astrology":          { rupee: "neutral", number: "hurts",   question: "boost",   exclaim: "neutral" },
  "Devotion":           { rupee: "neutral", number: "neutral", question: "hurts",   exclaim: "neutral" },
  "Government Jobs":    { rupee: "hurts",   number: "boost",   question: "neutral", exclaim: "boost"   },
  "YT/IG Mastery":      { rupee: "boost",   number: "boost",   question: "boost",   exclaim: "boost"   },
  "Technology":         { rupee: "boost",   number: "boost",   question: "boost",   exclaim: "boost"   },
  "Spoken English":     { rupee: "neutral", number: "boost",   question: "boost",   exclaim: "neutral" },
  "AI Tips and Tricks": { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "boost"   },
  "Government Schemes": { rupee: "neutral", number: "neutral", question: "boost",   exclaim: "neutral" },
  "Sarkari Services":   { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "neutral" },
  "Career":             { rupee: "neutral", number: "boost",   question: "hurts",   exclaim: "hurts"   },
  "Law":                { rupee: "neutral", number: "hurts",   question: "boost",   exclaim: "neutral" },
  "Secrets of India":   { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "neutral" },
  "Skill-based Earning":{ rupee: "neutral", number: "neutral", question: "neutral", exclaim: "neutral" },
  "Motivation":         { rupee: "neutral", number: "neutral", question: "boost",   exclaim: "neutral" },
  "Scams":              { rupee: "neutral", number: "neutral", question: "boost",   exclaim: "neutral" },
  "Trending":           { rupee: "neutral", number: "neutral", question: "neutral", exclaim: "boost"   }
};

var THUMBNAIL_FOLDER_NAME = "EloElo_Generated_Thumbnails";

// ── MENU SETUP ──
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎨 Thumbnail Analyzer')
    .addItem('📸 Analyze Selected Row', 'analyzeSelectedRow')
    .addItem('📸 Analyze All Pending Rows', 'analyzeAllPending')
    .addSeparator()
    .addItem('🖼️ Generate Thumbnail (Selected Row)', 'generateSelectedRowThumbnail')
    .addItem('🖼️ Generate All Pending Thumbnails', 'generateAllPendingThumbnails')
    .addSeparator()
    .addItem('📋 Copy Thumbnail Prompt (Selected Row)', 'copyThumbnailPrompt')
    .addSeparator()
    .addItem('🔧 Test API Connection', 'testApiConnection')
    .addItem('🔧 Test Image Generation', 'testImageGeneration')
    .addItem('ℹ️ Help', 'showHelp')
    .addToUi();
}

// ── MAIN: Analyze a single thumbnail ──
function analyzeSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row < 3) {
    SpreadsheetApp.getUi().alert('Please select a data row (row 3 or below).');
    return;
  }
  try {
    analyzeThumbnailRow(sheet, row);
    SpreadsheetApp.getUi().alert('Done! Row ' + row + ' analyzed.');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error on row ' + row + ': ' + e.message);
  }
}

// ── MAIN: Analyze all rows that don't have scores yet ──
function analyzeAllPending() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var analyzed = 0;
  for (var r = 3; r <= lastRow; r++) {
    var imageUrl = sheet.getRange(r, 4).getValue();
    var score = sheet.getRange(r, 6).getValue();
    if (imageUrl && !score) {
      try {
        analyzeThumbnailRow(sheet, r);
        analyzed++;
        Utilities.sleep(3000);
      } catch (e) {
        sheet.getRange(r, 6).setValue("ERROR");
        sheet.getRange(r, 9).setValue(e.message);
      }
    }
  }
  SpreadsheetApp.getUi().alert('Done! Analyzed ' + analyzed + ' thumbnails.');
}

// ── CORE: Analyze one thumbnail row ──
function analyzeThumbnailRow(sheet, row) {
  var title = sheet.getRange(row, 1).getValue();
  var script = sheet.getRange(row, 2).getValue();  // V3: Optional script
  var category = sheet.getRange(row, 3).getValue(); // Shifted from col 2
  var imageUrl = sheet.getRange(row, 4).getValue(); // D = Image URL

  if (!imageUrl) throw new Error('No image URL in column D.');
  if (!category) throw new Error('No category in column C. Category is required for scoring.');

  sheet.getRange(row, 7).setValue("Analyzing...");
  SpreadsheetApp.flush();

  var topic = sheet.getRange(row, 1).getValue();
  var imageBase64 = getImageBase64(imageUrl);
  var analysis = callGeminiVision(imageBase64, title, category, topic, script);

  if (!analysis) throw new Error("Gemini returned empty response.");

  writeResults(sheet, row, analysis, category, title);
}

// ══════════════════════════════════════════════════════════════════════
// ── GEMINI VISION API CALL — V4: Context-Aware Guidance ──
// ══════════════════════════════════════════════════════════════════════
function callGeminiVision(imageBase64, title, category, topic, script) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not set. Go to Project Settings → Script Properties.');

  // V4: Classify the title content type
  var contentType = classifyTitleContent_(title);

  // V4: Build SMART category guidance based on content type
  var catGuidance = '\n\nSMART CATEGORY RULES FOR "' + category + '" (Content Type: ' + contentType + '):\n';

  var elements = ['question', 'rupee', 'number', 'exclaim'];
  var elementLabels = { question: '? (Question mark)', rupee: '₹ (Rupee symbol)', number: 'Specific numbers', exclaim: '! (Exclamation)' };

  for (var i = 0; i < elements.length; i++) {
    var smartRule = getSmartRule_(elements[i], category, contentType, title);
    var action = smartRule.rule === 'boost' ? 'SHOULD HAVE' : (smartRule.rule === 'hurts' ? 'SHOULD NOT HAVE' : 'OPTIONAL');
    catGuidance += '- ' + elementLabels[elements[i]] + ': ' + action + ' — ' + smartRule.reason + '\n';
  }

  // Smart tip
  var smartTip = getSmartTip_(category, contentType, title);
  if (smartTip) catGuidance += '\nSMART TIP: ' + smartTip + '\n';

  // Category-specific visual guidance
  var imageGuidance = {
    "Earning Apps":       "Phone screens with earning proof, money visuals, app interface. Excited face works well.",
    "Finance":            "Calculator, money stacks, graphs going up, comparison visuals. Serious face with pointing gesture.",
    "Business":           "Shop/store setup, product images, before-after transformation. Confident face with business context.",
    "Astrology":          "Zodiac symbols, celestial imagery, kundli charts, mystical backgrounds. Mysterious/knowing expression. No money imagery.",
    "Devotion":           "Temple imagery, deity illustrations, diyas, spiritual symbols. Serene/respectful face. Reverent, not flashy.",
    "Government Jobs":    "Official buildings, exam papers, badge/uniform, ID card visuals. Serious face with determination. No ₹ signs.",
    "YT/IG Mastery":      "Phone with social media screens, follower counts, growth graphs. Excited face pointing at screen/numbers.",
    "Technology":         "Gadgets, AI visuals, futuristic graphics, screen interfaces. Curious/amazed face.",
    "Spoken English":     "Speech bubbles, microphone, confident speaking pose, before-after fluency. Confident face speaking.",
    "AI Tips and Tricks": "AI interface, robot/tech graphics, ChatGPT-style screens. Amazed/mind-blown face.",
    "Government Schemes": "Official forms, Aadhaar/documents, government building. Helpful face pointing at key info.",
    "Sarkari Services":   "Application forms, CSC center, mobile gov portal. Helpful/informative face.",
    "Career":             "Office environment, laptop, interview setting, growth chart. Professional face in formal context.",
    "Law":                "Gavel, court, legal documents, Constitution imagery. Authoritative face with serious expression.",
    "Secrets of India":   "Stunning India locations, monuments, hidden places, aerial views. Amazed/curious face. Mystery vibe.",
    "Skill-based Earning":"Tools/equipment of the skill, workspace, hands doing work. Determined face with DIY energy.",
    "Motivation":         "Before-after transformation, success symbols, powerful visual metaphors. Intense/inspired face.",
    "Scams":              "Warning signs, broken phone, fake messages, shield icons. Worried/alert face.",
    "Trending":           "News-style graphics, trending arrows, social media buzz. Surprised/informed face."
  };

  // V3: Build script context when script is provided
  var scriptContext = '';
  if (script && script.length > 20) {
    var hookLine = script.split(/[\n.!?]/).filter(function(s) { return s.trim().length > 10; })[0] || script.substring(0, 100);

    scriptContext = '\n\n═══════════════════════════════════════════════════════════════\n' +
      'VIDEO SCRIPT CONTEXT (use this to make thumbnail match the video):\n' +
      '═══════════════════════════════════════════════════════════════\n\n' +
      'VIDEO HOOK/OPENING LINE: "' + hookLine.trim().substring(0, 200) + '"\n\n' +
      'SCRIPT PREVIEW (first 500 chars): ' + script.substring(0, 500) + '\n\n' +
      'SCRIPT-AWARE THUMBNAIL RULES:\n' +
      '1. The thumbnail text overlay MUST relate to the script\'s hook/opening line\n' +
      '2. Visual elements should represent the core message of the script\n' +
      '3. If the script mentions a specific number (₹50,000, 5 tips, etc.), use it in the thumbnail\n' +
      '4. Match the emotional tone of the script (surprise, authority, urgency, etc.)\n' +
      '5. The thumbnail should make viewers want to hear THIS specific story/information\n' +
      '6. Add a JSON field "suggested_text_overlay" with the best 3-5 word Hindi/Hinglish text for the thumbnail based on the script hook\n' +
      '7. Add a JSON field "script_thumbnail_alignment" rating 1-10 how well the current thumbnail matches the script\n';
  }

  var catImageGuide = imageGuidance[category] || "Use category-relevant imagery that creates an emotional response.";

  var prompt = 'You are an expert thumbnail designer for Indian short-form video apps (YouTube Shorts, Instagram Reels, EloElo). ' +
    'You design for tier 2/3 Hindi-speaking Indian audience.\n\n' +
    'THUMBNAIL CONTEXT:\n' +
    '- Category: "' + (category || 'Unknown') + '"\n' +
    '- Topic (shown on TOP of thumbnail): "' + (topic || title) + '"\n' +
    '- Video Title (shown in CENTER of thumbnail): "' + title + '"\n' +
    '- Detected Content Type: ' + contentType + '\n\n' +
    'VISUAL STYLE FOR THIS CATEGORY: ' + catImageGuide + '\n' +
    catGuidance + '\n' +
    scriptContext + '\n' +
    'Analyze this thumbnail image and return ONLY a JSON object with these exact keys (no markdown, no explanation):\n\n' +
    '{\n' +
    '  "has_rupee": false,\n' +
    '  "has_number": false,\n' +
    '  "has_timeframe": false,\n' +
    '  "has_question": false,\n' +
    '  "has_exclaim": false,\n' +
    '  "text_readable": true,\n' +
    '  "word_count_ok": true,\n' +
    '  "hindi_text": false,\n' +
    '  "high_contrast": true,\n' +
    '  "face_visible": false,\n' +
    '  "bold_font": true,\n' +
    '  "clean_layout": true,\n' +
    '  "text_on_thumbnail": "",\n' +
    '  "dominant_colors": "",\n' +
    '  "bg_type": "",\n' +
    '  "color_score": "",\n' +
    '  "focal_point": "",\n' +
    '  "face_expression": "",\n' +
    '  "visual_flow": "",\n' +
    '  "text_placement": "",\n' +
    '  "brand_consistency": "",\n' +
    '  "scroll_stop_power": "",\n' +
    '  "design_fix_1": "",\n' +
    '  "design_fix_2": "",\n' +
    '  "design_fix_3": "",\n' +
    '  "overall_impression": "",\n' +
    '  "complete_thumbnail_feedback": "",\n  "suggested_text_overlay": "",\n  "script_thumbnail_alignment": 0\n' +
    '}\n\n' +

    'DETECTION FIELDS (true/false) — what IS on the thumbnail:\n' +
    'has_rupee: ₹ or Rs with amount visible\n' +
    'has_number: specific number visible (5, 10, 1000 etc)\n' +
    'has_timeframe: Daily/Monthly/Weekly/Roz/Mahine visible\n' +
    'has_question: question mark ? visible\n' +
    'has_exclaim: exclamation mark ! visible\n' +
    'text_readable: all text readable at small mobile thumbnail size (150x100px)\n' +
    'word_count_ok: 7 or fewer words on thumbnail\n' +
    'hindi_text: text is Hindi/Hinglish not pure English\n' +
    'high_contrast: text stands out clearly from background\n' +
    'face_visible: human face clearly visible\n' +
    'bold_font: bold thick font used for key text\n' +
    'clean_layout: uncluttered with clear visual hierarchy\n\n' +

    'ANALYSIS FIELDS:\n' +
    'text_on_thumbnail: exact text visible on the image\n' +
    'dominant_colors: 2-3 main colors (e.g. "red, black, yellow")\n' +
    'bg_type: "solid color", "gradient", "photo", "illustration", "blurred photo", "pattern"\n' +
    'color_score: "strong", "average", "weak"\n' +
    'focal_point: what the eye is drawn to first\n' +
    'face_expression: describe expression and energy, or "no face"\n' +
    'visual_flow: "strong", "average", "weak"\n' +
    'text_placement: where text is placed and how it works with the layout\n' +
    'brand_consistency: "professional", "decent", "amateur"\n' +
    'scroll_stop_power: "high", "medium", "low"\n\n' +

    'DESIGN FIXES:\n' +
    'design_fix_1: most impactful improvement\n' +
    'design_fix_2: second most impactful improvement\n' +
    'design_fix_3: third improvement\n\n' +

    'overall_impression: 1 sentence on current quality + single biggest improvement needed.\n\n' +

    '═══════════════════════════════════════════════════════════════\n' +
    'CRITICAL — "complete_thumbnail_feedback" FIELD:\n' +
    '═══════════════════════════════════════════════════════════════\n\n' +

    'This is the MOST IMPORTANT field. Write a COMPLETE, DETAILED description of the PERFECT version of this thumbnail.\n' +
    'This text will be DIRECTLY fed into an AI image generator as a prompt. It must produce a perfect thumbnail in ONE attempt.\n\n' +

    'RULES FOR THIS FIELD:\n' +
    '1. Describe the FINAL IMAGE as it should look — NOT steps to create it\n' +
    '2. DO NOT mention Unsplash, Pexels, Canva, Figma, Photoshop, or any external tools\n' +
    '3. DO NOT use layer-by-layer instructions (no "apply overlay", "gaussian blur", "opacity %")\n' +
    '4. DO NOT say "search for" or "find a stock photo of" — just describe what should be in the image\n' +
    '5. MUST include every visual detail an AI image generator needs:\n' +
    '   - Exact background scene/environment/color with hex codes\n' +
    '   - Person details: gender, ethnicity (Indian), position (left-third/center/right-third), expression, gesture, clothing, size (% of frame)\n' +
    '   - EXACT Hindi/Hinglish text to display on the thumbnail, its position, size relative to frame, color with hex code, font weight\n' +
    '   - Every icon, symbol, object, badge — what it looks like, exact position, size, color\n' +
    '   - Color palette with hex codes for every color used\n' +
    '   - Eye flow: what viewer sees FIRST → SECOND → THIRD\n' +
    '6. MUST respect the SMART CATEGORY RULES above (context-aware, not blanket rules)\n' +
    '7. Text on thumbnail must be max 5-7 words in Hindi/Hinglish\n' +
    '8. MUST describe the aspect ratio as 16:9 (1280x720 pixels)\n' +
    '9. Write as ONE detailed flowing paragraph — not bullet points or sections\n' +
    '10. Be extremely specific about positions using left-third, center, right-third grid\n' +
    '11. Include the suggested shortened/improved title text if current one is too long\n' +
    '12. Every element must have: WHAT it is, WHERE it goes, HOW BIG it is, WHAT COLOR it is\n\n' +

    'EXAMPLE of a GOOD complete_thumbnail_feedback (for Earning Apps category):\n' +
    '"A 16:9 professional thumbnail (1280x720) with a dark green gradient background (#004D40 to #00C853). ' +
    'In the left-third, a young Indian male in a casual blue t-shirt, half-body cutout filling 50% of the frame height, ' +
    'with an excited open-mouth expression, right hand pointing towards the right side of the frame. ' +
    'In the center, large bold white text (#FFFFFF) with 3px black stroke reading \'Daily ₹500 कमाओ!\' in extra-bold Devanagari font, ' +
    'taking up 30% of the frame width. In the right-third, a large smartphone mockup (filling 40% frame height) showing a green ' +
    'payment received screen with ₹500 amount visible. Below the phone, a small stack of Indian ₹500 notes. ' +
    'A small bright yellow (#FFD700) circular badge in the top-right corner reading \'Top 5\'. ' +
    'Eye flow: Face (trust) → Text (hook) → Phone with money proof (credibility). ' +
    'Colors: primary dark green #004D40, accent gold #FFD700, text white #FFFFFF with black #000000 stroke. ' +
    'Clean uncluttered layout with high text contrast, designed for maximum scroll-stopping power on mobile."\n\n' +

    'EXAMPLE of a BAD complete_thumbnail_feedback (DO NOT write like this):\n' +
    '"Search Unsplash for green gradient. Apply 40% overlay. Add face cutout with drop shadow. ' +
    'Use Noto Sans Devanagari. Apply gaussian blur 5px to background edges." ' +
    '← This is BAD because it describes PROCESS not the FINAL IMAGE.\n\n' +

    'ONLY output the JSON. Nothing else.';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;

  var payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
      ]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 }
    }
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var respJson = JSON.parse(response.getContentText());

  if (respJson.error) throw new Error('Gemini API: ' + respJson.error.message);

  var parts = respJson.candidates[0].content.parts;
  var fullText = '';
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].text) fullText += parts[i].text + '\n';
  }

  var cleaned = fullText.replace(/```json/gi, '').replace(/```/g, '').trim();
  var firstBrace = cleaned.indexOf('{');
  var lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON in response. First 300 chars: ' + fullText.substring(0, 300));
  }

  var jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
  jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  return JSON.parse(jsonStr);
}

// ══════════════════════════════════════════════════════════════════════
// ── SCORING + WRITE RESULTS — V4: Context-Aware Category Warnings ──
// ══════════════════════════════════════════════════════════════════════
function writeResults(sheet, row, analysis, category, title) {
  // V4: Classify title content type
  var contentType = classifyTitleContent_(title);

  // ── DESIGN QUALITY SCORE (75 pts) ──
  var designScore = 0;
  var designBreakdown = [];

  if (analysis.text_readable) { designScore += 20; } else { designBreakdown.push("TEXT NOT READABLE"); }
  if (analysis.high_contrast) { designScore += 15; } else { designBreakdown.push("Low contrast"); }
  if (analysis.bold_font) { designScore += 10; } else { designBreakdown.push("Use bolder font"); }
  if (analysis.clean_layout) { designScore += 10; } else { designBreakdown.push("Too cluttered"); }
  if (analysis.word_count_ok) { designScore += 8; } else { designBreakdown.push("Too many words"); }
  if (analysis.face_visible) { designScore += 7; } else { designBreakdown.push("Add face"); }
  if (analysis.hindi_text) { designScore += 5; } else { designBreakdown.push("Use Hindi text"); }

  // ══════════════════════════════════════════════════════════════════
  // V4: CONTEXT-AWARE CATEGORY SCORE (25 pts)
  // Uses getSmartRule_() instead of blanket CATEGORY_RULES
  // ══════════════════════════════════════════════════════════════════
  var catScore = 0;
  var catTips = [];
  var catWarnings = [];

  var elements = [
    { key: "rupee",    detected: analysis.has_rupee,    label: "₹ symbol",        boostPts: 8, hurtPts: -8 },
    { key: "number",   detected: analysis.has_number,   label: "Specific number",  boostPts: 7, hurtPts: -7 },
    { key: "question", detected: analysis.has_question,  label: "Question mark (?)", boostPts: 5, hurtPts: -5 },
    { key: "exclaim",  detected: analysis.has_exclaim,   label: "Exclamation (!)",   boostPts: 5, hurtPts: -5 }
  ];

  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    // V4: Get SMART rule based on content type, not just category
    var smartResult = getSmartRule_(el.key, category, contentType, title);
    var rule = smartResult.rule;

    if (rule === "boost" && el.detected) {
      catScore += el.boostPts;
    } else if (rule === "boost" && !el.detected) {
      catTips.push("Add " + el.label + " — " + smartResult.reason);
    } else if (rule === "hurts" && el.detected) {
      catScore += el.hurtPts;
      catWarnings.push("REMOVE " + el.label + " — " + smartResult.reason);
    } else if (rule === "hurts" && !el.detected) {
      catScore += 3; // Good that it's not there
    } else if (rule === "context") {
      // Context-dependent: no score penalty/bonus, just advice
      if (el.detected) {
        catTips.push(el.label + ": " + smartResult.reason);
      } else {
        catTips.push(el.label + ": " + smartResult.reason);
      }
    }
    // "neutral" → no action, no tip
  }

  // V4: Add smart tip based on category + content type
  var smartTip = getSmartTip_(category, contentType, title);
  if (smartTip) {
    catTips.push("💡 " + smartTip);
  }

  var totalScore = Math.max(0, Math.min(100, designScore + catScore));

  // ── Column D: Text detected ──
  sheet.getRange(row, 5).setValue(analysis.text_on_thumbnail || '');

  // ── Column E: Score ──
  sheet.getRange(row, 6).setValue(totalScore);

  // ── Column F: Verdict ──
  var verdict = totalScore >= 70 ? "PUBLISH" : (totalScore >= 45 ? "REVISE" : "REDESIGN");
  sheet.getRange(row, 7).setValue(verdict);

  // ── Column G: Score Breakdown — V4: includes content type ──
  sheet.getRange(row, 8).setValue("Design: " + designScore + "/75 | Category Fit: " + (catScore >= 0 ? "+" : "") + catScore + "/25 | Type: " + contentType);

  // ── Column H: Category-specific warnings — V4: CONTEXT-AWARE ──
  var allWarnings = catWarnings.concat(catTips);
  if (allWarnings.length === 0) allWarnings.push("Good fit for " + category + " (" + contentType + " content)");
  sheet.getRange(row, 9).setValue(allWarnings.join(" | "));

  // ── Column I: Design fixes ──
  var designFixes = [];
  if (analysis.design_fix_1) designFixes.push("1. " + analysis.design_fix_1);
  if (analysis.design_fix_2) designFixes.push("2. " + analysis.design_fix_2);
  if (analysis.design_fix_3) designFixes.push("3. " + analysis.design_fix_3);
  if (designFixes.length === 0) designFixes.push("No major design issues");
  sheet.getRange(row, 10).setValue(designFixes.join("\n"));

  // ── Column J: Visual Analysis ──
  var visualParts = [];
  if (analysis.bg_type) visualParts.push("BG: " + analysis.bg_type);
  if (analysis.focal_point) visualParts.push("Focus: " + analysis.focal_point);
  if (analysis.text_placement) visualParts.push("Text: " + analysis.text_placement);
  if (analysis.visual_flow) visualParts.push("Flow: " + analysis.visual_flow);
  if (analysis.color_score) visualParts.push("Colors: " + analysis.color_score);
  sheet.getRange(row, 11).setValue(visualParts.join(" | "));

  // ── Column K: Scroll-Stop Power ──
  var impactParts = [];
  if (analysis.scroll_stop_power) impactParts.push("Scroll-Stop: " + analysis.scroll_stop_power.toUpperCase());
  if (analysis.face_expression && analysis.face_expression !== "no face") impactParts.push("Face: " + analysis.face_expression);
  if (analysis.brand_consistency) impactParts.push("Quality: " + analysis.brand_consistency);
  sheet.getRange(row, 12).setValue(impactParts.length > 0 ? impactParts.join(" | ") : "—");

  // ── Column L: Colors + Impression ──
  var summaryParts = [];
  if (analysis.dominant_colors) summaryParts.push("Colors: " + analysis.dominant_colors);
  if (analysis.overall_impression) summaryParts.push(analysis.overall_impression);
  sheet.getRange(row, 13).setValue(summaryParts.join(" | "));

  // ── Column M: Design checklist ──
  var checkItems = [];
  checkItems.push(analysis.text_readable ? "Readable" : "NOT Readable");
  checkItems.push(analysis.high_contrast ? "Contrast OK" : "Low Contrast");
  checkItems.push(analysis.bold_font ? "Bold Font" : "Thin Font");
  checkItems.push(analysis.clean_layout ? "Clean" : "Cluttered");
  checkItems.push(analysis.word_count_ok ? "Word Count OK" : "Too Many Words");
  checkItems.push(analysis.face_visible ? "Face Yes" : "No Face");
  checkItems.push(analysis.hindi_text ? "Hindi" : "Not Hindi");
  sheet.getRange(row, 14).setValue(checkItems.join(" | "));

  // ══════════════════════════════════════════════════════════════════
  // ── Column O: COMPLETE THUMBNAIL FEEDBACK (One-Shot Prompt) ──
  // ══════════════════════════════════════════════════════════════════
  var feedback = analysis.complete_thumbnail_feedback || '';

  if (!feedback || feedback.length < 50) {
    feedback = 'A 16:9 professional thumbnail (1280x720) for the "' + category + '" category. ';
    if (analysis.overall_impression) feedback += analysis.overall_impression + ' ';
    if (analysis.design_fix_1) feedback += 'Key improvement needed: ' + analysis.design_fix_1 + '. ';
    if (analysis.design_fix_2) feedback += 'Also: ' + analysis.design_fix_2 + '. ';
    if (analysis.design_fix_3) feedback += 'And: ' + analysis.design_fix_3 + '.';
  }

  sheet.getRange(row, 15).setValue(feedback);
  sheet.getRange(row, 15).setFontColor('#1F4E79').setFontWeight('normal').setFontSize(9);

  // ── Color-code score and verdict cells ──
  var bgColor, fontColor;
  if (totalScore >= 70) { bgColor = '#C6EFCE'; fontColor = '#006100'; }
  else if (totalScore >= 45) { bgColor = '#FFEB9C'; fontColor = '#9C5700'; }
  else { bgColor = '#FFC7CE'; fontColor = '#9C0006'; }

  sheet.getRange(row, 6).setBackground(bgColor).setFontColor(fontColor).setFontWeight('bold');
  sheet.getRange(row, 7).setBackground(bgColor).setFontColor(fontColor).setFontWeight('bold');

  var ssp = (analysis.scroll_stop_power || "").toLowerCase();
  if (ssp === "high") sheet.getRange(row, 12).setBackground('#C6EFCE').setFontColor('#006100');
  else if (ssp === "low") sheet.getRange(row, 12).setBackground('#FFC7CE').setFontColor('#9C0006');

  if (catWarnings.length > 0) sheet.getRange(row, 9).setBackground('#FFC7CE').setFontColor('#9C0006').setFontWeight('bold');
}

// ══════════════════════════════════════════════════════════════════════
// ── IMAGE UTILITIES ──
// ══════════════════════════════════════════════════════════════════════

function getImageBase64(url) {
  var fileId = extractDriveFileId(url);
  if (fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      var blob = file.getBlob();
      return Utilities.base64Encode(blob.getBytes());
    } catch (e) {
      throw new Error("Cannot access Drive file. File ID: " + fileId);
    }
  }
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) throw new Error("HTTP " + response.getResponseCode());
    return Utilities.base64Encode(response.getBlob().getBytes());
  } catch (e) {
    throw new Error("Could not fetch image. Error: " + e.message);
  }
}

function extractDriveFileId(url) {
  var match1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  var match2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  var match3 = url.match(/docs\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (match3) return match3[1];
  if (url.match(/^[a-zA-Z0-9_-]{20,}$/) && !url.match(/^https?:/)) return url;
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// ── THUMBNAIL GENERATION — Direct Prompt Pass-Through ──
// ══════════════════════════════════════════════════════════════════════

function generateSelectedRowThumbnail() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row < 3) {
    SpreadsheetApp.getUi().alert('Please select a data row (row 3 or below).');
    return;
  }
  var feedback = sheet.getRange(row, 15).getValue();
  if (!feedback) {
    SpreadsheetApp.getUi().alert('No feedback in Column O.\nRun "Analyze Selected Row" first.');
    return;
  }
  try {
    generateThumbnailForRow(sheet, row);
    SpreadsheetApp.getUi().alert('Thumbnail generated!\nSaved to Drive folder: ' + THUMBNAIL_FOLDER_NAME + '\nLink added in Column P.');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error on row ' + row + ': ' + e.message);
  }
}

function generateAllPendingThumbnails() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var generated = 0, errors = 0;
  for (var r = 3; r <= lastRow; r++) {
    var feedback = sheet.getRange(r, 15).getValue();
    var existingThumb = sheet.getRange(r, 16).getValue();
    if (feedback && !existingThumb) {
      try {
        generateThumbnailForRow(sheet, r);
        generated++;
        Utilities.sleep(3000);
      } catch (e) {
        sheet.getRange(r, 16).setValue("ERROR: " + e.message);
        errors++;
      }
    }
  }
  SpreadsheetApp.getUi().alert('Done! Generated: ' + generated + ' | Errors: ' + errors);
}

function generateThumbnailForRow(sheet, row) {
  var category = sheet.getRange(row, 3).getValue();
  var feedback = sheet.getRange(row, 15).getValue();

  if (!feedback) throw new Error('No feedback in Column O. Run analysis first.');

  sheet.getRange(row, 16).setValue("Generating...");
  SpreadsheetApp.flush();

  var imagePrompt = 'Generate a professional YouTube thumbnail image.\n\n' +
    'THUMBNAIL DESCRIPTION:\n' + feedback + '\n\n' +
    'CRITICAL RULES:\n' +
    '- Aspect ratio: exactly 16:9 (1280x720 pixels)\n' +
    '- All text must be LARGE, BOLD, and CLEARLY READABLE at small sizes\n' +
    '- High contrast between text and background\n' +
    '- Hindi/Hinglish text in bold Devanagari font\n' +
    '- Professional, eye-catching design that stops scrolling\n' +
    '- Clean layout — do NOT overcrowd\n' +
    '- Text must be spelled correctly and clearly legible\n' +
    '- Indian context: Hindi fonts, Indian people, ₹ not $';

  var imageBlob = callGeminiImageGen(imagePrompt);

  var folder = getOrCreateFolder(THUMBNAIL_FOLDER_NAME);
  var fileName = 'thumb_row' + row + '_' + new Date().getTime() + '.png';
  var file = folder.createFile(imageBlob.setName(fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileUrl = file.getUrl();

  var richText = SpreadsheetApp.newRichTextValue()
    .setText('View Thumbnail')
    .setLinkUrl(fileUrl)
    .build();
  sheet.getRange(row, 16).setRichTextValue(richText);
  sheet.getRange(row, 16).setFontColor('#0066CC').setFontWeight('bold');

  return fileUrl;
}

// ── Gemini Image Generation API ──
function callGeminiImageGen(prompt) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not set.');

  var attempts = [
    { model: 'gemini-2.5-flash-preview-image-generation', config: { responseModalities: ["TEXT", "IMAGE"] } },
    { model: 'gemini-2.5-flash-image', config: { responseModalities: ["TEXT", "IMAGE"] } },
    { model: 'gemini-2.0-flash-exp-image-generation', config: { responseModalities: ["TEXT", "IMAGE"] } },
    { model: 'gemini-2.0-flash-001', config: { responseModalities: ["TEXT", "IMAGE"] } }
  ];

  var lastError = '';

  for (var m = 0; m < attempts.length; m++) {
    var model = attempts[m].model;
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
    var payload = {
      contents: [{ parts: [{ text: prompt }], role: "user" }],
      generationConfig: attempts[m].config
    };

    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'post', contentType: 'application/json',
        payload: JSON.stringify(payload), muteHttpExceptions: true
      });

      if (response.getResponseCode() !== 200) {
        lastError = model + ': HTTP ' + response.getResponseCode();
        continue;
      }

      var respJson = JSON.parse(response.getContentText());
      if (respJson.error) { lastError = model + ': ' + respJson.error.message; continue; }

      var parts = respJson.candidates[0].content.parts;
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].inlineData && parts[i].inlineData.data) {
          var mimeType = parts[i].inlineData.mimeType || 'image/png';
          var imageBytes = Utilities.base64Decode(parts[i].inlineData.data);
          return Utilities.newBlob(imageBytes, mimeType, 'thumbnail.png');
        }
      }
      lastError = model + ': No image in response';
    } catch (e) {
      lastError = model + ': ' + e.message;
    }
  }
  throw new Error('Image generation failed. Last error: ' + lastError);
}

// ── Copy thumbnail prompt for external use ──
function copyThumbnailPrompt() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveRange().getRow();
  if (row < 3) {
    SpreadsheetApp.getUi().alert('Please select a data row (row 3 or below).');
    return;
  }
  var feedback = sheet.getRange(row, 15).getValue();
  if (!feedback) {
    SpreadsheetApp.getUi().alert('No feedback in Column O.\nRun "Analyze Selected Row" first.');
    return;
  }

  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:monospace;padding:12px;font-size:11px;">' +
    '<p style="font-family:Arial;"><b>Complete Thumbnail Prompt — Row ' + row + '</b></p>' +
    '<p style="font-family:Arial;color:#666;font-size:11px;">Copy this directly into your AI image generation tool (Midjourney, DALL-E, Gemini, etc.)</p>' +
    '<textarea id="prompt" style="width:100%;height:350px;font-size:11px;font-family:monospace;padding:8px;" readonly>' +
    feedback.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
    '</textarea>' +
    '<br><button onclick="document.getElementById(\'prompt\').select();document.execCommand(\'copy\');this.innerText=\'Copied!\'" ' +
    'style="margin-top:8px;padding:8px 24px;background:#C55A11;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">' +
    'Copy to Clipboard</button>' +
    '</div>'
  ).setWidth(620).setHeight(480);
  SpreadsheetApp.getUi().showModalDialog(html, 'Thumbnail Prompt — Copy for AI Image Generator');
}

// ── Get or create Drive folder ──
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

// ── Test API Connection ──
function testApiConnection() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    SpreadsheetApp.getUi().alert('❌ No API Key Found!\n\nGo to: ⚙️ Project Settings → Script Properties\nAdd: GEMINI_API_KEY = your key');
    return;
  }
  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
    var payload = { contents: [{ parts: [{ text: "Respond with exactly: API connected" }] }], generationConfig: { thinkingConfig: { thinkingBudget: 0 } } };
    var response = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
    var json = JSON.parse(response.getContentText());
    if (json.error) SpreadsheetApp.getUi().alert('❌ API Error: ' + json.error.message);
    else SpreadsheetApp.getUi().alert('✅ Gemini API Connected!');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Failed: ' + e.message);
  }
}

// ── Test Image Generation ──
function testImageGeneration() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) { SpreadsheetApp.getUi().alert('No GEMINI_API_KEY found.'); return; }

  var testPrompt = 'Generate a simple test image: a blue circle on a white background.';
  var models = [
    'gemini-2.5-flash-preview-image-generation',
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-001'
  ];
  var results = [];
  for (var i = 0; i < models.length; i++) {
    var model = models[i];
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
    var payload = { contents: [{ parts: [{ text: testPrompt }], role: "user" }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } };
    try {
      var response = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) { results.push(model + ': ❌ HTTP ' + response.getResponseCode()); continue; }
      var json = JSON.parse(response.getContentText());
      if (json.error) { results.push(model + ': ❌ ' + json.error.message); continue; }
      var parts = json.candidates[0].content.parts;
      var hasImage = false;
      for (var p = 0; p < parts.length; p++) { if (parts[p].inlineData) { hasImage = true; break; } }
      results.push(model + ': ' + (hasImage ? '✅ IMAGE GENERATED!' : '⚠️ Text-only'));
    } catch (e) {
      results.push(model + ': ❌ ' + e.message.substring(0, 100));
    }
  }
  SpreadsheetApp.getUi().alert('Image Generation Test:\n\n' + results.join('\n\n'));
}

// ── Help — V4 ──
function showHelp() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;padding:16px;max-width:560px;">' +
    '<h2 style="color:#C55A11;">Thumbnail Analyzer V4 — Context-Aware</h2>' +

    '<h3 style="color:#D32F2F;">🆕 What Changed in V4?</h3>' +
    '<table style="font-size:12px;border-collapse:collapse;width:100%;margin-bottom:12px;">' +
    '<tr style="background:#FFC7CE;"><td style="padding:6px;border:1px solid #ccc;width:35%;"><b>❌ V3 (Blanket Rules)</b></td>' +
    '<td style="padding:6px;border:1px solid #ccc;">Every Finance video: "REMOVE ? — HURTS CTR!"<br>Every Finance video: "Add ₹ — boosts CTR!"<br>Same advice regardless of content type</td></tr>' +
    '<tr style="background:#C6EFCE;"><td style="padding:6px;border:1px solid #ccc;"><b>✅ V4 (Context-Aware)</b></td>' +
    '<td style="padding:6px;border:1px solid #ccc;">"Festive Offer Ya Trap?" → <b>KEEP ?</b> (curiosity hook!)<br>"₹50,000 Monthly Income" → <b>REMOVE ?</b> (creates doubt)<br>"Mutual Fund Kya Hai?" → <b>? is fine</b> (viewer\'s question)<br>Different advice based on what the title is ABOUT</td></tr>' +
    '</table>' +

    '<h3>How It Works:</h3>' +
    '<p style="font-size:12px;">V4 classifies each title into a <b>Content Type</b> first:</p>' +
    '<table style="font-size:11px;border-collapse:collapse;width:100%;margin-bottom:8px;">' +
    '<tr style="background:#E3F2FD;"><td style="padding:3px 6px;border:1px solid #ccc;"><b>EARNING_AMOUNT</b></td><td style="padding:3px 6px;border:1px solid #ccc;">₹, Rs, kamao, income → ₹ helps, ? hurts</td></tr>' +
    '<tr><td style="padding:3px 6px;border:1px solid #ccc;"><b>CURIOSITY_HOOK</b></td><td style="padding:3px 6px;border:1px solid #ccc;">ya, trap, secret, scam → ? helps, ! hurts</td></tr>' +
    '<tr style="background:#E3F2FD;"><td style="padding:3px 6px;border:1px solid #ccc;"><b>EDUCATION</b></td><td style="padding:3px 6px;border:1px solid #ccc;">kya hai, seekho, explained → ? OK, ₹ skip</td></tr>' +
    '<tr><td style="padding:3px 6px;border:1px solid #ccc;"><b>LISTICLE</b></td><td style="padding:3px 6px;border:1px solid #ccc;">Top 5, 3 tarike, best → numbers must, ? hurts</td></tr>' +
    '<tr style="background:#E3F2FD;"><td style="padding:3px 6px;border:1px solid #ccc;"><b>URGENCY_NEWS</b></td><td style="padding:3px 6px;border:1px solid #ccc;">breaking, last date → ! helps, ? hurts</td></tr>' +
    '<tr><td style="padding:3px 6px;border:1px solid #ccc;"><b>COMPARISON</b></td><td style="padding:3px 6px;border:1px solid #ccc;">vs, konsa best → ? can help</td></tr>' +
    '</table>' +
    '<p style="font-size:12px;">Then applies rules <b>per content type</b>, not per category.</p>' +

    '<h3>How to Use:</h3>' +
    '<ol style="font-size:12px;">' +
    '<li>Enter <b>Topic Name</b> in Column A</li>' +
    '<li>(Optional) Paste <b>Script</b> in Column B for script-aware feedback</li>' +
    '<li>Select <b>Category</b> from dropdown in Column C (REQUIRED)</li>' +
    '<li>Paste <b>Image URL</b> in Column D (Drive link or direct URL)</li>' +
    '<li>Click <b>Thumbnail Analyzer → Analyze Selected Row</b></li>' +
    '</ol>' +

    '<h3>Output Columns:</h3>' +
    '<table style="font-size:11px;border-collapse:collapse;width:100%;">' +
    '<tr><td style="padding:3px;"><b>E</b></td><td>Text detected on image</td></tr>' +
    '<tr><td style="padding:3px;"><b>F-G</b></td><td>Score /100 + Verdict</td></tr>' +
    '<tr><td style="padding:3px;"><b>H</b></td><td>Score breakdown + Content Type</td></tr>' +
    '<tr><td style="padding:3px;"><b>I</b></td><td>🆕 CONTEXT-AWARE warnings (with reasons!)</td></tr>' +
    '<tr><td style="padding:3px;"><b>J-N</b></td><td>Design Fixes, Visual Analysis, Impact, Colors, Checklist</td></tr>' +
    '<tr><td style="padding:3px;"><b>O</b></td><td>Complete Thumbnail Feedback (AI image gen prompt)</td></tr>' +
    '<tr><td style="padding:3px;"><b>P</b></td><td>AI Generated Thumbnail (link)</td></tr>' +
    '</table>' +

    '<p style="font-size:11px;color:#999;margin-top:12px;">V4 — Context-Aware Rules | No more blanket "Remove ? in Finance" on every video!</p>' +
    '</div>'
  ).setWidth(600).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, 'Thumbnail Analyzer V4 — Context-Aware Help');
}