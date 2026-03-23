// ══════════════════════════════════════════════════════════════
// SUPABASE CLIENT — Database + Auth
// ══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Functions ──

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw new Error('Sign-in failed: ' + error.message);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Sign-out failed: ' + error.message);
}

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

// ── Save analysis to Supabase ──
export async function saveAnalysis({ title, category, script, imageBase64, totalScore, verdict, contentType, designScore, catScore, analysis, catWarnings, catTips, designBreakdown }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Sign in to save analyses');

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      title,
      category,
      script: script || null,
      image_base64: imageBase64 || null,
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
      design_breakdown: designBreakdown || [],
      user_name: user.user_metadata?.full_name || null,
      user_avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    })
    .select()
    .single();

  if (error) throw new Error('Failed to save: ' + error.message);
  return data;
}

// ── Load user's own history (sidebar, limited) ──
export async function loadHistory(limit = 30) {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, title, category, total_score, verdict, content_type, analysis, cat_warnings, cat_tips, design_breakdown, design_score, cat_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load history: ' + error.message);
  return data || [];
}

// ── Load ALL user's analyses (for dashboard) ──
export async function loadAllHistory() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, title, category, total_score, verdict, content_type, image_base64, design_score, cat_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to load all history: ' + error.message);
  return data || [];
}

// ── Load Guild feed (all users) ──
export async function loadGuildFeed(limit = 50) {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, title, category, total_score, verdict, image_base64, user_name, user_avatar')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Failed to load guild feed: ' + error.message);
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
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('user_id', user.id);

  if (error) throw new Error('Failed to clear history: ' + error.message);
}
