// ══════════════════════════════════════════════════════════════
// MAIN.JS — Thumbnail Analyzer App Orchestration
// ══════════════════════════════════════════════════════════════

import { getAllCategories, calculateScore, classifyTitleContent, buildDesignChecklist } from './src/research-engine.js';
import { analyzeThumbnail } from './src/gemini-api.js';
import { fileToBase64, pasteToBase64, resizeImage, createPreviewUrl } from './src/image-utils.js';
import { saveAnalysis, loadHistory, loadAllHistory, loadGuildFeed, loadAnalysis, clearAllHistory, deleteAnalysis, signInWithGoogle, signOut, getCurrentUser, onAuthChange } from './src/supabase.js';
import { generateReport } from './src/pdf-export.js';

// ── State ──
let currentImageBase64 = null;
let analysisHistory = [];
let currentUser = null;
let currentTheme = localStorage.getItem('notion_theme') || 'light';

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  populateCategories();
  setupDropZone();
  setupAnalyzeButton();
  setupHistory();
  setupEditReanalyze();
  setupAuth();
  setupProfileModal();

  // Menu Toggle
  document.getElementById('menu-toggle-btn').addEventListener('click', () => {
    const sidebar = document.querySelector('.gmail-sidebar');
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-open');
      sidebar.classList.remove('collapsed');
    } else {
      sidebar.classList.toggle('collapsed');
      sidebar.classList.remove('mobile-open');
    }
  });

  // "New Analysis" Button — clears form and switches to input view
  document.getElementById('analyze-new-btn').addEventListener('click', () => {
    closeMobileSidebar();
    showView('input');
    document.getElementById('title-input').value = '';
    document.getElementById('script-input').value = '';
    document.getElementById('category-select').value = '';
    currentImageBase64 = null;
    document.getElementById('drop-placeholder').style.display = 'block';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('clear-image').style.display = 'none';
    updateAnalyzeButton();
  });

  // Dashboard nav button
  document.getElementById('nav-dashboard-btn').addEventListener('click', () => {
    closeMobileSidebar();
    showView('dashboard');
    renderDashboard();
  });

  // Guild nav button
  document.getElementById('nav-guild-btn').addEventListener('click', () => {
    closeMobileSidebar();
    showView('guild');
    renderGuild();
  });

  // PDF download button
  document.getElementById('download-pdf-btn').addEventListener('click', () => downloadPDF());

  setupCopyPrompt();
  updateAnalyzeButton();

  // Render initial empty state — onAuthChange (in setupAuth) will
  // load history once auth state is resolved, avoiding duplicate loads
  renderHistory();
});

// ══════════════════════════════════════════════════════════════
// CATEGORY DROPDOWN
// ══════════════════════════════════════════════════════════════
function populateCategories() {
  const select = document.getElementById('category-select');
  for (const cat of getAllCategories()) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  }
  // Apply saved default category
  const savedDefault = localStorage.getItem('default_category');
  if (savedDefault) select.value = savedDefault;

  select.addEventListener('change', updateAnalyzeButton);
}

// ══════════════════════════════════════════════════════════════
// DROP ZONE — Drag/Drop/Paste/Browse
// ══════════════════════════════════════════════════════════════
function setupDropZone() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const preview = document.getElementById('image-preview');
  const placeholder = document.getElementById('drop-placeholder');
  const clearBtn = document.getElementById('clear-image');

  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files?.[0]) await handleImageFile(e.target.files[0]);
  });

  // Drag events
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await handleImageFile(file);
  });

  // Paste (Ctrl+V)
  document.addEventListener('paste', async (e) => {
    const base64 = await pasteToBase64(e);
    if (base64) {
      currentImageBase64 = await resizeImage(base64);
      showImagePreview(currentImageBase64);
      updateAnalyzeButton();
    }
  });

  // Clear image
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageBase64 = null;
    preview.style.display = 'none';
    preview.src = '';
    placeholder.style.display = 'block';
    clearBtn.style.display = 'none';
    fileInput.value = '';
    updateAnalyzeButton();
  });

  document.getElementById('title-input').addEventListener('input', updateAnalyzeButton);
}

async function handleImageFile(file) {
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('Image too large — max 10MB', 'error');
    return;
  }
  try {
    const base64 = await fileToBase64(file);
    currentImageBase64 = await resizeImage(base64);
    showImagePreview(currentImageBase64);
    updateAnalyzeButton();
  } catch (err) {
    showToast('Failed to load image: ' + err.message, 'error');
  }
}

