const db = require('../config/db');

// REQUIRED: tanpa ini fitur tertentu error. OPTIONAL: dilewati otomatis jika kolom belum ada.
const REQUIRED = {
  users: ['id', 'name', 'email', 'password_hash', 'role', 'is_active', 'token_version', 'last_login_at'],
  events: ['id', 'title', 'slug', 'category', 'description', 'thumbnail_url', 'location', 'start_at', 'end_at', 'is_featured', 'is_published'],
  news: ['id', 'title', 'slug', 'category', 'excerpt', 'content', 'cover_url', 'published_at', 'is_published'],
  members: ['id', 'name', 'position', 'division', 'photo_url', 'period', 'sort_order', 'is_active'],
  settings: ['setting_key', 'setting_value'],
};
const OPTIONAL = { events: ['created_by'], news: ['author_id', 'views_count'] };

const state = { loaded: false, columns: {}, missingRequired: [], missingOptional: [] };

async function check() {
  const tables = [...new Set([...Object.keys(REQUIRED), ...Object.keys(OPTIONAL)])];
  const [rows] = await db.query(
    'SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name IN (?)',
    [tables]
  );
  const columns = {};
  rows.forEach(({ t, c }) => { (columns[String(t).toLowerCase()] ||= new Set()).add(String(c).toLowerCase()); });

  const missing = (spec, { onlyExistingTables = false } = {}) =>
    Object.entries(spec).flatMap(([t, cols]) => {
      if (!columns[t]) return onlyExistingTables ? [] : [`${t} (tabel belum ada)`];
      return cols.filter((c) => !columns[t].has(c)).map((c) => `${t}.${c}`);
    });

  state.columns = columns;
  state.missingRequired = missing(REQUIRED);
  state.missingOptional = missing(OPTIONAL, { onlyExistingTables: true });
  state.loaded = true;

  if (!state.missingRequired.length && !state.missingOptional.length) {
    console.log('[SKEMA] Struktur database lengkap.');
    return state;
  }
  if (state.missingRequired.length) {
    console.warn('[SKEMA] BELUM ADA (wajib):', state.missingRequired.join(', '));
    console.warn('[SKEMA] -> jalankan database/sprint2.sql (kolom users dan tabel members) atau schema.sql untuk tabel dasar');
  }
  if (state.missingOptional.length) {
    console.warn('[SKEMA] Belum ada (fitur dilewati sementara):', state.missingOptional.join(', '));
    console.warn('[SKEMA] -> jalankan database/erd_extension.sql');
  }
  return state;
}

// Sebelum pemeriksaan selesai, anggap kolom ada (perilaku normal)
const hasColumn = (table, column) => !state.loaded || Boolean(state.columns[table]?.has(column));
const status = () => ({
  ok: state.loaded && !state.missingRequired.length,
  loaded: state.loaded,
  missing_required: state.missingRequired,
  missing_optional: state.missingOptional,
});

module.exports = { check, hasColumn, status };
