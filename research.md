# Thumbnail Design Research — CTR Rules & Category Intelligence

> All data extracted from the EloElo Thumbnail Analyzer V4 script. This is the accumulated research on what design elements boost or hurt Click-Through Rate (CTR) for Hindi-speaking Indian audiences on short-form video platforms.

---

## 1. Content Type Classification System

Every video title is classified into one of these content types **before** rules are applied. This prevents blanket advice and makes recommendations context-aware.

| Content Type | Description | Detection Keywords |
|---|---|---|
| **EARNING_AMOUNT** | About specific money, earnings, income | `₹`, `rs`, `rupee`, `rupaye`, `kamao`, `kamai`, `kamaye`, `income`, `salary`, `paisa`, `paise`, `earning`, `earn`, `munafa`, `profit`, `lakh`, `crore`, `monthly income`, `daily income`, `per month`, `per day`, `investment return`, `kaise kamaye`, `kitna milega`, `kitna kamate`, `kamane ka`, `paisa kaise` |
| **URGENCY_NEWS** | Breaking news, deadlines, alerts | `breaking`, `urgent`, `last date`, `deadline`, `abhi karo`, `jaldi karo`, `aaj hi`, `turant`, `chetavani`, `warning`, `alert`, `kal se band`, `hataya gaya`, `banned`, `new rule`, `naya niyam`, `sarkari update`, `notification out` |
| **CURIOSITY_HOOK** | Mystery, A-vs-B tension, trap/scam reveal | `ya` (in context), `trap`, `scam`, `fraud`, `dhoka`, `jhooth`, `sach`, `sachai`, `secret`, `raaz`, `rahasya`, `galti`, `mistake`, `chaukane wala`, `shocking`, `pata nahi tha`, `koi nahi batata`, `hidden`, `chhupa`, `asli sach`, `nakli`, `real vs fake`, `truth`, `expose`, `reality` |
| **LISTICLE** | Numbered lists, top X, rankings | Regex: `top \d+`, `best \d+`, `\d+ tips`, `\d+ tarike`, `\d+ ways`, `\d+ steps`, `\d+ galti`, `\d+ mistakes`, `\d+ cheeze`, `\d+ tools`, `\d+ apps`, `\d+ methods`, `sabse (best\|accha\|top)`, `\d+ tricks`, `\d+ hacks` |
| **COMPARISON** | X vs Y, which is better | `vs`, `versus`, `ya phir`, `konsa best`, `kaun sa`, `better`, `comparison`, `difference`, `farak`, `compare` |
| **EDUCATION** | Concept explanations, guides | `kya hai`, `kya hota`, `kya hoti`, `meaning`, `matlab`, `samjho`, `seekho`, `sikhiye`, `jaaniye`, `jaano`, `psychology`, `mindset`, `explained`, `guide`, `complete guide`, `basics`, `beginner`, `shuru kaise`, `kaise kare`, `kaise karte`, `full information`, `puri jankari`, `simply explained` |
| **DEFAULT** | None of the above | Falls back to category-level rules |

> **Priority Order:** EARNING_AMOUNT → URGENCY_NEWS → CURIOSITY_HOOK → LISTICLE → COMPARISON → EDUCATION → DEFAULT

---

## 2. Context-Aware Element Rules

### How each element (?, ₹, numbers, !) works per content type:

### Question Mark (?)
| Content Type | Rule | Reasoning |
|---|---|---|
| CURIOSITY_HOOK | **BOOST** | Creates intrigue/tension — KEEP IT |
| COMPARISON | **BOOST** | Makes viewer want to know the answer |
| EDUCATION (kya hai type) | Neutral | Mirrors the viewer's own question — OK to keep |
| EDUCATION (other) | Neutral | Acceptable if it frames the learning question |
| EARNING_AMOUNT | **HURTS** | Creates DOUBT about earning claims — use `!` instead |
| LISTICLE | **HURTS** | Weakens authority — statement format is stronger |
| URGENCY_NEWS | **HURTS** | Undermines urgency — use `!` for authority |

