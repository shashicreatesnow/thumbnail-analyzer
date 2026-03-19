// ══════════════════════════════════════════════════════════════
// GEMINI API — Thumbnail Analysis via Serverless Proxy
// API key is stored server-side, never exposed to the browser
// ══════════════════════════════════════════════════════════════

import { classifyTitleContent, getSmartRule, getSmartTip, CATEGORY_VISUAL_GUIDANCE } from './research-engine.js';

export async function analyzeThumbnail(imageBase64, title, category, script) {
  const contentType = classifyTitleContent(title);

  // Build smart category guidance
  let catGuidance = `\n\nSMART CATEGORY RULES FOR "${category}" (Content Type: ${contentType}):\n`;

  const elements = ['question', 'rupee', 'number', 'exclaim'];
  const elementLabels = {
    question: '? (Question mark)',
    rupee: '₹ (Rupee symbol)',
    number: 'Specific numbers',
    exclaim: '! (Exclamation)'
  };

  for (const el of elements) {
    const smartRule = getSmartRule(el, category, contentType, title);
    const action = smartRule.rule === 'boost' ? 'SHOULD HAVE' : (smartRule.rule === 'hurts' ? 'SHOULD NOT HAVE' : 'OPTIONAL');
    catGuidance += `- ${elementLabels[el]}: ${action} — ${smartRule.reason}\n`;
  }

  const smartTip = getSmartTip(category, contentType, title);
  if (smartTip) catGuidance += `\nSMART TIP: ${smartTip}\n`;

  // Script context
  let scriptContext = '';
  if (script && script.length > 20) {
    const hookLine = script.split(/[\n.!?]/).filter(s => s.trim().length > 10)[0] || script.substring(0, 100);
    scriptContext = `\n\n═══════════════════════════════════════════════════════════════
VIDEO SCRIPT CONTEXT (use this to make thumbnail match the video):
═══════════════════════════════════════════════════════════════

VIDEO HOOK/OPENING LINE: "${hookLine.trim().substring(0, 200)}"

SCRIPT PREVIEW (first 500 chars): ${script.substring(0, 500)}

SCRIPT-AWARE THUMBNAIL RULES:
1. The thumbnail text overlay MUST relate to the script's hook/opening line
2. Visual elements should represent the core message of the script
3. If the script mentions a specific number (₹50,000, 5 tips, etc.), use it in the thumbnail
4. Match the emotional tone of the script (surprise, authority, urgency, etc.)
5. The thumbnail should make viewers want to hear THIS specific story/information
6. Add a JSON field "suggested_text_overlay" with the best 3-5 word Hindi/Hinglish text for the thumbnail based on the script hook
7. Add a JSON field "script_thumbnail_alignment" rating 1-10 how well the current thumbnail matches the script`;
  }

  const catImageGuide = CATEGORY_VISUAL_GUIDANCE[category] || "Use category-relevant imagery that creates an emotional response.";

  const prompt = `You are an expert thumbnail designer for Indian short-form video apps (YouTube Shorts, Instagram Reels, EloElo). You design for tier 2/3 Hindi-speaking Indian audience.

THUMBNAIL CONTEXT:
- Category: "${category || 'Unknown'}"
- Topic (shown on TOP of thumbnail): "${title}"
- Video Title (shown in CENTER of thumbnail): "${title}"
- Detected Content Type: ${contentType}

VISUAL STYLE FOR THIS CATEGORY: ${catImageGuide}
${catGuidance}
${scriptContext}
Analyze this thumbnail image and return ONLY a JSON object with these exact keys (no markdown, no explanation):

{
  "has_rupee": false,
  "has_number": false,
  "has_timeframe": false,
  "has_question": false,
  "has_exclaim": false,
  "text_readable": true,
  "word_count_ok": true,
  "hindi_text": false,
  "high_contrast": true,
  "face_visible": false,
  "bold_font": true,
  "clean_layout": true,
  "text_on_thumbnail": "",
  "dominant_colors": "",
  "bg_type": "",
  "color_score": "",
  "focal_point": "",
  "face_expression": "",
  "visual_flow": "",
  "text_placement": "",
  "brand_consistency": "",
  "scroll_stop_power": "",
  "design_fix_1": "",
  "design_fix_2": "",
  "design_fix_3": "",
  "overall_impression": "",
  "complete_thumbnail_feedback": "",
  "suggested_text_overlay": "",
  "script_thumbnail_alignment": 0
}

DETECTION FIELDS (true/false) — what IS on the thumbnail:
has_rupee: ₹ or Rs with amount visible
has_number: specific number visible (5, 10, 1000 etc)
has_timeframe: Daily/Monthly/Weekly/Roz/Mahine visible
has_question: question mark ? visible
has_exclaim: exclamation mark ! visible
text_readable: all text readable at small mobile thumbnail size (150x100px)
word_count_ok: 7 or fewer words on thumbnail
hindi_text: text is Hindi/Hinglish not pure English
high_contrast: text stands out clearly from background
face_visible: human face clearly visible
bold_font: bold thick font used for key text
clean_layout: uncluttered with clear visual hierarchy

ANALYSIS FIELDS:
text_on_thumbnail: exact text visible on the image
dominant_colors: 2-3 main colors (e.g. "red, black, yellow")
bg_type: "solid color", "gradient", "photo", "illustration", "blurred photo", "pattern"
color_score: "strong", "average", "weak"
focal_point: what the eye is drawn to first
face_expression: describe expression and energy, or "no face"
visual_flow: "strong", "average", "weak"
text_placement: where text is placed and how it works with the layout
brand_consistency: "professional", "decent", "amateur"
scroll_stop_power: "high", "medium", "low"

DESIGN FIXES:
design_fix_1: most impactful improvement
design_fix_2: second most impactful improvement
design_fix_3: third improvement

overall_impression: 1 sentence on current quality + single biggest improvement needed.

═══════════════════════════════════════════════════════════════
CRITICAL — "complete_thumbnail_feedback" FIELD:
═══════════════════════════════════════════════════════════════

This is the MOST IMPORTANT field. Write a COMPLETE, DETAILED description of the PERFECT version of this thumbnail.
This text will be DIRECTLY fed into an AI image generator as a prompt. It must produce a perfect thumbnail in ONE attempt.

RULES FOR THIS FIELD:
1. Describe the FINAL IMAGE as it should look — NOT steps to create it
2. DO NOT mention Unsplash, Pexels, Canva, Figma, Photoshop, or any external tools
3. DO NOT use layer-by-layer instructions (no "apply overlay", "gaussian blur", "opacity %")
4. DO NOT say "search for" or "find a stock photo of" — just describe what should be in the image
5. MUST include every visual detail an AI image generator needs:
   - Exact background scene/environment/color with hex codes
   - Person details: gender, ethnicity (Indian), position (left-third/center/right-third), expression, gesture, clothing, size (% of frame)
   - EXACT Hindi/Hinglish text to display on the thumbnail, its position, size relative to frame, color with hex code, font weight
   - Every icon, symbol, object, badge — what it looks like, exact position, size, color
   - Color palette with hex codes for every color used
   - Eye flow: what viewer sees FIRST → SECOND → THIRD
6. MUST respect the SMART CATEGORY RULES above (context-aware, not blanket rules)
7. Text on thumbnail must be max 5-7 words in Hindi/Hinglish
8. MUST describe the aspect ratio as 16:9 (1280x720 pixels)
9. Write as ONE detailed flowing paragraph — not bullet points or sections
10. Be extremely specific about positions using left-third, center, right-third grid
11. Include the suggested shortened/improved title text if current one is too long
12. Every element must have: WHAT it is, WHERE it goes, HOW BIG it is, WHAT COLOR it is

ONLY output the JSON. Nothing else.`;

  // Call serverless proxy (API key stays server-side)
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, imageBase64 })
  });

  const respJson = await response.json();

  if (respJson.error) throw new Error('Analysis failed: ' + respJson.error);

  // Parse the Gemini response
  const parts = respJson.candidates[0].content.parts;
  let fullText = '';
  for (const part of parts) {
    if (part.text) fullText += part.text + '\n';
  }

  let cleaned = fullText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No valid JSON in response. First 300 chars: ' + fullText.substring(0, 300));
  }

  let jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
  jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  return JSON.parse(jsonStr);
}