function showImagePreview(base64) {
  const preview = document.getElementById('image-preview');
  const placeholder = document.getElementById('drop-placeholder');
  const clearBtn = document.getElementById('clear-image');
  preview.src = createPreviewUrl(base64);
  preview.style.display = 'block';
  placeholder.style.display = 'none';
  clearBtn.style.display = 'flex';
}

// ══════════════════════════════════════════════════════════════
// ANALYZE BUTTON — with disabled tooltip
// ══════════════════════════════════════════════════════════════
function updateAnalyzeButton() {
  const btn = document.getElementById('analyze-btn');
  const hasImage = !!currentImageBase64;
  const hasTitle = document.getElementById('title-input').value.trim().length > 0;
  const hasCat = document.getElementById('category-select').value !== '';
  const isReady = hasImage && hasTitle && hasCat;

  btn.disabled = !isReady;

  // Show tooltip explaining why button is disabled
  if (!isReady) {
    const missing = [];
    if (!hasImage) missing.push('upload an image');
    if (!hasTitle) missing.push('enter a title');
    if (!hasCat) missing.push('select a category');
    btn.title = 'To start: ' + missing.join(', ');
  } else {
    btn.title = 'Analyze this thumbnail';
  }
}

function setupAnalyzeButton() {
  document.getElementById('analyze-btn').addEventListener('click', runAnalysis);
}

async function runAnalysis() {
  const btn = document.getElementById('analyze-btn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');

  const title = document.getElementById('title-input').value.trim();
  const category = document.getElementById('category-select').value;
  const script = document.getElementById('script-input').value.trim();

  if (!currentImageBase64 || !title || !category) return;

  // Show loading
  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';

  try {
    const analysis = await analyzeThumbnail(currentImageBase64, title, category, script);
    const scoreData = calculateScore(analysis, category, title);
    renderResults(analysis, scoreData, title, category, currentImageBase64);
    await saveToHistoryDB(analysis, scoreData, title, category);
    showToast('Analysis complete!', 'success');
  } catch (err) {
    showToast('Analysis failed: ' + err.message, 'error');
    console.error('Analysis error:', err);
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline-flex';
    btnLoading.style.display = 'none';
    updateAnalyzeButton();
  }
}

// ══════════════════════════════════════════════════════════════
// EDIT & RE-ANALYZE — go back to form without clearing
// ══════════════════════════════════════════════════════════════
function setupEditReanalyze() {
  document.getElementById('edit-reanalyze-btn').addEventListener('click', () => {
    showView('input');
    document.getElementById('title-input').focus();
    // Keep image, title, category — user can tweak and re-analyze
  });
}