### Rupee Symbol (₹)
| Content Type | Rule | Reasoning |
|---|---|---|
| EARNING_AMOUNT | **BOOST** | ₹ with specific amount boosts CTR for earning content |
| CURIOSITY_HOOK | Neutral | Not needed — the intrigue itself drives clicks |
| EDUCATION (money topics) | Context | Could work if showing specific amount/rate |
| EDUCATION (non-money) | Neutral | Focus on clarity instead |
| LISTICLE (money-related) | **BOOST** | Boosts CTR for money-related listicles |
| LISTICLE (non-money) | Neutral | Not relevant |
| URGENCY_NEWS (financial) | **BOOST** | Reinforces financial impact |
| URGENCY_NEWS (non-financial) | Neutral | Only needed if involves financial impact |

> **Money-related education keywords:** `investment`, `mutual fund`, `stock`, `share market`, `trading`, `sip`, `fd`, `loan`, `emi`, `credit`, `debit`, `bank`, `tax`, `gst`
>
> **Money-related listicle keywords:** `save`, `invest`, `earn`, `kamao`, `bachao`, `money`, `paisa`
>
> **Financial news keywords:** `rbi`, `bank`, `tax`, `gst`, `price`, `rate`, `mehengai`, `sasta`

### Specific Numbers
| Content Type | Rule | Reasoning |
|---|---|---|
| LISTICLE | **BOOST** | ESSENTIAL — add count (5 tips, 3 ways, etc.) |
| EARNING_AMOUNT | **BOOST** | Specific number (₹50,000, 15%) makes claim believable |
| URGENCY_NEWS | **BOOST** | Adds urgency (5 din baaki, 2 crore affected) |
| CURIOSITY_HOOK | Neutral | Numbers reduce mystery — better without |
| EDUCATION | Neutral | Not essential unless it's a numbered framework |
| COMPARISON | Context | Helps IF showing specific data points (returns, speed, price) |

### Exclamation Mark (!)
| Content Type | Rule | Reasoning |
|---|---|---|
| URGENCY_NEWS | **BOOST** | Reinforces urgency — essential for breaking/deadline |
| EARNING_AMOUNT | **BOOST** | Adds excitement and confidence to earning claims |
| CURIOSITY_HOOK | **HURTS** | Kills curiosity — `?` or `...` works better |
| EDUCATION | Neutral | Feels clickbaity — calm authority works better |
| LISTICLE (exciting) | **BOOST** | Adds energy to exciting listicles |
| LISTICLE (factual) | Neutral | Optional for informational lists |
| COMPARISON | Neutral | Optional — works if revealing a clear winner |

> **Exciting listicle keywords:** `best`, `top`, `amazing`, `kamaal`, `dhamaka`, `powerful`, `must`

---

## 3. Category-Level Default Rules (Fallback)

