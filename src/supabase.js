// ══════════════════════════════════════════════════════════════
// SUPABASE CLIENT — Database for persistent history
// ══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bverwfwjquywfcbcrkld.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ub1xBD3840SDBYP9eOTNDw_5VZGtqVs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Save analysis to Supabase ──
export async function saveAnalysis({ title, category, script, imageBase64, totalScore, verdict, contentType, designScore, catScore, analysis, catWarnings, catTips, designBreakdown }) {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      title,
      category,
      script: script || null,
      image_base64: imageBase64 ? imageBase64.substring(0, 500) : null,
      total_score: totalScore,
      verdict,
      content_type: contentType,
      design_score: designScore,
      cat_score: catScore,
      analysis,
      text_on_thumbnail: analysis.text_on_thumbnail || null,
      scroll_stop_power: analysis.scroll_stop_power || null,
      overall_impression: analysis.overall_impression || null,
      dominant_colors: analysis.dominant_colors || null,
      complete_thumbnail_feedback: analysis.complete_thumbnail_feedback || null,
      cat_warnings: catWarnings || [],
      cat_tips: catTips || [],
      design_breakdown: designBreakdown || []
    })
    .select()
    .single();

  if (error) throw new Error('Failed to save: ' + error.message);
  return data;
}

// ── Load analysis history from Supabase ──
export async function loadHistory(limit = 30) {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, title, category, total_score, verdict, content_type, image_base64, analysis, cat_warnings, cat_tips, design_breakdown, design_score, cat_score')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load history: ' + error.message);
  return data || [];
}

// ── Load single analysis by ID ──
export async function loadAnalysis(id) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error('Failed to load analysis: ' + error.message);
  return data;
}

// ── Delete single analysis ──
export async function deleteAnalysis(id) {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Failed to delete: ' + error.message);
}

// ── Clear all history ──
export async function clearAllHistory() {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

  if (error) throw new Error('Failed to clear history: ' + error.message);
}