// ══════════════════════════════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════════════════════════════
function renderResults(analysis, scoreData, title, category, imageBase64) {
  showView('results');
  const section = document.getElementById('results-section');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Show the analyzed thumbnail (small preview)
  const resultImg = document.getElementById('result-thumbnail-img');
  if (imageBase64) {
    resultImg.src = createPreviewUrl(imageBase64);
    resultImg.style.display = 'block';
  } else {
    resultImg.style.display = 'none';
  }

  // Title
  const threadTitle = document.getElementById('result-subject-title');
  if (threadTitle) threadTitle.textContent = title ? `Analysis: ${title}` : 'Analysis Results';

  // 1. Score Ring (delay to let scroll finish)
  setTimeout(() => animateScoreRing(scoreData.totalScore), 400);

  // 2. Verdict Badge
  const verdictBadge = document.getElementById('verdict-badge');
  verdictBadge.textContent = scoreData.verdict;
  verdictBadge.className = 'verdict-badge verdict-' + scoreData.verdict.toLowerCase();

  // Content Type Badge
  document.getElementById('content-type-badge').textContent = scoreData.contentType;

  // 3. Score Breakdown
  const designPercent = Math.round((scoreData.designScore / 75) * 100);
  const catPercent = Math.max(0, Math.round((scoreData.catScore / 25) * 100));
  document.getElementById('design-bar').style.width = designPercent + '%';
  document.getElementById('design-score').textContent = scoreData.designScore + '/75';
  const catBar = document.getElementById('cat-bar');
  catBar.style.width = catPercent + '%';
  catBar.className = 'breakdown-fill cat-fill' + (scoreData.catScore < 0 ? ' negative' : '');
  document.getElementById('cat-score').textContent = (scoreData.catScore >= 0 ? '+' : '') + scoreData.catScore + '/25';

  // 4. Detected Text
  document.getElementById('detected-text').textContent = analysis.text_on_thumbnail || 'No text detected';

  // 5. Design Checklist
  const checklist = document.getElementById('design-checklist');
  checklist.innerHTML = '';
  for (const item of buildDesignChecklist(analysis)) {
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.innerHTML = `
      <span class="check-icon ${item.pass ? 'check-pass' : 'check-fail'}">${item.pass ? '✓' : '✗'}</span>
      <span>${item.label}</span>
    `;
    checklist.appendChild(div);
  }

  // 6. Category Warnings & Tips
  const warningsTips = document.getElementById('warnings-tips');
  warningsTips.innerHTML = '';
  if (scoreData.catWarnings.length === 0 && scoreData.catTips.length === 0) {
    const noIssues = document.createElement('div');
    noIssues.className = 'no-issues';
    noIssues.textContent = `Good fit for ${category} (${scoreData.contentType} content)`;
    warningsTips.appendChild(noIssues);
  } else {
    for (const w of scoreData.catWarnings) {
      const div = document.createElement('div');
      div.className = 'warning-item';
      div.textContent = w;
      warningsTips.appendChild(div);
    }
    for (const t of scoreData.catTips) {
      const div = document.createElement('div');
      div.className = 'tip-item';
      div.textContent = t;
      warningsTips.appendChild(div);
    }
  }

  // 7. Design Fixes
  const fixesList = document.getElementById('design-fixes');
  fixesList.innerHTML = '';
  const fixes = [analysis.design_fix_1, analysis.design_fix_2, analysis.design_fix_3].filter(Boolean);
  if (fixes.length === 0) {
    fixesList.innerHTML = '<li>No major design issues found</li>';
  } else {
    for (const fix of fixes) {
      const li = document.createElement('li');
      li.textContent = fix;
      fixesList.appendChild(li);
    }
  }

  // 8. Visual Analysis
  const visualAnalysis = document.getElementById('visual-analysis');
  visualAnalysis.innerHTML = '';
  const chips = [
    { label: 'BG', value: analysis.bg_type },
    { label: 'Focus', value: analysis.focal_point },
    { label: 'Text', value: analysis.text_placement },
    { label: 'Flow', value: analysis.visual_flow },
    { label: 'Colors', value: analysis.color_score }
  ];
  for (const c of chips) {
    if (c.value) {
      const span = document.createElement('span');
      span.className = 'chip';
      const labelSpan = document.createElement('span');
      labelSpan.className = 'chip-label';
      labelSpan.textContent = c.label + ':';
      const valueSpan = document.createElement('span');
      valueSpan.className = 'chip-value';
      valueSpan.textContent = c.value;
      span.appendChild(labelSpan);
      span.appendChild(valueSpan);
      visualAnalysis.appendChild(span);
    }
  }

  // 9. Impact & Scroll-Stop Power
  const impactSection = document.getElementById('impact-section');
  impactSection.innerHTML = '';
  const ssp = (analysis.scroll_stop_power || 'medium').toLowerCase();
  const gaugeClass = ssp === 'high' ? 'gauge-high' : ssp === 'low' ? 'gauge-low' : 'gauge-medium';

  const gaugeDiv = document.createElement('div');
  gaugeDiv.className = 'impact-gauge';
  const gaugeLabel = document.createElement('span');
  gaugeLabel.className = 'gauge-label';
  gaugeLabel.textContent = 'Scroll-Stop';
  const gaugeBar = document.createElement('div');
  gaugeBar.className = 'gauge-bar';
  const gaugeFill = document.createElement('div');
  gaugeFill.className = 'gauge-fill ' + gaugeClass;
  gaugeBar.appendChild(gaugeFill);
  const gaugeText = document.createElement('span');
  gaugeText.className = 'gauge-text ' + ssp;
  gaugeText.textContent = ssp.toUpperCase();
  gaugeDiv.appendChild(gaugeLabel);
  gaugeDiv.appendChild(gaugeBar);
  gaugeDiv.appendChild(gaugeText);
  impactSection.appendChild(gaugeDiv);

  if (analysis.face_expression && analysis.face_expression !== 'no face') {
    const faceDetail = document.createElement('div');
    faceDetail.className = 'impact-detail';
    faceDetail.textContent = 'Face: ' + analysis.face_expression;
    impactSection.appendChild(faceDetail);
  }
  if (analysis.brand_consistency) {
    const qualityDetail = document.createElement('div');
    qualityDetail.className = 'impact-detail';
    qualityDetail.textContent = 'Quality: ' + analysis.brand_consistency;
    impactSection.appendChild(qualityDetail);
  }

  // 10. Colors & Impression
  const colorsImpression = document.getElementById('colors-impression');
  colorsImpression.innerHTML = '';
  if (analysis.dominant_colors) {
    const colorNames = analysis.dominant_colors.split(',').map(c => c.trim());
    const swatchesDiv = document.createElement('div');
    swatchesDiv.className = 'color-swatches';
    for (const name of colorNames) {
      const cssColor = getCSSColor(name);
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.background = cssColor;
      swatch.title = name;
      swatchesDiv.appendChild(swatch);
      const label = document.createElement('span');
      label.className = 'color-label';
      label.textContent = name;
      swatchesDiv.appendChild(label);
    }
    colorsImpression.appendChild(swatchesDiv);
  }
  if (analysis.overall_impression) {
    const p = document.createElement('p');
    p.className = 'impression-text';
    p.textContent = analysis.overall_impression;
    colorsImpression.appendChild(p);
  }

  // 11. Thumbnail Prompt
  document.getElementById('thumbnail-prompt').textContent = analysis.complete_thumbnail_feedback || 'No feedback generated';

  // Animate result cards in with stagger
  const cards = section.querySelectorAll('.result-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = (i * 0.08) + 's';
    card.classList.add('card-enter');
  });
}

