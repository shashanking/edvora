#!/usr/bin/env node

/**
 * Create an admin user via the Supabase Auth Admin API.
 *
 * Usage:
 *   node scripts/create-admin.js <email> <password> [full_name]
 *
 * Example:
 *   node scripts/create-admin.js admin@addify.academy 'StrongPass!23' 'Site Admin'
 *
 * Why this script: inserting directly into auth.users via SQL produces
 * "Database error querying schema" at login because Supabase expects
 * specific columns (instance_id, aud, encrypted_password hashing, empty-string
 * tokens, etc.). createUser() handles all of that correctly.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

(function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const [, , emailArg, passwordArg, ...nameParts] = process.argv;

if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/create-admin.js <email> <password> [full_name]');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg;
const fullName = nameParts.join(' ').trim() || 'Site Admin';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`→ Creating admin user: ${email}`);

  let userId;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' },
  });

  if (createErr) {
    const alreadyExists =
      createErr.status === 422 ||
      /already (registered|exists)/i.test(createErr.message || '');

    if (!alreadyExists) {
      console.error('❌ createUser failed:', createErr.message);
      process.exit(1);
    }

    console.log('ℹ User already exists — looking it up to update role.');
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.error('❌ listUsers failed:', listErr.message);
      process.exit(1);
    }
    const existing = list.users.find((u) => (u.email || '').toLowerCase() === email);
    if (!existing) {
      console.error('❌ Could not locate existing user with that email.');
      process.exit(1);
    }
    userId = existing.id;

    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), full_name: fullName, role: 'admin' },
    });
    if (updErr) {
      console.error('❌ updateUserById failed:', updErr.message);
      process.exit(1);
    }
  } else {
    userId = created.user.id;
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, email, full_name: fullName, role: 'admin' },
      { onConflict: 'id' }
    );

  if (profileErr) {
    console.error('❌ profile upsert failed:', profileErr.message);
    process.exit(1);
  }

  console.log('✅ Admin ready');
  console.log(`   id:    ${userId}`);
  console.log(`   email: ${email}`);
  console.log(`   role:  admin`);
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e);
  process.exit(1);
});