Used only when content type is `DEFAULT` (title can't be classified):

| Category | ₹ Rupee | Numbers | ? Question | ! Exclaim |
|---|---|---|---|---|
| Earning Apps | BOOST | BOOST | HURTS | Neutral |
| Finance | BOOST | BOOST | HURTS | BOOST |
| Business | BOOST | BOOST | HURTS | Neutral |
| Astrology | Neutral | HURTS | BOOST | Neutral |
| Devotion | Neutral | Neutral | HURTS | Neutral |
| Government Jobs | HURTS | BOOST | Neutral | BOOST |
| YT/IG Mastery | BOOST | BOOST | BOOST | BOOST |
| Technology | BOOST | BOOST | BOOST | BOOST |
| Spoken English | Neutral | BOOST | BOOST | Neutral |
| AI Tips and Tricks | Neutral | Neutral | Neutral | BOOST |
| Government Schemes | Neutral | Neutral | BOOST | Neutral |
| Sarkari Services | Neutral | Neutral | Neutral | Neutral |
| Career | Neutral | BOOST | HURTS | HURTS |
| Law | Neutral | HURTS | BOOST | Neutral |
| Secrets of India | Neutral | Neutral | Neutral | Neutral |
| Skill-based Earning | Neutral | Neutral | Neutral | Neutral |
| Motivation | Neutral | Neutral | BOOST | Neutral |
| Scams | Neutral | Neutral | BOOST | Neutral |
| Trending | Neutral | Neutral | Neutral | BOOST |

---

## 4. Category × Content Type Smart Tips

### Finance
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Add a specificity word (Loan, Credit Card, FD, SIP) — "X Ya Trap?" is good but "Credit Card Offer Ya Trap?" is better |
| EARNING_AMOUNT | Add exact ₹ amount + timeframe (monthly/yearly). "₹50,000/month" > "bahut paisa" |
| EDUCATION | Add "Hindi mein" or "Simply Explained" or "for Beginners" to signal accessibility |
| LISTICLE | Bold the NUMBER on the thumbnail (make it 2x bigger than other text) |
| URGENCY_NEWS | Add the DATE or DEADLINE prominently. Financial news without dates feels vague |
| COMPARISON | Show BOTH options visually on the thumbnail (split-screen or vs badge) |
| DEFAULT | Finance audience responds to specific data. Add one concrete number or percentage |

### Earning Apps
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show WITHDRAWAL PROOF — ₹ amount with payment app logo builds instant trust |
| CURIOSITY_HOOK | Add "Real or Fake?" or "Sach Ya Jhooth?" — app-related curiosity drives massive clicks |
| EDUCATION | Replace with "How I Earned ₹X" format — audience wants proof, not theory |
| LISTICLE | Show the TOP earning app logo/icon prominently |
| URGENCY_NEWS | Show app name + "BANNED?" or "Update Required" — creates fear of missing out |
| COMPARISON | Show both app logos side-by-side with earning amounts |
| DEFAULT | Earning Apps audience needs PROOF. Add payment screenshot or ₹ amount |

### Business
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show "Investment: ₹X → Return: ₹Y" format. Business audience wants ROI clarity |
| CURIOSITY_HOOK | Business curiosity works great — just add the business type for specificity |
| EDUCATION | Add "Step-by-Step" or "Full Plan" to make business education feel actionable |
| LISTICLE | Show the business type icons/images for each list item |
| URGENCY_NEWS | Add "New GST Rule" or "License Update" with date — fear of missing compliance deadlines |
| COMPARISON | Show investment vs return for both options. Business comparisons need ROI clarity |
| DEFAULT | Business audience wants real examples. Add a shop/product image or revenue number |

### Astrology
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Add specific RASHI name — personalization drives clicks |
| EDUCATION | Use mystical/zodiac imagery. Should feel cosmic, not academic |
| EARNING_AMOUNT | If "lucky numbers for wealth", use zodiac imagery not ₹ |
| LISTICLE | Show rashi symbols for each list item |
| URGENCY_NEWS | Add exact DATE — "25 Feb ke baad". Astrology urgency = planetary timing |
| COMPARISON | Show both rashis/planets visually. Cosmic comparison imagery |
| DEFAULT | Needs mystery + personalization. Add rashi symbol and mystical background |

### Devotion
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Add "Kya Aapko Pata Hai?" with deity imagery — must stay respectful |
| EDUCATION | Show mantra text or puja items prominently = visual guide to rituals |
| LISTICLE | Show divine symbols for each item |
| URGENCY_NEWS | Add festival name + date. "Navratri Special" or "Shivratri — Aaj Raat" |
| COMPARISON | Keep both options reverential — no "vs" battle format |
| DEFAULT | Deity images, warm golden tones, mantra text. Keep it reverent |

### Government Jobs
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show SALARY GRADE prominently (₹25,000 - ₹60,000/month). Job seekers scan for pay first |
| CURIOSITY_HOOK | Add "Kya Aap Eligible Ho?" — eligibility check anxiety |
| EDUCATION | Show syllabus/exam name prominently = exam prep guidance |
| LISTICLE | Show salary range prominently |
| URGENCY_NEWS | LAST DATE in big red text + vacancy count in yellow. Urgency is everything |
| COMPARISON | Show both jobs with salary + vacancy count |
| DEFAULT | Vacancy count + Last Date + Salary. Add all three |

### YT/IG Mastery
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show YOUR analytics screenshot or follower count as proof |
| CURIOSITY_HOOK | Add "Algorithm Secret" or "Hack" language — creators obsess over shortcuts |
| EDUCATION | Show platform interface (YouTube Studio, IG Insights) |
| LISTICLE | Show growth graph or before→after follower counts |
| URGENCY_NEWS | Add "New Algorithm Update" or "Policy Change" — creators fear platform changes |
| COMPARISON | Show both platform logos with growth metrics |
| DEFAULT | Creator audience wants PROOF of growth. Show follower counts, analytics |

### Technology
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Show the tech/AI output RESULT — curiosity + wow factor |
| EDUCATION | Show the app/tool interface screenshot. Audience wants to see before learning |
| EARNING_AMOUNT | Show the tool + "FREE" badge or pricing |
| LISTICLE | Show app/tool icons for each item |
| URGENCY_NEWS | Add "New Launch" or "Update" badge |
| COMPARISON | Split-screen showing both tools' outputs |
| DEFAULT | Tech audience wants to SEE the tool working. Add screenshot or demo result |

### Spoken English
| Content Type | Smart Tip |
|---|---|
| EDUCATION | Show the 3 words/phrases ON the thumbnail itself. Learners want to preview |
| LISTICLE | Show words in big English text with Hindi below. Bilingual layout |
| CURIOSITY_HOOK | Add "Yeh Word Bol Diya Toh..." — social situation + confidence fear |
| EARNING_AMOUNT | "English Seekho = Better Salary". Show career upgrade angle |
| URGENCY_NEWS | Add "Interview Kal Hai?" or exam date — upcoming opportunity urgency |
| COMPARISON | Show wrong vs right pronunciation or usage. Before/after confidence |
| DEFAULT | 3-5 words shown + Hindi meaning. Keep it bilingual and simple |

### AI Tips and Tricks
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Show AI output that looks "impossible" — "Yeh AI Ne Banaya?!" wow factor |
| EDUCATION | Show ChatGPT/AI interface with a prompt = prompt engineering visual |
| EARNING_AMOUNT | Show "AI Se ₹X Kamao" with AI tool logo = freelance automation angle |
| LISTICLE | Show AI tool logos. "Top 5 Free AI Tools" needs recognizable icons |
| URGENCY_NEWS | Add "NEW AI Tool" badge or "GPT Update" — audience follows launches obsessively |
| COMPARISON | Show both AI tools' outputs side-by-side. Quality proof |
| DEFAULT | AI audience wants to see the MAGIC. Show AI output/result prominently |

### Government Schemes
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show exact benefit amount: "₹6,000/Saal" or "₹2 Lakh Loan" |
| CURIOSITY_HOOK | Add "Kya Aap Eligible Ho?" — "Am I missing free money?" anxiety |
| EDUCATION | Show official form/portal screenshot = step-by-step application guide |
| LISTICLE | Show benefit amounts for each scheme |
| URGENCY_NEWS | Add LAST DATE or "Registration Open" in red |
| COMPARISON | Show both schemes with benefit amounts and eligibility data |
| DEFAULT | WHO is eligible + HOW MUCH money. Add both |

### Sarkari Services
| Content Type | Smart Tip |
|---|---|
| EDUCATION | Show government portal/app interface = digital process walkthrough |
| CURIOSITY_HOOK | Add "Ghar Baithe Ho Jayega?" — "Can I really do this from home?" surprise |
| LISTICLE | Show document/service icons. "5 Services Online" needs portal screenshots |
| URGENCY_NEWS | Add "New Portal Launch" or "System Update" |
| COMPARISON | Show online vs offline process. Speed/convenience visual (5 min vs 5 hours) |
| DEFAULT | Step-by-step clarity. Show app/portal interface |

### Career
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show SALARY RANGE prominently (₹X - ₹Y/month). Decisions based on ROI |
| CURIOSITY_HOOK | Add "Kya Yeh Career Sahi Hai?" — "Am I choosing the right path?" anxiety |
| EDUCATION | Show career roadmap visual (Class 12 → Degree → Job) = clear path |
| LISTICLE | Show salary ranges per career |
| URGENCY_NEWS | Add "New Hiring" or "Placement Drive" with company logos |
| COMPARISON | Show both careers with salary, growth rate, and demand |
| DEFAULT | Salary data and clear career paths |

### Law
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Add the CONSEQUENCE: "₹X Fine" or "Y Saal Jail" — fear of punishment |
| EDUCATION | Show gavel or Constitution image with IPC/BNS section number |
| EARNING_AMOUNT | Show "₹X Ka Fine!" prominently (fine amounts or compensation) |
| LISTICLE | Show consequence severity for each law |
| URGENCY_NEWS | Add "New Law" or "Supreme Court Order" with date |
| COMPARISON | Show old vs new law or punishment comparison with section numbers |
| DEFAULT | Real case stories and consequences. Add fine/jail term |

### Secrets of India
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | STUNNING visual of secret location/fact + "99% Indians Don't Know" badge |
| EDUCATION | Historical imagery with "Real History" or "Puri Kahani" text = deep-dive |
| LISTICLE | Mind-blowing images for each secret. "5 Hidden Places" needs discovery photos |
| URGENCY_NEWS | Add "Just Discovered" or "New Finding" |
| COMPARISON | India vs World comparison. National pride imagery + surprising statistics |
| DEFAULT | Lives on SHOCK VALUE. Show most stunning visual + "99% Don't Know" hook |

### Skill-based Earning
| Content Type | Smart Tip |
|---|---|
| EARNING_AMOUNT | Show FINISHED PRODUCT + ₹ earned from it = proof of monetization |
| CURIOSITY_HOOK | Add "Yeh Skill Seekho, Life Set" — "Can this skill change my life?" hope |
| EDUCATION | Show hands doing the work (typing, designing, cooking) = craftsperson imagery |
| LISTICLE | Show earning ranges per skill with ₹/month data |
| URGENCY_NEWS | Add "Demand Badh Rahi Hai" or "Trending Skill 2026" = market opportunity |
| COMPARISON | Show both skills with earning potential and learning time |
| DEFAULT | Show the RESULT first, then the earning. Product + ₹ amount |

### Motivation
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Add personal struggle hook: "Sab Kuch Kho Diya..." — relatable pain |
| EDUCATION | Show transformation visual (struggle → success) = before-after life change |
| LISTICLE | Show powerful visuals per point |
| URGENCY_NEWS | Add "Aaj Se Shuru Karo" — "Start now" energy with date/deadline |
| COMPARISON | Show "successful vs unsuccessful" habits/mindset. Split-screen contrast |
| DEFAULT | Personal stories and transformation. Show emotion on face + struggle visual |

### Scams
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Show SCAM METHOD partially — "Yeh Message Aaya Toh..." = "Am I at risk?" fear |
| EDUCATION | Show scam screenshot/method with WARNING badge = recognition training |
| EARNING_AMOUNT | Show LOSS amount: "₹X Chori Ho Gaye!" — victim's loss |
| LISTICLE | Scam types with danger icons. "5 New Scams 2026" needs warning imagery |
| URGENCY_NEWS | Add "NEW SCAM Alert" in red with warning icon |
| COMPARISON | Show real vs fake side-by-side = spot-the-difference visual |
| DEFAULT | WARNING visuals and victim stories. Show loss amount + alert icon |

### Trending
| Content Type | Smart Tip |
|---|---|
| CURIOSITY_HOOK | Show viral image/moment + "Sachai Kya Hai?" = "What really happened?" |
| EDUCATION | Show news screenshot + "Matlab Kya Hai?" = explain the trend |
| EARNING_AMOUNT | Show how trend affects money: "₹X Ka Nuksan!" = financial impact |
| LISTICLE | Show trend moments/screenshots |
| URGENCY_NEWS | Add "BREAKING" or "ABHI KI NEWS" in red banner |
| COMPARISON | Show both sides of the trending debate = opinion vs reality |
| DEFAULT | TIMELY visuals. Show news/event screenshot + connect to viewer impact |

---

## 5. Category-Specific Visual Guidance

| Category | Ideal Visual Style |
|---|---|
| Earning Apps | Phone screens with earning proof, money visuals, app interface. Excited face |
| Finance | Calculator, money stacks, graphs going up, comparison visuals. Serious face with pointing gesture |
| Business | Shop/store setup, product images, before-after transformation. Confident face |
| Astrology | Zodiac symbols, celestial imagery, kundli charts, mystical backgrounds. Mysterious expression. No money imagery |
| Devotion | Temple imagery, deity illustrations, diyas, spiritual symbols. Serene/respectful face. Reverent, not flashy |
| Government Jobs | Official buildings, exam papers, badge/uniform, ID card visuals. Serious face. No ₹ signs |
| YT/IG Mastery | Phone with social media screens, follower counts, growth graphs. Excited face pointing at numbers |
| Technology | Gadgets, AI visuals, futuristic graphics, screen interfaces. Curious/amazed face |
| Spoken English | Speech bubbles, microphone, confident speaking pose, before-after fluency |
| AI Tips and Tricks | AI interface, robot/tech graphics, ChatGPT-style screens. Mind-blown face |
| Government Schemes | Official forms, Aadhaar/documents, government building. Helpful face |
| Sarkari Services | Application forms, CSC center, mobile gov portal. Informative face |
| Career | Office environment, laptop, interview setting, growth chart. Professional face |
| Law | Gavel, court, legal documents, Constitution imagery. Authoritative face |
| Secrets of India | Stunning India locations, monuments, hidden places, aerial views. Amazed face. Mystery vibe |
| Skill-based Earning | Tools/equipment of the skill, workspace, hands doing work. Determined face |
| Motivation | Before-after transformation, success symbols, powerful visual metaphors. Intense face |
| Scams | Warning signs, broken phone, fake messages, shield icons. Worried/alert face |
| Trending | News-style graphics, trending arrows, social media buzz. Surprised face |

---

## 6. Design Scoring Rubric

### Design Quality (75 points)
| Check | Points | What It Means |
|---|---|---|
| Text Readable | 20 | All text readable at small mobile thumbnail size (150×100px) |
| High Contrast | 15 | Text stands out clearly from background |
| Bold Font | 10 | Bold thick font used for key text |
| Clean Layout | 10 | Uncluttered with clear visual hierarchy |
| Word Count ≤ 7 | 8 | 7 or fewer words on thumbnail |
| Face Visible | 7 | Human face clearly visible |
| Hindi Text | 5 | Text is Hindi/Hinglish, not pure English |

### Category Fit (25 points)
| Element | Boost Points | Hurt Penalty |
|---|---|---|
| ₹ Rupee symbol | +8 | −8 |
| Specific number | +7 | −7 |
| Question mark (?) | +5 | −5 |
| Exclamation mark (!) | +5 | −5 |
| Element correctly absent (when it hurts) | +3 | — |

### Verdict Thresholds
| Score | Verdict | Meaning |
|---|---|---|
| ≥ 70 | **PUBLISH** | Ready to use |
| 45–69 | **REVISE** | Needs improvements |
| < 45 | **REDESIGN** | Start over |

---

## 7. Thumbnail Prompt Generation Rules

When generating an AI image prompt for a redesigned thumbnail, the following rules apply:

1. Describe the FINAL IMAGE, not steps to create it
2. No tool references (Unsplash, Canva, Photoshop, etc.)
3. No layer-by-layer instructions (no "apply overlay", "gaussian blur")
4. Must include: exact background with hex codes, person details (gender, ethnicity, position, expression, gesture, clothing, % of frame), exact Hindi/Hinglish text with position/size/color/font weight, every icon/symbol/object/badge with position/size/color, color palette with hex codes, eye flow sequence (FIRST → SECOND → THIRD)
5. Aspect ratio: 16:9 (1280×720 pixels)
6. Text on thumbnail: max 5–7 words in Hindi/Hinglish
7. One detailed flowing paragraph — not bullet points
8. Positions described using: left-third, center, right-third grid