// ══════════════════════════════════════════════════════════════
// SCORE RING ANIMATION
// ══════════════════════════════════════════════════════════════
function animateScoreRing(score) {
  const circle = document.getElementById('score-ring-fill');
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  let color;
  if (score >= 70) color = 'var(--gm-success)';
  else if (score >= 45) color = 'var(--gm-warning)';
  else color = 'var(--gm-danger)';

  circle.style.stroke = color;
  circle.style.strokeDasharray = circumference;

  // Reset then animate
  circle.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = offset;
    });
  });

  const valueEl = document.getElementById('score-value');
  animateCounter(valueEl, 0, score, 1200);
  valueEl.style.color = color;
}

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ══════════════════════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════════════════════
function applyTheme(theme) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleBtn.textContent = 'light_mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    toggleBtn.textContent = 'dark_mode';
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('notion_theme', currentTheme);
  applyTheme(currentTheme);
}

function setupTheme() {
  applyTheme(currentTheme);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

// ══════════════════════════════════════════════════════════════
// AUTH — Google Sign-In via Supabase
// ══════════════════════════════════════════════════════════════
function setupAuth() {
  const avatarBtn = document.getElementById('avatar-btn');
  const dropdown = document.getElementById('profile-dropdown');
  const googleBtn = document.getElementById('google-signin-btn');
  const signoutBtn = document.getElementById('signout-btn');

  // Toggle dropdown on avatar click
  avatarBtn.addEventListener('click', () => {
    dropdown.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.avatar-container')) {
      dropdown.classList.remove('open');
    }
  });

  // Google sign-in button
  googleBtn.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      showToast('Sign-in failed: ' + err.message, 'error');
    }
  });

  // Sign-out button
  signoutBtn.addEventListener('click', async () => {
    try {
      await signOut();
      dropdown.classList.remove('open');
      showToast('Signed out', 'info');
    } catch (err) {
      showToast('Sign-out failed: ' + err.message, 'error');
    }
  });

  // Listen for auth state changes (sign-in, sign-out, token refresh)
  onAuthChange(async (user) => {
    currentUser = user;
    if (user) {
      updateUIForSignedIn(user);
      try {
        analysisHistory = await loadHistory();
      } catch (err) {
        console.warn('Failed to load history:', err.message);
      }
    } else {
      updateUIForSignedOut();
      analysisHistory = [];
    }
    renderHistory();
  });
}

function updateUIForSignedIn(user) {
  const avatarLetter = document.getElementById('avatar-letter');
  const avatarImg = document.getElementById('avatar-img');
  const profilePic = document.getElementById('profile-pic');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');

  // Show Google profile pic in avatar
  const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  if (photoUrl) {
    avatarImg.src = photoUrl;
    avatarImg.style.display = 'block';
    avatarLetter.style.display = 'none';
    profilePic.src = photoUrl;
  } else {
    const initial = (user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase();
    avatarLetter.textContent = initial;
    avatarLetter.style.display = '';
    avatarImg.style.display = 'none';
    profilePic.src = '';
  }

  profileName.textContent = user.user_metadata?.full_name || 'User';
  profileEmail.textContent = user.email || '';

  // Toggle dropdown states
  document.getElementById('dropdown-signed-out').style.display = 'none';
  document.getElementById('dropdown-signed-in').style.display = 'block';
}

function updateUIForSignedOut() {
  const avatarLetter = document.getElementById('avatar-letter');
  const avatarImg = document.getElementById('avatar-img');

  avatarLetter.textContent = 'U';
  avatarLetter.style.display = '';
  avatarImg.style.display = 'none';

  document.getElementById('dropdown-signed-out').style.display = 'block';
  document.getElementById('dropdown-signed-in').style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
// PROFILE MODAL
// ══════════════════════════════════════════════════════════════
function setupProfileModal() {
  const overlay = document.getElementById('profile-modal-overlay');
  const modalCategorySelect = document.getElementById('modal-default-category');

  // Populate the modal's default category dropdown
  for (const cat of getAllCategories()) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    modalCategorySelect.appendChild(opt);
  }
  const savedCat = localStorage.getItem('default_category');
  if (savedCat) modalCategorySelect.value = savedCat;

  // Open modal from "View Profile" button in dropdown
  document.getElementById('view-profile-btn').addEventListener('click', () => {
    document.getElementById('profile-dropdown').classList.remove('open');
    openProfileModal();
  });

  // Close modal — X button, footer Close, backdrop click, ESC key
  document.getElementById('profile-modal-close').addEventListener('click', closeProfileModal);
  document.getElementById('modal-close-btn').addEventListener('click', closeProfileModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProfileModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeProfileModal();
  });

  // Sign out from modal
  document.getElementById('modal-signout-btn').addEventListener('click', async () => {
    try {
      await signOut();
      closeProfileModal();
      showToast('Signed out', 'info');
    } catch (err) {
      showToast('Sign-out failed: ' + err.message, 'error');
    }
  });

  // Theme toggle in modal
  document.getElementById('modal-theme-toggle').addEventListener('click', () => {
    toggleTheme();
    syncModalThemeButton();
  });

  // Default category setting
  modalCategorySelect.addEventListener('change', () => {
    const val = modalCategorySelect.value;
    if (val) {
      localStorage.setItem('default_category', val);
    } else {
      localStorage.removeItem('default_category');
    }
    // Sync the main form's category dropdown
    document.getElementById('category-select').value = val;
    updateAnalyzeButton();
    showToast(val ? 'Default category saved' : 'Default category cleared', 'info');
  });
}

function openProfileModal() {
  if (!currentUser) return;

  const overlay = document.getElementById('profile-modal-overlay');

  // Fill profile data
  const photoUrl = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture;
  document.getElementById('modal-avatar').src = photoUrl || '';
  document.getElementById('modal-name').textContent = currentUser.user_metadata?.full_name || 'User';
  document.getElementById('modal-email').textContent = currentUser.email || '';

  // Member since date
  const sinceEl = document.getElementById('modal-since');
  if (currentUser.created_at) {
    const date = new Date(currentUser.created_at);
    sinceEl.textContent = 'Member since ' + date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } else {
    sinceEl.textContent = '';
  }

  // Compute and fill stats
  const stats = computeStats();
  document.getElementById('modal-stat-total').textContent = stats.total;
  document.getElementById('modal-stat-avg').textContent = stats.avgScore;
  document.getElementById('modal-stat-best').textContent = stats.bestScore;
  document.getElementById('modal-stat-category').textContent = stats.topCategory;

  // Sync theme button label
  syncModalThemeButton();

  // Show modal
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
  document.getElementById('profile-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function syncModalThemeButton() {
  const label = document.getElementById('modal-theme-label');
  const icon = document.querySelector('#modal-theme-toggle .material-symbols-outlined');
  if (currentTheme === 'dark') {
    label.textContent = 'Light Mode';
    icon.textContent = 'light_mode';
  } else {
    label.textContent = 'Dark Mode';
    icon.textContent = 'dark_mode';
  }
}

function computeStats() {
  const total = analysisHistory.length;
  if (total === 0) return { total: 0, avgScore: 0, bestScore: 0, topCategory: '\u2014' };

  const scores = analysisHistory.map(e => e.total_score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);
  const bestScore = Math.max(...scores);

  // Find most-used category
  const catCounts = {};
  for (const e of analysisHistory) {
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  }
  const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted.length > 0 ? sorted[0][0] : '\u2014';

  return { total, avgScore, bestScore, topCategory };
}

// ══════════════════════════════════════════════════════════════
// VIEW SWITCHING
// ══════════════════════════════════════════════════════════════
function showView(viewName) {
  const views = ['input-section', 'results-section', 'dashboard-section', 'guild-section'];
  for (const id of views) {
    document.getElementById(id).style.display = 'none';
  }

  const navBtns = document.querySelectorAll('.sidebar-nav-btn');
  navBtns.forEach(btn => btn.classList.remove('active'));

  switch (viewName) {
    case 'input':
      document.getElementById('input-section').style.display = 'block';
      break;
    case 'results':
      document.getElementById('results-section').style.display = 'block';
      break;
    case 'dashboard':
      document.getElementById('dashboard-section').style.display = 'block';
      document.getElementById('nav-dashboard-btn').classList.add('active');
      break;
    case 'guild':
      document.getElementById('guild-section').style.display = 'block';
      document.getElementById('nav-guild-btn').classList.add('active');
      break;
  }
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
async function renderDashboard() {
  const grid = document.getElementById('dashboard-grid');

  if (!currentUser) {
    grid.innerHTML = `
      <div class="dashboard-empty">
        <span class="material-symbols-outlined">account_circle</span>
        <p>Sign in to see your dashboard</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = `
    <div class="dashboard-empty">
      <span class="material-symbols-outlined">hourglass_top</span>
      <p>Loading your analyses...</p>
    </div>
  `;

  try {
    const allAnalyses = await loadAllHistory();

    // Update stats
    if (allAnalyses.length > 0) {
      const scores = allAnalyses.map(a => a.total_score);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const best = Math.max(...scores);
      const catCounts = {};
      for (const a of allAnalyses) {
        catCounts[a.category] = (catCounts[a.category] || 0) + 1;
      }
      const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      document.getElementById('dash-stat-total').textContent = allAnalyses.length;
      document.getElementById('dash-stat-avg').textContent = avg;
      document.getElementById('dash-stat-best').textContent = best;
      document.getElementById('dash-stat-category').textContent = sorted.length > 0 ? sorted[0][0] : '\u2014';
    } else {
      document.getElementById('dash-stat-total').textContent = '0';
      document.getElementById('dash-stat-avg').textContent = '0';
      document.getElementById('dash-stat-best').textContent = '0';
      document.getElementById('dash-stat-category').textContent = '\u2014';
    }

    if (allAnalyses.length === 0) {
      grid.innerHTML = `
        <div class="dashboard-empty">
          <span class="material-symbols-outlined">image_search</span>
          <p>No analyses yet</p>
          <p style="font-size:12px;margin-top:4px;">Upload a thumbnail to get started</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    for (const entry of allAnalyses) {
      const card = document.createElement('div');
      card.className = 'dashboard-card';

      const verdictClass = (entry.verdict || '').toLowerCase();
      const date = entry.created_at
        ? new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : '';

      const thumbHtml = entry.image_base64 && entry.image_base64.length > 100
        ? `<img class="dashboard-card-thumb" src="${createPreviewUrl(entry.image_base64)}" alt="Thumbnail" loading="lazy" />`
        : `<div class="dashboard-card-thumb-placeholder"><span class="material-symbols-outlined">image</span></div>`;

      card.innerHTML = `
        ${thumbHtml}
        <div class="dashboard-card-body">
          <div class="dashboard-card-title">${escapeHtml(entry.title || 'Untitled')}</div>
          <div class="dashboard-card-meta">
            <span class="dashboard-card-score ${verdictClass}">${entry.total_score}</span>
            <span class="dashboard-card-verdict ${verdictClass}">${entry.verdict || ''}</span>
            <span class="dashboard-card-date">${date}</span>
          </div>
          <div class="dashboard-card-category">${escapeHtml(entry.category || '')}</div>
        </div>
      `;

      card.addEventListener('click', async () => {
        try {
          const full = await loadAnalysis(entry.id);
          const scoreData = {
            totalScore: full.total_score,
            designScore: full.design_score,
            catScore: full.cat_score,
            verdict: full.verdict,
            contentType: full.content_type,
            catWarnings: full.cat_warnings || [],
            catTips: full.cat_tips || [],
            designBreakdown: full.design_breakdown || []
          };
          showView('results');
          renderResults(full.analysis, scoreData, full.title, full.category, full.image_base64);
        } catch (err) {
          showToast('Failed to load analysis: ' + err.message, 'error');
        }
      });

      grid.appendChild(card);
    }
  } catch (err) {
    grid.innerHTML = `
      <div class="dashboard-empty">
        <span class="material-symbols-outlined">error</span>
        <p>Failed to load: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ══════════════════════════════════════════════════════════════
// GUILD FEED
// ══════════════════════════════════════════════════════════════
async function renderGuild() {
  const grid = document.getElementById('guild-grid');

  grid.innerHTML = `
    <div class="guild-empty">
      <span class="material-symbols-outlined">hourglass_top</span>
      <p>Loading the guild...</p>
    </div>
  `;

  try {
    const feed = await loadGuildFeed();

    if (feed.length === 0) {
      grid.innerHTML = `
        <div class="guild-empty">
          <span class="material-symbols-outlined">groups</span>
          <p>No analyses in the guild yet</p>
          <p style="font-size:12px;margin-top:4px;">Be the first to analyze a thumbnail!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    for (const entry of feed) {
      const card = document.createElement('div');
      card.className = 'guild-card';

      const verdictClass = (entry.verdict || '').toLowerCase();
      const date = entry.created_at
        ? new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : '';

      const userName = entry.user_name || 'Anonymous';
      const initial = userName[0].toUpperCase();
      const avatarHtml = entry.user_avatar
        ? `<img class="guild-card-avatar" src="${entry.user_avatar}" alt="" />`
        : `<div class="guild-card-avatar-placeholder">${initial}</div>`;

      const thumbHtml = entry.image_base64 && entry.image_base64.length > 100
        ? `<img class="guild-card-thumb" src="${createPreviewUrl(entry.image_base64)}" alt="Thumbnail" loading="lazy" />`
        : `<div class="guild-card-thumb-placeholder"><span class="material-symbols-outlined">image</span></div>`;

      card.innerHTML = `
        <div class="guild-card-user">
          ${avatarHtml}
          <span class="guild-card-name">${escapeHtml(userName)}</span>
        </div>
        ${thumbHtml}
        <div class="guild-card-body">
          <div class="guild-card-title">${escapeHtml(entry.title || 'Untitled')}</div>
          <div class="guild-card-meta">
            <span class="guild-card-score ${verdictClass}">${entry.total_score}</span>
            <span class="guild-card-verdict ${verdictClass}">${entry.verdict || ''}</span>
            <span class="guild-card-date">${date}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', async () => {
        try {
          const full = await loadAnalysis(entry.id);
          const scoreData = {
            totalScore: full.total_score,
            designScore: full.design_score,
            catScore: full.cat_score,
            verdict: full.verdict,
            contentType: full.content_type,
            catWarnings: full.cat_warnings || [],
            catTips: full.cat_tips || [],
            designBreakdown: full.design_breakdown || []
          };
          showView('results');
          renderResults(full.analysis, scoreData, full.title, full.category, full.image_base64);
        } catch (err) {
          showToast('Failed to load analysis: ' + err.message, 'error');
        }
      });

      grid.appendChild(card);
    }
  } catch (err) {
    grid.innerHTML = `
      <div class="guild-empty">
        <span class="material-symbols-outlined">error</span>
        <p>Failed to load: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ══════════════════════════════════════════════════════════════
// PDF EXPORT
// ══════════════════════════════════════════════════════════════
async function downloadPDF() {
  if (!currentUser) {
    showToast('Sign in to download your report', 'info');
    return;
  }

  const btn = document.getElementById('download-pdf-btn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span> Generating...';

  try {
    const allAnalyses = await loadAllHistory();
    if (allAnalyses.length === 0) {
      showToast('No analyses to export', 'info');
      return;
    }

    // Load full data for each analysis (includes all fields needed for PDF)
    const fullAnalyses = await Promise.all(
      allAnalyses.map(a => loadAnalysis(a.id))
    );

    generateReport(fullAnalyses, currentUser);
    showToast('PDF report downloaded!', 'success');
  } catch (err) {
    showToast('PDF generation failed: ' + err.message, 'error');
    console.error('PDF error:', err);
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = '<span class="material-symbols-outlined">picture_as_pdf</span> Download Report';
  }
}

// ══════════════════════════════════════════════════════════════
// HISTORY — Supabase-backed
// ══════════════════════════════════════════════════════════════
function setupHistory() {
  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    if (!currentUser) return;
    try {
      await clearAllHistory();
      analysisHistory = [];
      renderHistory();
      showToast('History cleared', 'info');
    } catch (err) {
      showToast('Failed to clear: ' + err.message, 'error');
    }
  });
  renderHistory();
}

async function saveToHistoryDB(analysis, scoreData, title, category) {
  if (!currentUser) {
    showToast('Sign in to save your analysis history', 'info');
    return;
  }
  try {
    const saved = await saveAnalysis({
      title,
      category,
      script: document.getElementById('script-input').value.trim() || null,
      imageBase64: currentImageBase64,
      totalScore: scoreData.totalScore,
      verdict: scoreData.verdict,
      contentType: scoreData.contentType,
      designScore: scoreData.designScore,
      catScore: scoreData.catScore,
      analysis,
      catWarnings: scoreData.catWarnings,
      catTips: scoreData.catTips,
      designBreakdown: scoreData.designBreakdown
    });
    analysisHistory.unshift(saved);
    renderHistory();
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    showToast('Analysis shown but failed to save to database', 'error');
  }
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!currentUser) {
    list.innerHTML = `
      <div class="history-empty">
        <span class="material-symbols-outlined empty-icon">account_circle</span>
        <p>Sign in to save history</p>
        <p class="empty-hint">Your analyses will be saved across sessions</p>
      </div>
    `;
    return;
  }
  if (analysisHistory.length === 0) {
    list.innerHTML = `
      <div class="history-empty">
        <span class="material-symbols-outlined empty-icon">image_search</span>
        <p>No analyses yet</p>
        <p class="empty-hint">Upload a thumbnail to get started</p>
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  for (const entry of analysisHistory) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.addEventListener('click', async () => {
      closeMobileSidebar();
      // Load full record to get the thumbnail image
      let fullEntry = entry;
      try {
        fullEntry = await loadAnalysis(entry.id);
      } catch (err) {
        console.warn('Could not load full analysis, using list data:', err);
      }
      const scoreData = {
        totalScore: fullEntry.total_score,
        designScore: fullEntry.design_score,
        catScore: fullEntry.cat_score,
        verdict: fullEntry.verdict,
        contentType: fullEntry.content_type,
        catWarnings: fullEntry.cat_warnings || [],
        catTips: fullEntry.cat_tips || [],
        designBreakdown: fullEntry.design_breakdown || []
      };
      renderResults(fullEntry.analysis, scoreData, fullEntry.title, fullEntry.category, fullEntry.image_base64);
    });

    const score = entry.total_score;
    const date = entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

    div.innerHTML = `
      <span class="history-score">${score}</span>
      <span class="history-title">${escapeHtml(entry.title || 'Untitled')}</span>
      ${date ? `<span class="history-date">${date}</span>` : ''}
      <button class="history-delete-btn material-symbols-outlined" title="Delete" aria-label="Delete analysis">close</button>
    `;

    // Individual delete button
    div.querySelector('.history-delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await deleteAnalysis(entry.id);
        analysisHistory = analysisHistory.filter(h => h.id !== entry.id);
        renderHistory();
        showToast('Analysis deleted', 'info');
      } catch (err) {
        showToast('Failed to delete: ' + err.message, 'error');
      }
    });

    list.appendChild(div);
  }
}

// ══════════════════════════════════════════════════════════════
// COPY PROMPT
// ══════════════════════════════════════════════════════════════
function setupCopyPrompt() {
  document.getElementById('copy-prompt-btn').addEventListener('click', async () => {
    const text = document.getElementById('thumbnail-prompt').textContent;
    if (!text || text === 'Waiting for analysis...') return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Prompt copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy. Please select and copy manually.', 'error');
    }
  });
}

// ══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
function getCSSColor(name) {
  const map = {
    'red': '#ef4444', 'blue': '#3b82f6', 'green': '#10b981', 'yellow': '#eab308',
    'orange': '#f97316', 'purple': '#8b5cf6', 'pink': '#ec4899', 'white': '#f8fafc',
    'black': '#1e293b', 'gray': '#6b7280', 'grey': '#6b7280', 'brown': '#92400e',
    'gold': '#d97706', 'navy': '#1e3a5f', 'teal': '#14b8a6', 'cyan': '#06b6d4',
    'magenta': '#d946ef', 'maroon': '#7f1d1d', 'cream': '#fef3c7', 'beige': '#f5f5dc',
    'dark green': '#065f46', 'dark blue': '#1e3a5f', 'dark red': '#7f1d1d',
    'light blue': '#93c5fd', 'light green': '#86efac', 'light yellow': '#fef08a',
    'bright red': '#dc2626', 'bright green': '#22c55e', 'bright blue': '#2563eb',
    'neon green': '#4ade80', 'neon yellow': '#facc15', 'saffron': '#fb923c'
  };
  return map[name.toLowerCase().trim()] || '#6b7280';
}

function closeMobileSidebar() {
  if (window.innerWidth <= 768) {
    document.querySelector('.gmail-sidebar').classList.remove('mobile-open');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
