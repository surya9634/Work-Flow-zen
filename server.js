require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const PORT = process.env.PORT || 10000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket diagnostics
io.on('connection', (socket) => {
  try { console.log('[socket.io] client connected', socket.id); } catch (_) {}

// Derive a price string from text (supports ₹, Rs, $, plain numbers with separators)
function derivePriceFromText(text) {
  try {
    const t = String(text || '');
    // common currency patterns
    const patterns = [
      /₹\s?([0-9]{1,3}(?:[,\s]?[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
      /Rs\.?\s?([0-9]{1,3}(?:[,\s]?[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i,
      /\$\s?([0-9]{1,3}(?:[,\s]?[0-9]{3})*(?:\.[0-9]{1,2})?)/,
      /([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?)/
    ];
    for (const re of patterns) {
      const m = t.match(re);
      if (m && m[0]) {
        const raw = m[0].trim();
        // normalize INR symbol if Rs pattern matched without symbol
        if (/^Rs/i.test(raw)) return raw.replace(/^Rs\.?/i, '₹').trim();
        return raw;
      }
    }
    return '';
  } catch (_) { return ''; }
}

// Derive specs array from a freeform description
function deriveSpecsFromText(text) {
  try {
    const parts = String(text || '')
      .split(/\n|\r|•|\-|\u2022|\.|;|\|/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && /[a-zA-Z0-9]/.test(s));
    return Array.from(new Set(parts)).slice(0, 8);
  } catch (_) {
    return [];
  }
}

// Ensure a campaign has specs, deriving from description if empty; persists and refreshes KB
function ensureSpecsForCampaign(campaignId) {
  try {
    const id = String(campaignId || '');
    if (!id) return false;
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return false;
    const currentSpecs = Array.isArray(existing.specs) ? existing.specs : [];
    if (currentSpecs.length > 0) return false;
    const desc = (existing.brief && existing.brief.description) || '';
    const specs = deriveSpecsFromText(desc);
    if (specs.length === 0) return false;
    const updated = { ...existing, specs };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return true;
  } catch (_) { return false; }
}

// Upsert or fetch a campaign by name for an owner; derives specs from provided description
function upsertCampaignForOwner(name, ownerUserId, description) {
  try {
    const owner = String(ownerUserId || '');
    const cname = String(name || '').trim() || ('c_' + Date.now());
    const desc = String(description || '');
    // find existing by owner + case-insensitive name
    let found = null;
    for (const c of campaignsStore2.campaigns.values()) {
      if (String(c.ownerUserId || '') === owner && String(c.name || '').toLowerCase() === cname.toLowerCase()) {
        found = c; break;
      }
    }
    const specs = deriveSpecsFromText(desc);
    const price = derivePriceFromText(desc);
    if (!found) {
      const id = 'c_' + Date.now();
      const created = { id, name: cname, ownerUserId: owner, brief: { description: desc }, specs, price };
      campaignsStore2.campaigns.set(id, created);
      saveCampaigns();
      try { refreshGlobalKB(); } catch (_) {}
      return created;
    } else {
      const merged = {
        ...found,
        brief: { description: desc || (found.brief && found.brief.description) || '' },
        specs: (Array.isArray(found.specs) && found.specs.length > 0) ? found.specs : specs,
        price: String(found.price || price || '')
      };
      campaignsStore2.campaigns.set(found.id, merged);
      saveCampaigns();
      try { refreshGlobalKB(); } catch (_) {}
      return merged;
    }
  } catch (_) { return null; }
}
  socket.on('disconnect', () => { try { console.log('[socket.io] client disconnected', socket.id); } catch (_) {} });
});

// Config from env
const config = {
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID || '',
    appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:10000/auth/instagram/callback',
    businessRedirectUri: process.env.INSTAGRAM_BUSINESS_REDIRECT_URI || (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/auth/instagram/business/callback` : 'http://localhost:10000/auth/instagram/business/callback'),
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackUrl: process.env.FACEBOOK_CALLBACK || 'http://localhost:10000/auth/facebook/callback',
    pageId: process.env.FB_PAGE_ID || '',
    pageToken: process.env.FB_PAGE_TOKEN || '',
    provider: process.env.MESSENGER_PROVIDER || 'local', // 'local' | 'facebook'
    messageTag: process.env.FB_MESSAGE_TAG || '' // e.g. 'HUMAN_AGENT' (requires approval) or other approved tag
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    testPhoneNumberId: process.env.WHATSAPP_TEST_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'verify-me',
    token: process.env.WHATSAPP_TOKEN || process.env.FB_PAGE_TOKEN || process.env.PAGE_ACCESS_TOKEN || '',
    testToken: process.env.WHATSAPP_TEST_TOKEN || '',
    mode: (process.env.WHATSAPP_MODE || 'production').toLowerCase() === 'test' ? 'test' : 'production' // 'test' | 'production'
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'WORKFLOW_VERIFY_TOKEN',
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'compound',
    autoReplyWebhook: String(process.env.AI_AUTO_REPLY_WEBHOOK || '').toLowerCase() === 'true',
    globalAiEnabled: String(process.env.GLOBAL_AI_ENABLED || process.env.AI_GLOBAL_AI_ENABLED || '').toLowerCase() === 'true',
    globalAiMode: 'replace', // 'replace' | 'hybrid'
    memoryEnabled: true // per-user/per-conversation memory
  }
};

// Initialize Groq client
let groqClient = null;
try {
  const { Groq } = require('groq-sdk');
  groqClient = new Groq({ apiKey: (config.ai.groqApiKey || process.env.GROQ_API_KEY || '').trim() });
} catch (e) {
  console.warn('groq-sdk not installed. Run: npm i groq-sdk');
}

// Helper: generate text with Groq GPT-OSS
async function generateWithGroq(userPrompt, systemPrompt) {
  if (!groqClient) throw new Error('groq_not_configured');
  const model = config.ai.groqModel || 'compound';
  const resp = await groqClient.chat.completions.create({
    model,
    temperature: 0.7,
    max_completion_tokens: 1024,
    messages: [
      { role: 'system', content: String(systemPrompt || 'You are a concise business assistant.').slice(0, 4000) },
      { role: 'user', content: String(userPrompt || '').slice(0, 4000) }
    ]
  });
  const choices = resp && resp.choices ? resp.choices : [];
  const first = choices.length > 0 ? choices[0] : {};
  const msg = first.message || {};
  const content = typeof msg.content === 'string' ? msg.content : '';
  return content.trim();
}

// --- Helpers (file IO, stores) ---
const dataDir = path.join(__dirname, 'data');
const profileFile = path.join(dataDir, 'businessProfile.json');
const profilePromptsFile = path.join(dataDir, 'profile-prompts.json');
const userMemoriesFile = path.join(dataDir, 'user-memories.json');
const defaultOwnerFile = path.join(dataDir, 'default-owner.json');
const pageOwnersFile = path.join(dataDir, 'page-owners.json');
ensureDir(dataDir);

// Load persisted integrations (Facebook Page token/id) on startup
try {
  const integrationsFile = path.join(dataDir, 'integrations.json');
  const saved = readJsonSafeEnsure(integrationsFile, {});
  if (saved && saved.facebook) {
    if (saved.facebook.pageToken) config.facebook.pageToken = saved.facebook.pageToken;
    if (saved.facebook.pageId) config.facebook.pageId = saved.facebook.pageId;
  }
} catch (_) {}

// --- Page owner mapping helpers ---
function getOwnerForPage(pageId) {
  try {
    const j = readJsonSafeEnsure(pageOwnersFile, { pages: {} });
    const pid = String(pageId || '');
    return (j.pages && j.pages[pid]) ? String(j.pages[pid]) : '';
  } catch (_) { return ''; }
}

function setOwnerForPage(pageId, ownerUserId) {
  try {
    const pid = String(pageId || '');
    const owner = String(ownerUserId || '');
    if (!pid || !owner) return false;
    const j = readJsonSafeEnsure(pageOwnersFile, { pages: {} });
    j.pages = j.pages || {};
    j.pages[pid] = owner;
    writeJsonSafe(pageOwnersFile, j);
    return true;
  } catch (_) { return false; }
}

function ensureDefaultOwnerUser() {
  try {
    // read default owner
    const j = readJsonSafeEnsure(defaultOwnerFile, { ownerUserId: '' });
    let ownerId = String(j.ownerUserId || '');
    // if exists and valid, return
    if (ownerId && authStore.usersById.get(ownerId)) return ownerId;
    // else pick first existing user if any
    const anyUser = Array.from(authStore.usersById.values())[0] || null;
    if (anyUser && anyUser.id) {
      ownerId = anyUser.id;
      writeJsonSafe(defaultOwnerFile, { ownerUserId: ownerId });
      return ownerId;
    }
    // create a fallback demo owner
    const demoEmail = 'owner@return.local';
    const demoPass = 'owner';
    const u = createUser(demoEmail, demoPass);
    ownerId = u.id;
    writeJsonSafe(defaultOwnerFile, { ownerUserId: ownerId });
    return ownerId;
  } catch (_) { return ''; }
}

function ensurePageOwner(pageId) {
  try {
    const pid = String(pageId || '');
    if (!pid) return '';
    const existing = getOwnerForPage(pid);
    if (existing) return existing;
    const owner = ensureDefaultOwnerUser();
    if (owner) setOwnerForPage(pid, owner);
    return owner || '';
  } catch (_) { return ''; }
}

function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }); } catch (_) {} }
function readJsonSafeEnsure(file, fallback) { try { if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback || {}, null, 2)); return JSON.parse(fs.readFileSync(file, 'utf8') || 'null'); } catch (_) { return JSON.parse(JSON.stringify(fallback || null)); } }
function writeJsonSafe(file, data) { try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; } catch (_) { return false; } }

function readBusinessProfile() {
  try { return readJsonSafeEnsure(profileFile, { business: {}, campaigns: [] }); } catch (_) { return { business: {}, campaigns: [] }; }
}

// Dummy campaigns store (minimal shape needed by KB)
const campaignsStore = { campaigns: new Map() };
try {
  const json = readJsonSafeEnsure(path.join(dataDir, 'campaigns.json'), { campaigns: [] });
  if (Array.isArray(json.campaigns)) {
    for (const c of json.campaigns) {
      const id = c.id || ('c_' + Math.random().toString(36).slice(2, 8));
      campaignsStore.campaigns.set(id, { id, name: c.name || id, brief: { description: c.description || '' } });
    }
  }
} catch (_) {}

// Global AI KB and memory
function buildGlobalKB() {
  var kb = { items: [], business: { name: '', about: '', tone: '' } };
  try {
    var profile = readBusinessProfile() || {};
    kb.business = {
      name: String(profile.business && profile.business.name || ''),
      about: String(profile.business && profile.business.about || ''),
      tone: String(profile.business && profile.business.tone || 'Friendly, helpful, concise')
    };

    // Include onboarding data from all users
    var onboardingData = [];
    for (const [userId, data] of authStore.onboardingByUser) {
      if (data && typeof data === 'object') {
        onboardingData.push({
          userId: userId,
          businessName: String(data.businessName || ''),
          businessAbout: String(data.businessAbout || ''),
          tone: String(data.tone || ''),
          industry: String(data.industry || ''),
          goals: Array.isArray(data.goals) ? data.goals.map(String) : [],
          challenges: Array.isArray(data.challenges) ? data.challenges.map(String) : [],
          sources: ['onboarding']
        });
      }
    }
    kb.onboarding = onboardingData;

    var byId = new Map();
    for (const [cid, camp] of campaignsStore2.campaigns) {
      var base = byId.get(cid) || { id: cid, name: String(camp.name || cid), description: '', keywords: [], sources: ['campaigns'] };
      var desc = '';
      try { desc = String((camp.brief && camp.brief.description) || camp.description || ''); } catch (_) {}
      base.description = [base.description, desc].filter(Boolean).join(' ');
      var kws = [];
      try {
        if (Array.isArray(camp.channels)) kws = kws.concat(camp.channels.map(function(x){ return String(x); }));
        if (Array.isArray(camp.brief && camp.brief.channels)) kws = kws.concat(camp.brief.channels.map(function(x){ return String(x); }));
        if (camp.persona && camp.persona.name) kws.push(String(camp.persona.name));
        if (camp.persona && camp.persona.tone) kws.push(String(camp.persona.tone));
      } catch (_) {}
      base.keywords = (base.keywords || []).concat(kws);
      byId.set(cid, base);
    }
    var mai = getActiveMotherAI();
    if (mai && Array.isArray(mai.elements)) {
      for (var i = 0; i < mai.elements.length; i++) {
        var el = mai.elements[i];
        var c = campaignsStore.campaigns.get(el.campaignId);
        if (!c) continue;
        var base = byId.get(c.id);
        var label = String(el.label || '');
        var kws = Array.isArray(el.keywords) ? el.keywords.map(function(k){ return String(k); }) : [];
        if (label && !base.name) base.name = label;
        base.keywords = (base.keywords || []).concat(kws);
        base.sources.push('mother_ai');
      }
    }
    for (const v of byId.values()) kb.items.push(v);

    // Include structured campaigns (campaignsStore2), prefer their fields and specs
    try {
      if (campaignsStore2 && campaignsStore2.campaigns) {
        for (const c of campaignsStore2.campaigns.values()) {
          const item = {
            id: c.id,
            name: c.name || c.id,
            description: (c.brief && c.brief.description) || '',
            specs: Array.isArray(c.specs) ? c.specs.map(s => String(s)) : [],
            ownerUserId: c.ownerUserId || '',
            price: c.price || '',
            persona: c.persona || {},
            target: c.target || {},
            chatFlow: c.chatFlow || {},
            outreach: c.outreach || '',
            sources: ['campaigns']
          };
          kb.items.push(item);
        }
      }
    } catch (_) {}
  } catch (_) {}
  return kb;
}

var globalKB = buildGlobalKB();
function refreshGlobalKB() { globalKB = buildGlobalKB(); }

// Simple per-user/per-conversation memory (stored in userMemoriesFile)
function appendMemory(userId, convId, title, data) {
  try {
    if (!config.ai.memoryEnabled) return;
    const db = readJsonSafeEnsure(userMemoriesFile, { users: {} });
    const uid = String(userId || '');
    const cid = String(convId || '');
    db.users = db.users || {};
    db.users[uid] = db.users[uid] || { memories: [] };
    const m = { id: 'mem_' + Date.now(), title: String(title || ''), type: 'note', data: { conversationId: cid, ...data }, createdAt: new Date().toISOString() };
    db.users[uid].memories.push(m);
    writeJsonSafe(userMemoriesFile, db);
  } catch (_) {}
}

// Analytics API: exposes simple message counters
app.get('/api/analytics', (_req, res) => {
  try {
    const data = loadAnalytics();
    return res.json({ success: true, analytics: data });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

// Page owners management (pageId -> ownerUserId)
app.post('/api/page-owners', (req, res) => {
  try {
    const { pageId, ownerUserId } = req.body || {};
    const pid = String(pageId || '');
    const owner = String(ownerUserId || '');
    if (!pid || !owner) return res.status(400).json({ success: false, message: 'pageId_and_ownerUserId_required' });
    const ok = setOwnerForPage(pid, owner);
    if (!ok) return res.status(500).json({ success: false, message: 'save_failed' });
    return res.json({ success: true, pageId: pid, ownerUserId: owner });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'save_failed' });
  }
});

app.get('/api/page-owners/:pageId', (req, res) => {
  try {
    const pid = String(req.params.pageId || '');
    if (!pid) return res.status(400).json({ success: false, message: 'pageId_required' });
    const owner = getOwnerForPage(pid);
    return res.json({ success: true, pageId: pid, ownerUserId: owner || '' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'fetch_failed' });
  }
});

app.get('/api/page-owners', (_req, res) => {
  try {
    const j = readJsonSafeEnsure(pageOwnersFile, { pages: {} });
    return res.json({ success: true, pages: j.pages || {} });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'fetch_failed' });
  }
});

function getRecentMemories(userId, limit) {
  try {
    const db = readJsonSafeEnsure(userMemoriesFile, { users: {} });
    const arr = (db.users && db.users[String(userId || '')] && db.users[String(userId || '')].memories) || [];
    return arr.slice(-1 * (limit || 5));
  } catch (_) { return []; }
}

function retrieveContext(query, k, ownerUserId) {
  var q = String(query || '').toLowerCase();
  var scored = [];
  var items = globalKB.items;
  if (ownerUserId) {
    items = items.filter(function(it){ return String(it.ownerUserId || '') === String(ownerUserId); });
  }
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    // Extract description from either brief.description or description field
    var itDesc = (it.brief && it.brief.description) || it.description || '';
    var hay = (
      String(it.id || '') + ' ' +
      String(it.name || '') + ' ' +
      String(itDesc) + ' ' +
      (Array.isArray(it.specs) ? it.specs.join(' ') : '') + ' ' +
      String(it.price || '') + ' ' +
      (Array.isArray(it.keywords) ? it.keywords.join(' ') : '') + ' ' +
      (it.persona ? (it.persona.name || '') + ' ' + (it.persona.position || '') + ' ' + (it.persona.tone || '') + ' ' + (it.persona.voice || '') + ' ' + (it.persona.notes || '') : '') + ' ' +
      (it.target ? (it.target.segment || '') + ' ' + (it.target.targetAudience || '') + ' ' + (it.target.segments ? JSON.stringify(it.target.segments) : '') + ' ' + (it.target.pains || '') + ' ' + (it.target.leadSource || '') : '') + ' ' +
      (it.chatFlow ? (it.chatFlow.opening || '') + ' ' + (it.chatFlow.objective || '') + ' ' + (it.chatFlow.probing || '') + ' ' + (it.chatFlow.objections || '') + ' ' + (it.chatFlow.cta || '') : '') + ' ' +
      String(it.outreach || '') + ' ' +
      (it.message ? (it.message.initialMessage || '') + ' ' + (it.message.followUpMessage || '') : '') + ' ' +
      (it.brief && Array.isArray(it.brief.channels) ? it.brief.channels.join(' ') : '')
    ).toLowerCase();
    var score = 0;
    if (hay.indexOf(q) >= 0) score += 5;
    // strong boost for exact campaign id query
    try { if (String(it.id || '').toLowerCase() === q) score += 10; } catch (_) {}
    var toks = q.split(/[^a-z0-9]+/);
    for (var t = 0; t < toks.length; t++) {
      var tok = toks[t]; if (!tok) continue;
      if (hay.indexOf(tok) >= 0) score += 2;
    }
    if (score > 0) scored.push({ score: score, item: it });
  }
  scored.sort(function(a,b){ return b.score - a.score; });
  var top = scored.slice(0, k || 3).map(function(s){ return s.item; });
  var ctx = [];
  for (var j = 0; j < top.length; j++) {
    var x = top[j];
    // Extract description from either brief.description or description field
    var xDesc = (x.brief && x.brief.description) || x.description || '';
    // Use description as primary content, name only as optional reference
    var details = '- ' + xDesc;
    if (x.name && xDesc && xDesc.toLowerCase().indexOf(x.name.toLowerCase()) === -1) {
      details = '- [' + x.name + '] ' + xDesc;
    } else if (!xDesc && x.name) {
      details = '- ' + x.name;
    }
    if (x.specs && x.specs.length) details += ' | Specs: ' + x.specs.join(', ');
    if (x.price) details += ' | Price: ' + x.price;
    if (x.keywords && x.keywords.length) details += ' (keywords: ' + x.keywords.join(', ') + ')';
    ctx.push(details);
  }
  return { items: top, text: ctx.join('\n') };
}

// Summarize simple analytics to feed Global AI answers
function analyticsSummaryText() {
  try {
    const a = loadAnalytics();
    const m = a && a.counters && a.counters.messenger ? a.counters.messenger : { sent: 0, received: 0 };
    const w = a && a.counters && a.counters.whatsapp ? a.counters.whatsapp : { sent: 0, received: 0 };
    const t = a && a.counters && a.counters.total ? a.counters.total : { sent: 0, received: 0 };
    return `Analytics — Total(sent:${t.sent}, received:${t.received}); Messenger(sent:${m.sent}, received:${m.received}); WhatsApp(sent:${w.sent}, received:${w.received}).`;
  } catch (_) {
    return '';
  }
}

async function answerWithGlobalAI(userText, userId) {
  var ctx = retrieveContext(userText, 3, String(userId || ''));
  var tone = globalKB.business && globalKB.business.tone ? globalKB.business.tone : 'Friendly, helpful, concise';
  var biz = globalKB.business && globalKB.business.name ? globalKB.business.name : 'our business';
  var recent = getRecentMemories(userId, 5).map(function(m){ return '- ' + m.title; }).join('\n');
  var analyticsLine = analyticsSummaryText();
  // Load per-user system prompt and onboarding summary (scoped RAAG)
  var userSystemPrompt = '';
  try {
    var db = readJsonSafeEnsure(profilePromptsFile, { profiles: {} });
    var ukey = String(userId || '');
    userSystemPrompt = (db && db.profiles && db.profiles[ukey] && db.profiles[ukey].systemPrompt) ? String(db.profiles[ukey].systemPrompt) : '';
  } catch (_) {}
  var onboardingSummary = '';
  try {
    var ob = authStore && authStore.onboardingByUser && authStore.onboardingByUser.get(String(userId || ''));
    if (ob && typeof ob === 'object') {
      var goals = Array.isArray(ob.goals) ? ob.goals.join(', ') : '';
      var challenges = Array.isArray(ob.challenges) ? ob.challenges.join(', ') : '';
      onboardingSummary = [
        ob.businessName ? ('Business: ' + ob.businessName) : '',
        ob.businessAbout ? ('About: ' + ob.businessAbout) : '',
        ob.tone ? ('Tone: ' + ob.tone) : '',
        ob.industry ? ('Industry: ' + ob.industry) : '',
        goals ? ('Goals: ' + goals) : '',
        challenges ? ('Challenges: ' + challenges) : ''
      ].filter(Boolean).join('\n');
    }
  } catch (_) {}
  
  // Get list of available products from campaigns (use descriptions, not names)
  const availableProducts = [];
  if (globalKB.items && Array.isArray(globalKB.items)) {
    globalKB.items.forEach(item => {
      const desc = (item.brief && item.brief.description) || item.description || '';
      if (desc && desc.trim()) {
        // Use description instead of name for richer context
        const productInfo = desc.trim().substring(0, 200); // Limit length
        if (!availableProducts.some(p => p === productInfo)) {
          availableProducts.push(productInfo);
        }
      }
    });
  }

  // Build an owner-scoped catalog summary so the AI always sees all campaigns
  var ownerCatalogText = '';
  try {
    var ownerItems = (globalKB.items || []).filter(function(it){ return String(it.ownerUserId || '') === String(userId || ''); });
    if (ownerItems.length) {
      var lines = [];
      for (var i = 0; i < ownerItems.length && i < 8; i++) {
        var it = ownerItems[i];
        var itDescription = (it.brief && it.brief.description) || it.description || '';
        // Use description as primary identifier, optionally include name as reference
        var line = '* ' + itDescription;
        if (it.name && itDescription.toLowerCase().indexOf(it.name.toLowerCase()) === -1) {
          line = '* [' + it.name + '] ' + itDescription;
        }
        if (Array.isArray(it.specs) && it.specs.length) line += ' | Specs: ' + it.specs.join(', ');
        if (it.price) line += ' | Price: ' + it.price;
        if (it.persona && (it.persona.name || it.persona.tone)) {
          var pbits = [];
          if (it.persona.name) pbits.push('persona=' + String(it.persona.name));
          if (it.persona.tone) pbits.push('tone=' + String(it.persona.tone));
          if (pbits.length) line += ' | ' + pbits.join(', ');
        }
        lines.push(line);
      }
      ownerCatalogText = lines.join('\n');
    }
  } catch (_) {}

  // If retrieval is weak (very generic ask), choose owner's most detailed campaign
  try {
    if (!ctx.items || ctx.items.length === 0 || /\b(what|which|sell|product|info|details)\b/i.test(String(userText || ''))) {
      var fallbackTop = null;
      try {
        var owned = (globalKB.items || []).filter(function(it){ return String(it.ownerUserId || '') === String(userId || ''); });
        if (owned.length) {
          owned.sort(function(a,b){
            var aDesc = (a.brief && a.brief.description) || a.description || '';
            var bDesc = (b.brief && b.brief.description) || b.description || '';
            var as = (Array.isArray(a.specs) ? a.specs.length : 0) + aDesc.length;
            var bs = (Array.isArray(b.specs) ? b.specs.length : 0) + bDesc.length;
            return bs - as;
          });
          fallbackTop = owned[0];
        }
      } catch (_) {}
      if (fallbackTop) {
        var fbDesc = (fallbackTop.brief && fallbackTop.brief.description) || fallbackTop.description || '';
        ctx = { items: [fallbackTop], text: ('- ' + fallbackTop.name + ': ' + fbDesc + (fallbackTop.specs && fallbackTop.specs.length ? (' Specs: ' + fallbackTop.specs.join(', ')) : '') + (fallbackTop.price ? (' Price: ' + fallbackTop.price) : '')) };
      }
    }
  } catch (_) {}

  // Pull campaign-level persona/target/chatFlow/outreach if available from top item
  var topItem = (ctx && Array.isArray(ctx.items) && ctx.items[0]) ? ctx.items[0] : null;
  var personaBlock = '';
  var targetBlock = '';
  var chatFlowBlock = '';
  var outreachBlock = '';
  try {
    if (topItem) {
      var p = topItem.persona || {};
      var t = topItem.target || {};
      var f = topItem.chatFlow || {};
      var o = topItem.outreach || '';
      
      // Build comprehensive Persona block with ALL fields
      var personaParts = [];
      if (p.campaignType) personaParts.push('Campaign Type: ' + String(p.campaignType));
      if (p.name) personaParts.push('Name: ' + String(p.name));
      if (p.position) personaParts.push('Position: ' + String(p.position));
      if (p.tone) personaParts.push('Tone: ' + String(p.tone));
      if (p.voice) personaParts.push('Voice: ' + String(p.voice));
      if (p.notes) personaParts.push('Notes: ' + String(p.notes));
      personaBlock = personaParts.filter(Boolean).join('\n');
      
      // Build comprehensive Target block with ALL fields
      var targetParts = [];
      if (t.targetAudience) targetParts.push('Target Audience: ' + String(t.targetAudience));
      if (t.segment) targetParts.push('Segment: ' + String(t.segment));
      if (t.leadSource) targetParts.push('Lead Source: ' + String(t.leadSource));
      if (t.segments) targetParts.push('Segments: ' + JSON.stringify(t.segments));
      if (t.pains) targetParts.push('Pains: ' + String(t.pains));
      targetBlock = targetParts.filter(Boolean).join('\n');
      
      // Build comprehensive Chat Flow block with ALL fields including steps
      var chatFlowParts = [];
      if (f.objective) chatFlowParts.push('Objective: ' + String(f.objective));
      if (f.opening) chatFlowParts.push('Opening: ' + String(f.opening));
      if (f.probing) chatFlowParts.push('Probing: ' + String(f.probing));
      if (f.objections) chatFlowParts.push('Objections: ' + String(f.objections));
      if (f.cta) chatFlowParts.push('CTA: ' + String(f.cta));
      if (f.steps && Array.isArray(f.steps) && f.steps.length > 0) {
        chatFlowParts.push('Conversation Steps:\n' + f.steps.map(function(s, i) { return '  ' + (i + 1) + '. ' + String(s); }).join('\n'));
      }
      chatFlowBlock = chatFlowParts.filter(Boolean).join('\n');
      
      outreachBlock = o ? ('Outreach hints: ' + String(o)) : '';
    }
  } catch (_) {}

  var system = [
    (userSystemPrompt ? ('Business-specific instructions (scoped):\n' + String(userSystemPrompt).slice(0, 2000)) : ''),
    (onboardingSummary ? ('Onboarding context:\n' + onboardingSummary) : ''),
    'You are an expert sales and support AI assistant. Your role is to engage customers naturally, build trust, and guide them toward their goals.\n\nCORE PRINCIPLES:\n• Be conversational, warm, and human-like in every response\n• Listen actively and respond to what the customer actually needs\n• Build genuine rapport before discussing products or pricing\n• Adapt your communication style to match the customer (formal, casual, Hinglish, etc.)\n• Keep responses concise and actionable - avoid walls of text\n\nPERSONA GUIDELINES:\n• Use the persona information provided (name, position, tone, campaign type)\n• Match the specified tone (friendly, professional, casual, enthusiastic, helpful, confident)\n• Embody the role authentically - if you\'re a support agent, be helpful; if sales, be consultative\n\nCONVERSATION FLOW:\n• Follow the conversation steps provided in the Chat Flow section\n• Start with the opening strategy, then move through each step naturally\n• Use the probing questions to understand customer needs deeply\n• Address objections using the strategies provided\n• Guide toward the CTA (call-to-action) when appropriate\n\nTARGET AUDIENCE AWARENESS:\n• Keep the target audience and their pain points in mind\n• Speak directly to their challenges and goals\n• Use language and examples that resonate with their context\n\nPRODUCT INFORMATION:\n• Use ONLY the specs, features, and details provided in the context\n• Never invent or hallucinate product information\n• If you don\'t know something, admit it honestly\n• Present value and benefits before discussing price\n\nPRICING STRATEGY:\n• Don\'t mention price unless the customer asks\n• When asked, provide the exact price from the context\n• Emphasize value, ROI, and benefits to justify the price\n• Negotiate only when necessary, offering value-adds instead of discounts\n• Frame pricing in terms of investment and outcomes\n\nOBJECTION HANDLING:\n• Listen to concerns without being defensive\n• Acknowledge the objection genuinely\n• Provide specific, relevant responses using context information\n• Use social proof, success stories, or guarantees when appropriate\n• Reframe objections as opportunities to clarify value\n\nRESPONSE STYLE:\n• Keep responses short (2-4 sentences typically)\n• Use natural, conversational language\n• Ask one clear question at a time\n• Use emojis sparingly and only when they fit the tone\n• Avoid corporate jargon unless the persona requires it\n• Be authentic - people buy from people they trust\n\nCULTURAL FLUENCY:\n• Mirror the customer\'s communication style\n• Use Hinglish, regional expressions, or formal English as appropriate\n• Understand Indian negotiation culture - it\'s relationship-driven\n• Be patient with back-and-forth - it\'s part of building trust\n\nREMEMBER: Your goal is to help, not to push. Make the customer feel understood, valued, and empowered to make the right decision for them.',

    '',
    'Available Products: ' + (availableProducts.length > 0 ? availableProducts.join(', ') : 'No products listed yet'),
    (globalKB.business && globalKB.business.about ? ('About Us: ' + globalKB.business.about) : ''),
    (ownerCatalogText ? ('Owner Catalog:\n' + ownerCatalogText) : ''),
    (topItem ? ('Active Campaign Information: ' + ((topItem.brief && topItem.brief.description) || topItem.description || 'No description available') + (topItem.price ? ' | Price: ' + topItem.price : '')) : ''),
    (personaBlock ? ('Persona\n' + personaBlock) : ''),
    (targetBlock ? ('Targeting\n' + targetBlock) : ''),
    (chatFlowBlock ? ('Chat Flow\n' + chatFlowBlock) : ''),
    (outreachBlock ? outreachBlock : ''),
    (recent ? ('Recent conversation history:\n' + recent) : ''),
    (analyticsLine ? analyticsLine : ''),
    'Context:\n' + ctx.text,
    '',
    'Important: Use the exact Specs and Price from the Context for product details. Do not generalize or invent information.',
    '',
    'When responding to product inquiries, use this format:',
    '1. Confirm the product name and express enthusiasm',
    '2. Extract and list key specifications or features from the product description; if not detailed, highlight benefits or general features',
    '3. If the user asks for price, provide it from the Context; otherwise, do not mention price',
    '4. End with a strong call to action (e.g., "Would you like to purchase this product or learn more?")',
    'For follow-up questions, provide specific details from the available context and history.'
  ].filter(Boolean).join('\n');
  
  try {
    var reply = await generateWithGroq(userText, system);
    return { reply: reply, sources: ctx.items.map(function(i){ return i.id; }) };
  } catch (e) {
    // Graceful fallback synthesis from context when Groq is unavailable
    try { console.warn('AI fallback used:', e && e.message ? e.message : e); } catch (_) {}
    var top = (ctx && Array.isArray(ctx.items)) ? ctx.items[0] : null;
    var productName = top && top.name ? top.name : 'our product';
    var specs = (top && Array.isArray(top.specs)) ? top.specs : [];
    if (!specs || specs.length === 0) {
      try {
        var desc = String((top && ((top.brief && top.brief.description) || top.description)) || '');
        var parts = desc
          .split(/\n|\r|•|\-|\u2022|\.|;|\|/)
          .map(function(s){ return s.trim(); })
          .filter(function(s){ return s.length > 2 && /[a-zA-Z0-9]/.test(s); });
        var dedup = Array.from(new Set(parts)).slice(0, 8);
        if (dedup.length) {
          specs = dedup;
          // persist to campaigns if this item maps to a campaign id we own
          try { if (top && top.id) ensureSpecsForCampaign(String(top.id)); } catch (_) {}
        }
      } catch (_) {}
    }
    // If still no specs, infer from user text, recent memories, and business.about; then persist for future
    if (!specs || specs.length === 0) {
      try {
        var inferred = [];
        // From userText
        var utParts = String(userText || '')
          .split(/\n|\r|,|\.|;|\||\/|\-|\u2022/)
          .map(function(s){ return s.trim(); })
          .filter(function(s){ return s.length > 2 && /[a-zA-Z0-9]/.test(s); });
        inferred = inferred.concat(utParts);
        // From recent memory titles
        try {
          var mems = getRecentMemories(userId, 5) || [];
          var memParts = mems.map(function(m){ return String(m.title || '').trim(); }).filter(function(s){ return s.length > 2; });
          inferred = inferred.concat(memParts);
        } catch (_) {}
        // From business.about
        try {
          var aboutText = String((globalKB && globalKB.business && globalKB.business.about) || '');
          var aboutParts = aboutText
            .split(/\n|\r|,|\.|;|\||\/|\-|\u2022/)
            .map(function(s){ return s.trim(); })
            .filter(function(s){ return s.length > 2 && /[a-zA-Z0-9]/.test(s); });
          inferred = inferred.concat(aboutParts);
        } catch (_) {}
        var inferredDedup = Array.from(new Set(inferred)).filter(function(s){ return s && s.length > 2; }).slice(0, 8);
        if (inferredDedup.length) {
          specs = inferredDedup;
          // Persist: update existing campaign by id if present, else upsert by name for this owner (userId)
          try {
            if (top && top.id && campaignsStore2 && campaignsStore2.campaigns && campaignsStore2.campaigns.get(top.id)) {
              var ex = campaignsStore2.campaigns.get(top.id);
              var updated = { ...ex, specs: specs, brief: { description: (ex.brief && ex.brief.description) || (inferredDedup.join('. ') + '.') } };
              campaignsStore2.campaigns.set(top.id, updated);
              saveCampaigns();
              try { refreshGlobalKB(); } catch (_) {}
            } else {
              try { upsertCampaignForOwner(productName, String(userId || ''), inferredDedup.join('. ') + '.'); } catch (_) {}
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
    var specLines = (specs && specs.length) ? specs.map(function(s){ return '- ' + String(s); }).join('\n') : '- No detailed specifications have been listed yet.';
    var priceLine = '';
    try {
      var priceFromTop = (top && top.price) ? String(top.price) : '';
      if (!priceFromTop) {
        var inferredPrice = derivePriceFromText(userText) || derivePriceFromText(globalKB && globalKB.business && globalKB.business.about);
        priceFromTop = inferredPrice || '';
        if (priceFromTop) {
          // persist price to campaign if possible
          try {
            if (top && top.id && campaignsStore2 && campaignsStore2.campaigns && campaignsStore2.campaigns.get(top.id)) {
              var exC = campaignsStore2.campaigns.get(top.id);
              campaignsStore2.campaigns.set(top.id, { ...exC, price: priceFromTop });
              saveCampaigns();
              try { refreshGlobalKB(); } catch (_) {}
            } else {
              try { upsertCampaignForOwner(productName, String(userId || ''), (userText || '')); } catch (_) {}
            }
          } catch (_) {}
        }
      }
      priceLine = priceFromTop ? ('Pricing: ' + priceFromTop) : 'For pricing information, please contact our sales team.';
    } catch (_) {
      priceLine = 'For pricing information, please contact our sales team.';
    }
    var fallback = [
      'We offer ' + productName + '.',
      '',
      'Specifications:',
      specLines,
      '',
      priceLine,
      'Would you like more information about this product?'
    ].join('\n');
    return { reply: fallback, sources: ctx.items.map(function(i){ return i.id; }) };
  }
}

// Helper to choose WhatsApp credentials by mode
function getWhatsappCreds(preferredMode) {
  const m = (preferredMode || config.whatsapp.mode) === 'test' ? 'test' : 'production';
  const token = m === 'test' ? (config.whatsapp.testToken || config.whatsapp.token) : config.whatsapp.token;
  const phoneNumberId = m === 'test' ? (config.whatsapp.testPhoneNumberId || config.whatsapp.phoneNumberId) : config.whatsapp.phoneNumberId;
  return { mode: m, token, phoneNumberId };
}

console.log('🚀 Starting Work Automation Platform');
console.log('=====================================');
console.log(`PORT: ${PORT}`);
console.log(`Instagram App ID set: ${!!config.instagram.appId}`);
console.log(`Facebook App ID set: ${!!config.facebook.appId}`);
console.log(`Facebook Callback URL: ${config.facebook.callbackUrl}`);
console.log(`WhatsApp Phone ID set: ${!!config.whatsapp.phoneNumberId}`);
console.log('=====================================');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Upload storage (temp files on disk)
const uploadDir = path.join(__dirname, 'uploads');
ensureDir(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB

// Initialize local stores on boot
try { loadMessengerStore(); } catch (_) {}
try { ensureDir(path.dirname(profilePromptsFile)); readJsonSafeEnsure(profilePromptsFile, { profiles: {} }); } catch (_) {}
try { ensureDir(path.dirname(userMemoriesFile)); readJsonSafeEnsure(userMemoriesFile, { users: {} }); } catch (_) {}
try { readJsonSafeEnsure(defaultOwnerFile, { ownerUserId: '' }); } catch (_) {}
try { readJsonSafeEnsure(pageOwnersFile, { pages: {} }); } catch (_) {}

// --- Minimal in-memory auth + onboarding for demo ---
const authStore = {
  usersByEmail: new Map(), // email -> user
  usersById: new Map(),    // id -> user
  tokens: new Map(),       // token -> userId
  onboardingByUser: new Map(), // userId -> onboarding data
};

// Default owner helpers (for auto-mapping new conversations)
function getPersistedDefaultOwner() {
  try { const j = readJsonSafeEnsure(defaultOwnerFile, { ownerUserId: '' }); return String(j.ownerUserId || ''); } catch (_) { return ''; }
}
function setPersistedDefaultOwner(userId) {
  try { writeJsonSafe(defaultOwnerFile, { ownerUserId: String(userId || '') }); return true; } catch (_) { return false; }
}
function computeFallbackDefaultOwner() {
  try {
    // Prefer exactly one onboarded user
    const ids = Array.from(authStore.onboardingByUser.keys());
    if (ids.length === 1) return String(ids[0]);
    // Else if exactly one user exists in usersById
    const all = Array.from(authStore.usersById.keys());
    if (all.length === 1) return String(all[0]);
  } catch (_) {}
  return '';
}
function getDefaultOwnerUserId() {
  const persisted = getPersistedDefaultOwner();
  if (persisted) return persisted;
  const fallback = computeFallbackDefaultOwner();
  if (fallback) { try { setPersistedDefaultOwner(fallback); } catch (_) {} }
  return fallback;
}

function createUser(email, password) {
  const id = 'u_' + Math.random().toString(36).slice(2, 10);
  const user = {
    id,
    email,
    password, // NOTE: plain for demo only
    role: 'user',
    name: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    onboardingCompleted: false,
  };
  authStore.usersByEmail.set(email, user);
  authStore.usersById.set(id, user);
  return user;
}

function issueToken(userId) {
  const token = 't_' + Math.random().toString(36).slice(2) + Date.now();
  authStore.tokens.set(token, userId);
  return token;
}

function getTokenFromHeader(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  const userId = token && authStore.tokens.get(token);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  req.userId = userId;
  next();
}

app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    if (authStore.usersByEmail.has(email)) return res.status(409).json({ success: false, message: 'Email already registered' });
    const user = createUser(email, password);
    user.lastLogin = new Date().toISOString();
    const token = issueToken(user.id);
    return res.json({ success: true, message: 'Account created successfully', token, user: { id: user.id, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (e) {
    console.error('Signup error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.post('/api/auth/signin', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = authStore.usersByEmail.get(email);
    if (!user || user.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    user.lastLogin = new Date().toISOString();
    const token = issueToken(user.id);
    return res.json({ success: true, message: 'Signed in successfully', token, user: { id: user.id, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (e) {
    console.error('Signin error:', e);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (token) authStore.tokens.delete(token);
    return res.json({ success: true, message: 'Logged out' });
  } catch (e) {
    return res.json({ success: true });
  }
});

app.post('/api/onboarding', requireAuth, (req, res) => {
  try {
    const { userId, ...data } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const user = authStore.usersById.get(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    authStore.onboardingByUser.set(userId, data);
    user.onboardingCompleted = true;
    // Persist business profile from onboarding
    try {
      const existing = readBusinessProfile();
      const updated = {
        ...existing,
        business: {
          ...(existing.business || {}),
          name: data.businessName || existing.business?.name || '',
          about: data.businessAbout || existing.business?.about || '',
          tone: data.tone || existing.business?.tone || 'Friendly, helpful, concise'
        }
      };
      writeJsonSafe(profileFile, updated);
      refreshGlobalKB();
    } catch (_) {}
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// --- Messenger store, campaigns, mother AI configs ---
const dataPath = path.join(__dirname, 'data');
ensureDir(dataPath);
const messengerStoreFile = path.join(dataPath, 'messengerStore.json');
const campaignsFile = path.join(dataPath, 'campaigns.json');
const motherAIFile = path.join(dataPath, 'motherAI.json');

const messengerStore = { conversations: new Map(), systemPrompts: new Map() };

function readJsonSafe(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; } }

function loadMessengerStore() {
  const json = readJsonSafe(messengerStoreFile) || { conversations: [], systemPrompts: [] };
  messengerStore.conversations = new Map((json.conversations || []).map(c => [c.id, c]));
  messengerStore.systemPrompts = new Map((json.systemPrompts || []).map(s => [s.conversationId, s.systemPrompt]));
}

function saveMessengerStore() {
  const json = {
    conversations: Array.from(messengerStore.conversations.values()),
    systemPrompts: Array.from(messengerStore.systemPrompts.entries()).map(([conversationId, systemPrompt]) => ({ conversationId, systemPrompt }))
  };
  writeJsonSafe(messengerStoreFile, json);
}

// --- Simple analytics (messages sent/received per channel) ---
const analyticsFile = path.join(dataPath, 'analytics.json');
function defaultAnalytics() {
  return {
    counters: {
      messenger: { sent: 0, received: 0 },
      whatsapp: { sent: 0, received: 0 },
      instagram: { sent: 0, received: 0 },
      total: { sent: 0, received: 0 }
    }
  };
}
function loadAnalytics() { return readJsonSafe(analyticsFile) || defaultAnalytics(); }
function saveAnalytics(a) { writeJsonSafe(analyticsFile, a || defaultAnalytics()); }
function bumpAnalytics(channel, direction) {
  try {
    const a = loadAnalytics();
    const key = String(channel || 'messenger');
    a.counters[key] = a.counters[key] || { sent: 0, received: 0 };
    if (direction === 'sent') { a.counters[key].sent += 1; a.counters.total.sent += 1; }
    if (direction === 'received') { a.counters[key].received += 1; a.counters.total.received += 1; }
    saveAnalytics(a);
  } catch (_) {}
}

// --- Helpers to upsert conversations/messages locally ---
function ensureConversation(conversationId, seed) {
  const convId = String(conversationId);
  const existing = messengerStore.conversations.get(convId) || null;
  if (existing) return existing;
  const base = {
    id: convId,
    name: (seed && seed.name) || convId,
    username: (seed && seed.username) || '',
    profilePic: (seed && seed.profilePic) || null,
    lastMessage: '',
    timestamp: new Date().toISOString(),
    aiMode: false,
    pending: { autoStartIfFirstMessage: false, initialMessage: '', profileId: 'default' },
    messages: [],
    ownerUserId: (seed && seed.ownerUserId) || getDefaultOwnerUserId() || ''
  };
  messengerStore.conversations.set(convId, base);
  saveMessengerStore();
  return base;
}
function appendMessage(conversationId, message) {
  const conv = ensureConversation(conversationId);
  conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
  conv.messages.push(message);
  conv.lastMessage = message.text;
  conv.timestamp = message.timestamp;
  messengerStore.conversations.set(conversationId, conv);
  saveMessengerStore();
  try { io.emit('messenger:message_created', { conversationId, message }); } catch (_) {}
  return conv;
}

const campaignsStore2 = { campaigns: new Map() };
function loadCampaigns() {
  const json = readJsonSafeEnsure(campaignsFile, { campaigns: [] });
  const arr = Array.isArray(json.campaigns) ? json.campaigns : [];
  campaignsStore2.campaigns = new Map(arr.map(c => [c.id, c]));
}
function saveCampaigns() {
  const arr = Array.from(campaignsStore2.campaigns.values());
  writeJsonSafe(campaignsFile, { campaigns: arr });
}
// Ensure an owner has at least one campaign; create a default if missing
function ensureDefaultCampaignForOwner(ownerUserId) {
  try {
    const owner = String(ownerUserId || '');
    if (!owner) return null;
    const any = Array.from(campaignsStore2.campaigns.values()).some(c => String(c.ownerUserId || '') === owner);
    if (any) return null;
    const profile = readBusinessProfile() || {};
    const bizName = (profile.business && profile.business.name) ? String(profile.business.name) : 'Default Product';
    const about = (profile.business && profile.business.about) ? String(profile.business.about) : '';
    const id = 'c_' + Date.now();
    // Derive specs from about/description when available
    let specs = [];
    try {
      const parts = String(about || '')
        .split(/\n|\r|•|\-|\u2022|\.|;|\|/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && /[a-zA-Z0-9]/.test(s));
      specs = Array.from(new Set(parts)).slice(0, 8);
    } catch (_) { specs = []; }
    // Derive price if present in about
    const price = derivePriceFromText(about);
    const created = { id, name: bizName, ownerUserId: owner, brief: { description: about }, specs, price };
    campaignsStore2.campaigns.set(id, created);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return created;
  } catch (_) { return null; }
}
loadCampaigns();

// --- Mother AI Config Store ---
const motherAIStore = { items: [], activeMotherAIId: null };
function loadMotherAIStore() {
  const json = readJsonSafeEnsure(motherAIFile, { items: [], activeMotherAIId: null });
  motherAIStore.items = Array.isArray(json.items) ? json.items : [];
  motherAIStore.activeMotherAIId = json.activeMotherAIId || null;
}
function saveMotherAIStore() {
  writeJsonSafe(motherAIFile, { items: motherAIStore.items, activeMotherAIId: motherAIStore.activeMotherAIId || null });
}
function getActiveMotherAI() {
  const id = motherAIStore.activeMotherAIId;
  if (!id) return null;
  return motherAIStore.items.find(i => i.id === id) || null;
}
loadMotherAIStore();

// --- WEBHOOKS, routes etc. (trimmed) ---
// ... existing webhook handlers earlier in file ...

// Minimal campaigns API for UI
app.get('/api/campaigns', (_req, res) => {
  try {
    const ownerUserId = String((_req.query && _req.query.ownerUserId) || '');
    const all = Array.from(campaignsStore2.campaigns.values());
    const filtered = ownerUserId ? all.filter(c => String(c.ownerUserId || '') === ownerUserId) : all;
    const arr = filtered.map(c => ({
      id: c.id,
      name: c.name || c.id,
      ownerUserId: c.ownerUserId || '',
      specs: Array.isArray(c.specs) ? c.specs : [],
      brief: { description: (c.brief && c.brief.description) || '' }
    }));
    return res.json(arr);
  } catch (e) {
    return res.status(500).json({ error: 'campaigns_list_failed' });
  }
});

// Upsert a campaign (rename or create)
app.post('/api/campaigns', (req, res) => {
  try {
    const body = req.body || {};
    // Support both frontend structure (brief, leads, message, flow, files) and backend structure (description, target, chatFlow, outreach)
    const { id, name, description, specs, ownerUserId, persona, target, chatFlow, outreach, price, brief, leads, message, flow, files } = body;
    const cid = String(id || ('c_' + Date.now()));
    const existing = campaignsStore2.campaigns.get(cid) || { id: cid, name: cid, brief: { description: '', channels: [] }, ownerUserId: '', specs: [], persona: {}, target: {}, chatFlow: {}, outreach: '', price: '' };
    
    // Extract description from either brief.description (frontend) or description (backend)
    let finalDescription = '';
    if (brief && typeof brief.description === 'string') {
      finalDescription = brief.description;
    } else if (typeof description === 'string') {
      finalDescription = description;
    } else {
      finalDescription = (existing.brief && existing.brief.description) || '';
    }
    
    // Extract channels from brief.channels (frontend)
    let finalChannels = [];
    if (brief && Array.isArray(brief.channels)) {
      finalChannels = brief.channels;
    } else if (existing.brief && Array.isArray(existing.brief.channels)) {
      finalChannels = existing.brief.channels;
    }
    
    // Map leads (frontend) to target (backend)
    let finalTarget = {};
    if (leads && typeof leads === 'object') {
      finalTarget = {
        segment: leads.targetAudience || '',
        pains: leads.leadSource || '',
        ...leads
      };
    } else if (target && typeof target === 'object') {
      finalTarget = target;
    } else {
      finalTarget = existing.target || {};
    }
    
    // Map flow (frontend) to chatFlow (backend)
    let finalChatFlow = {};
    if (flow && typeof flow === 'object') {
      finalChatFlow = {
        opening: flow.objective || '',
        probing: flow.steps && flow.steps.length > 0 ? flow.steps.map(s => s.question || s).join('; ') : '',
        ...flow
      };
    } else if (chatFlow && typeof chatFlow === 'object') {
      finalChatFlow = chatFlow;
    } else {
      finalChatFlow = existing.chatFlow || {};
    }
    
    // Map message (frontend) to outreach (backend)
    let finalOutreach = '';
    if (message && typeof message === 'object') {
      const parts = [];
      if (message.initialMessage) parts.push('Initial: ' + message.initialMessage);
      if (message.followUpMessage) parts.push('Follow-up: ' + message.followUpMessage);
      finalOutreach = parts.join(' | ');
    } else if (typeof outreach === 'string') {
      finalOutreach = outreach;
    } else {
      finalOutreach = existing.outreach || '';
    }
    
    const updated = {
      ...existing,
      id: cid,
      name: typeof name === 'string' && name.trim() ? name.trim() : (existing.name || cid),
      brief: { 
        description: finalDescription,
        channels: finalChannels
      },
      specs: Array.isArray(specs) ? specs.map(s => String(s)) : (existing.specs || []),
      ownerUserId: typeof ownerUserId === 'string' ? ownerUserId : (existing.ownerUserId || ''),
      persona: (persona && typeof persona === 'object') ? persona : (existing.persona || {}),
      target: finalTarget,
      chatFlow: finalChatFlow,
      outreach: finalOutreach,
      price: typeof price === 'string' ? price : (existing.price || ''),
      // Store original frontend structure for reference
      leads: leads || existing.leads,
      message: message || existing.message,
      flow: flow || existing.flow,
      files: files || existing.files
    };
    // Auto-derive specs from description if specs are empty
    try {
      if ((!updated.specs || updated.specs.length === 0) && updated.brief && typeof updated.brief.description === 'string') {
        const desc = updated.brief.description || '';
        const parts = desc
          .split(/\n|\r|•|\-|\u2022|\.|;|\|/)
          .map(s => s.trim())
          .filter(s => s.length > 2 && /[a-zA-Z0-9]/.test(s));
        const dedup = Array.from(new Set(parts)).slice(0, 8);
        if (dedup.length) updated.specs = dedup;
      }
      // Auto-derive price from description if empty
      if (!updated.price && updated.brief && typeof updated.brief.description === 'string') {
        const inferred = derivePriceFromText(updated.brief.description);
        if (inferred) updated.price = inferred;
      }
    } catch (_) {}
    campaignsStore2.campaigns.set(cid, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ error: 'campaigns_upsert_failed' });
  }
});

// Patch a campaign (rename/description)
app.patch('/api/campaigns/:id', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    const body = req.body || {};
    const { name, description, specs, ownerUserId, persona, target, chatFlow, outreach, price, brief, leads, message, flow, files } = body;
    
    // Extract description from either brief.description (frontend) or description (backend)
    let finalDescription = (existing.brief && existing.brief.description) || '';
    if (brief && typeof brief.description === 'string') {
      finalDescription = brief.description;
    } else if (typeof description === 'string') {
      finalDescription = description;
    }
    
    // Extract channels from brief.channels (frontend)
    let finalChannels = (existing.brief && existing.brief.channels) || [];
    if (brief && Array.isArray(brief.channels)) {
      finalChannels = brief.channels;
    }
    
    // Map leads (frontend) to target (backend)
    let finalTarget = existing.target || {};
    if (leads && typeof leads === 'object') {
      finalTarget = {
        segment: leads.targetAudience || '',
        pains: leads.leadSource || '',
        ...leads
      };
    } else if (target && typeof target === 'object') {
      finalTarget = target;
    }
    
    // Map flow (frontend) to chatFlow (backend)
    let finalChatFlow = existing.chatFlow || {};
    if (flow && typeof flow === 'object') {
      finalChatFlow = {
        opening: flow.objective || '',
        probing: flow.steps && flow.steps.length > 0 ? flow.steps.map(s => s.question || s).join('; ') : '',
        ...flow
      };
    } else if (chatFlow && typeof chatFlow === 'object') {
      finalChatFlow = chatFlow;
    }
    
    // Map message (frontend) to outreach (backend)
    let finalOutreach = existing.outreach || '';
    if (message && typeof message === 'object') {
      const parts = [];
      if (message.initialMessage) parts.push('Initial: ' + message.initialMessage);
      if (message.followUpMessage) parts.push('Follow-up: ' + message.followUpMessage);
      finalOutreach = parts.join(' | ');
    } else if (typeof outreach === 'string') {
      finalOutreach = outreach;
    }
    
    const updated = {
      ...existing,
      name: typeof name === 'string' && name.trim() ? name.trim() : existing.name,
      brief: { 
        description: finalDescription,
        channels: finalChannels
      },
      specs: Array.isArray(specs) ? specs.map(s => String(s)) : (existing.specs || []),
      ownerUserId: typeof ownerUserId === 'string' ? ownerUserId : (existing.ownerUserId || ''),
      persona: (persona && typeof persona === 'object') ? persona : (existing.persona || {}),
      target: finalTarget,
      chatFlow: finalChatFlow,
      outreach: finalOutreach,
      price: typeof price === 'string' ? price : (existing.price || ''),
      // Store original frontend structure for reference
      leads: leads || existing.leads,
      message: message || existing.message,
      flow: flow || existing.flow,
      files: files || existing.files
    };
    // Auto-derive specs from description if specs are empty
    try {
      if ((!updated.specs || updated.specs.length === 0) && updated.brief && typeof updated.brief.description === 'string') {
        const desc = updated.brief.description || '';
        const parts = desc
          .split(/\n|\r|•|\-|\u2022|\.|;|\|/)
          .map(s => s.trim())
          .filter(s => s.length > 2 && /[a-zA-Z0-9]/.test(s));
        const dedup = Array.from(new Set(parts)).slice(0, 8);
        if (dedup.length) updated.specs = dedup;
      }
      // Auto-derive price from description if empty
      if (!updated.price && updated.brief && typeof updated.brief.description === 'string') {
        const inferred2 = derivePriceFromText(updated.brief.description);
        if (inferred2) updated.price = inferred2;
      }
    } catch (_) {}
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ error: 'campaigns_patch_failed' });
  }
});

// Set structured specs for a campaign
app.post('/api/campaigns/:id/specs', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    const specs = Array.isArray(req.body && req.body.specs) ? req.body.specs.map(s => String(s)) : [];
    const updated = { ...existing, specs };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_specs_failed' });
  }
});

// Start a campaign (mark active, no conversation creation per requirements)
app.post('/api/campaigns/:id/start', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    const updated = { ...existing, active: true, startedAt: new Date().toISOString() };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_start_failed' });
  }
});

// Stop a campaign
app.post('/api/campaigns/:id/stop', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existing = campaignsStore2.campaigns.get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'campaign_not_found' });
    const updated = { ...existing, active: false, stoppedAt: new Date().toISOString(), status: 'paused' };
    campaignsStore2.campaigns.set(id, updated);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, campaign: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_stop_failed' });
  }
});

// Delete a campaign
app.delete('/api/campaigns/:id', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const existed = campaignsStore2.campaigns.delete(id);
    saveCampaigns();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, deleted: existed });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'campaign_delete_failed' });
  }
});

// --- Messenger chat APIs ---
// List conversations
app.get('/api/messenger/conversations', (_req, res) => {
  try {
    const arr = Array.from(messengerStore.conversations.values()).map(c => ({
      id: c.id,
      name: c.name || c.username || c.id,
      profilePic: c.profilePic || null,
      lastMessage: c.lastMessage || '',
      timestamp: c.timestamp || new Date().toISOString(),
      ownerUserId: c.ownerUserId || ''
    }));
    return res.json(arr);
  } catch (e) {
    return res.status(500).json({ error: 'conversations_list_failed' });
  }
});

// Manage conversation owner (manual override)
app.post('/api/messenger/conversation-owner', (req, res) => {
  try {
    const { conversationId, ownerUserId } = req.body || {};
    const convId = String(conversationId || '');
    const owner = String(ownerUserId || '');
    if (!convId || !owner) return res.status(400).json({ success: false, message: 'conversationId_and_ownerUserId_required' });
    const conv = ensureConversation(convId);
    conv.ownerUserId = owner;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    return res.json({ success: true, conversationId: convId, ownerUserId: owner });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'set_owner_failed' });
  }
});

app.get('/api/messenger/conversation-owner', (req, res) => {
  try {
    const convId = String(req.query.conversationId || '');
    if (!convId) return res.status(400).json({ success: false, message: 'conversationId_required' });
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ success: false, message: 'conversation_not_found' });
    return res.json({ success: true, conversationId: convId, ownerUserId: conv.ownerUserId || '' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'get_owner_failed' });
  }
});

// Sync Messenger conversations from Facebook if configured
app.post('/api/messenger/sync', async (_req, res) => {
  try {
    const { pageToken, pageId } = config.facebook;
    if (!pageToken || !pageId) return res.status(400).json({ success: false, error: 'facebook_not_configured' });
    const fbConvs = await fetchFacebookConversations(pageToken, pageId);
    for (const c of fbConvs) {
      // Upsert conversation
      const existing = messengerStore.conversations.get(c.id) || null;
      const base = existing || { id: c.id, messages: [] };
      const updated = {
        ...base,
        name: c.name || base.name || c.id,
        username: c.username || base.username || '',
        profilePic: c.profilePic || base.profilePic || null,
        lastMessage: c.lastMessage || base.lastMessage || '',
        timestamp: c.timestamp || base.timestamp || new Date().toISOString(),
        aiMode: typeof base.aiMode === 'boolean' ? base.aiMode : false,
        pending: base.pending || { autoStartIfFirstMessage: false, initialMessage: '', profileId: 'default' },
        messages: Array.isArray(base.messages) && base.messages.length > 0 ? base.messages : (c.messages || [])
      };
      messengerStore.conversations.set(c.id, updated);
    }
    saveMessengerStore();
    try { io.emit('messenger:conversations_synced'); } catch (_) {}
    return res.json({ success: true, count: messengerStore.conversations.size });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'sync_failed' });
  }
});

// Create/register a conversation or pending entry
app.post('/api/messenger/conversations', (req, res) => {
  try {
    const { id, name, username, autoStartIfFirstMessage, systemPrompt, initialMessage, profileId } = req.body || {};
    const convId = String(id || ('conv_' + Date.now()));
    const existing = messengerStore.conversations.get(convId) || null;
    const base = existing || { id: convId, messages: [] };
    const updated = {
      ...base,
      name: typeof name === 'string' && name ? name : (base.name || username || convId),
      username: typeof username === 'string' ? username : (base.username || ''),
      profilePic: base.profilePic || null,
      lastMessage: base.lastMessage || '',
      timestamp: base.timestamp || new Date().toISOString(),
      aiMode: typeof base.aiMode === 'boolean' ? base.aiMode : false,
      pending: { autoStartIfFirstMessage: !!autoStartIfFirstMessage, initialMessage: initialMessage || '', profileId: profileId || 'default' }
    };
    if (typeof systemPrompt === 'string') messengerStore.systemPrompts.set(convId, systemPrompt);
    messengerStore.conversations.set(convId, updated);
    saveMessengerStore();
    try { io.emit('messenger:conversation_created', updated); } catch (_) {}
    return res.json({ success: true, conversation: updated });
  } catch (e) {
    return res.status(500).json({ error: 'conversation_create_failed' });
  }
});

// Get messages for a conversation
app.get('/api/messenger/messages', (req, res) => {
  try {
    const convId = String(req.query.conversationId || '');
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ error: 'conversation_not_found' });
    const systemPrompt = messengerStore.systemPrompts.get(convId) || '';
    return res.json({
      messages: Array.isArray(conv.messages) ? conv.messages : [],
      systemPrompt,
      aiMode: !!conv.aiMode,
      ownerUserId: conv.ownerUserId || ''
    });
  } catch (e) {
    return res.status(500).json({ error: 'messages_fetch_failed' });
  }
});

// Send a message in a conversation
app.post('/api/messenger/send-message', async (req, res) => {
  try {
    const { conversationId, text, sender } = req.body || {};
    const convId = String(conversationId || '');
    if (!convId) return res.status(400).json({ error: 'conversationId_required' });
    if (!text) return res.status(400).json({ error: 'text_required' });
    const conv = messengerStore.conversations.get(convId) || { id: convId, name: convId, messages: [], aiMode: false, ownerUserId: '' };
    const msg = { id: 'm_' + Date.now(), sender: sender || 'agent', text: String(text), timestamp: new Date().toISOString(), isRead: true };
    conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
    conv.messages.push(msg);
    conv.lastMessage = msg.text;
    conv.timestamp = msg.timestamp;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    try { io.emit('messenger:message_created', { conversationId: convId, message: msg }); } catch (_) {}

    // Bridge to Facebook Messenger if configured and sender is agent
    if ((sender || 'agent') === 'agent' && config.facebook.pageToken) {
      try {
        await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${config.facebook.pageToken}`, {
          recipient: { id: convId }, // convId should be PSID for real FB convs
          messaging_type: 'RESPONSE',
          message: { text: String(text).slice(0, 900) }
        }, { headers: { 'Content-Type': 'application/json' } });
        bumpAnalytics('messenger', 'sent');
      } catch (err) {
        const e = err && err.response && err.response.data && err.response.data.error;
        const code = e && e.code;
        const subcode = e && e.error_subcode;
        const canRetryWithTag = Boolean(config.facebook.messageTag);
        const is24hWindowError = (code === 10 && subcode === 2018278);
        if (is24hWindowError && canRetryWithTag) {
          try {
            await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${config.facebook.pageToken}`, {
              recipient: { id: convId },
              messaging_type: 'MESSAGE_TAG',
              tag: config.facebook.messageTag,
              message: { text: String(text).slice(0, 900) }
            }, { headers: { 'Content-Type': 'application/json' } });
            bumpAnalytics('messenger', 'sent');
          } catch (err2) {
            console.warn('FB send (tag) failed:', err2.response?.data || err2.message);
          }
        } else {
          // Log but continue
          console.warn('FB send failed:', err.response?.data || err.message);
        }
      }
    }

    // If this is a customer message and Global AI is enabled, optionally auto-reply locally
    if ((sender || 'agent') === 'customer' && config.ai.globalAiEnabled) {
      try {
        const contextUserId = conv.ownerUserId || convId;
        const { reply } = await answerWithGlobalAI(String(text), contextUserId);
        const aiMsg = { id: 'm_' + (Date.now() + 1), sender: 'agent', text: String(reply).slice(0, 900), timestamp: new Date().toISOString(), isRead: true };
        conv.messages.push(aiMsg);
        conv.lastMessage = aiMsg.text;
        conv.timestamp = aiMsg.timestamp;
        messengerStore.conversations.set(convId, conv);
        saveMessengerStore();
        try { io.emit('messenger:message_created', { conversationId: convId, message: aiMsg }); } catch (_) {}
      } catch (_) {}
    }

    return res.json({ success: true, message: msg });
  } catch (e) {
    return res.status(500).json({ error: 'send_failed' });
  }
});

// Toggle AI mode per conversation
app.post('/api/messenger/ai-mode', (req, res) => {
  try {
    const { conversationId, enabled } = req.body || {};
    const convId = String(conversationId || '');
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ error: 'conversation_not_found' });
    conv.aiMode = !!enabled;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    return res.json({ success: true, aiMode: conv.aiMode });
  } catch (e) {
    return res.status(500).json({ error: 'ai_mode_failed' });
  }
});

// Explicit AI reply helper
app.post('/api/messenger/ai-reply', async (req, res) => {
  try {
    const { conversationId, lastUserMessage, systemPrompt } = req.body || {};
    const convId = String(conversationId || '');
    if (!convId) return res.status(400).json({ error: 'conversationId_required' });
    const conv = messengerStore.conversations.get(convId);
    if (!conv) return res.status(404).json({ error: 'conversation_not_found' });
    if (typeof systemPrompt === 'string') messengerStore.systemPrompts.set(convId, systemPrompt);
    const contextUserId = (conv && conv.ownerUserId) ? conv.ownerUserId : convId;
    const { reply } = await answerWithGlobalAI(String(lastUserMessage || ''), contextUserId);
    const aiMsg = { id: 'm_' + Date.now(), sender: 'agent', text: String(reply).slice(0, 900), timestamp: new Date().toISOString(), isRead: true };
    conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
    conv.messages.push(aiMsg);
    conv.lastMessage = aiMsg.text;
    conv.timestamp = aiMsg.timestamp;
    messengerStore.conversations.set(convId, conv);
    saveMessengerStore();
    try { io.emit('messenger:message_created', { conversationId: convId, message: aiMsg }); } catch (_) {}
    return res.json({ success: true, message: aiMsg });
  } catch (e) {
    return res.status(500).json({ error: 'ai_reply_failed' });
  }
});

// Save system prompt per conversation
app.post('/api/messenger/system-prompt', (req, res) => {
  try {
    const { conversationId, systemPrompt } = req.body || {};
    const convId = String(conversationId || '');
    if (!convId) return res.status(400).json({ success: false, message: 'conversationId_required' });
    if (typeof systemPrompt !== 'string') return res.status(400).json({ success: false, message: 'systemPrompt_required' });
    // ensure conversation exists to keep things consistent
    ensureConversation(convId);
    messengerStore.systemPrompts.set(convId, systemPrompt);
    saveMessengerStore();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'system_prompt_save_failed' });
  }
});

// Activate a Mother AI config and refresh Global KB
app.post('/api/mother-ai/activate/:id', (req, res) => {
  try {
    const id = String(req.params.id || '');
    const found = motherAIStore.items.find(i => i.id === id);
    if (!found) return res.status(404).json({ error: 'not_found' });
    motherAIStore.activeMotherAIId = id;
    saveMotherAIStore();
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({ success: true, activeMotherAIId: id });
  } catch (e) {
    return res.status(500).json({ error: 'activate_failed' });
  }
});

// Global AI direct answer endpoint
app.post('/api/global-ai/answer', async (req, res) => {
  try {
    const { userId, conversationId } = req.body || {};
    // Accept both `text` and legacy `prompt`
    const incomingText = (req.body && (req.body.text || req.body.prompt)) || '';
    if (!incomingText) return res.status(400).json({ success: false, error: 'text_required' });
    const uid = String(userId || 'anon');
    const { reply, sources } = await answerWithGlobalAI(String(incomingText), uid);
    try { appendMemory(uid, String(conversationId || ''), `Asked: ${String(incomingText).slice(0, 48)}`, { lastText: incomingText, sources }); } catch (_) {}
    return res.json({ success: true, reply, text: reply, sources });
  } catch (e) {
    const msg = (e && e.message) || 'internal_error';
    return res.status(500).json({ success: false, error: msg });
  }
});

// Provide helpful info on accidental GETs to this endpoint
app.get('/api/global-ai/answer', (_req, res) => {
  try {
    return res.status(405).json({
      success: false,
      error: 'method_not_allowed',
      usage: {
        method: 'POST',
        path: '/api/global-ai/answer',
        body: { text: 'your question', userId: 'optional', conversationId: 'optional' }
      }
    });
  } catch (_) {
    return res.status(405).json({ success: false, error: 'method_not_allowed' });
  }
});

// Lightweight AI test endpoint for frontend diagnostics
app.post('/api/ai/test', async (req, res) => {
  try {
    // Accept both `text` and legacy `prompt`
    const text = (req.body && (req.body.text || req.body.prompt)) || '';
    const userId = (req.body && req.body.userId) ? String(req.body.userId) : 'assistant';
    const conversationId = (req.body && req.body.conversationId) ? String(req.body.conversationId) : '';
    if (!text) {
      // basic connectivity + config ping
      return res.json({ success: true, pong: true, globalAiEnabled: !!config.ai.globalAiEnabled });
    }
    const { reply, sources } = await answerWithGlobalAI(String(text), userId || 'diagnostic');
    try { appendMemory(userId, conversationId, `Assistant asked: ${String(text).slice(0, 48)}`, { lastText: text, sources, channel: 'assistant' }); } catch (_) {}
    return res.json({ success: true, reply, text: reply, sources });
  } catch (e) {
    return res.status(500).json({ success: false, error: (e && e.message) || 'internal_error' });
  }
});

// Provide helpful info on accidental GETs to this endpoint
app.get('/api/ai/test', (_req, res) => {
  try {
    return res.json({
      success: true,
      pong: true,
      globalAiEnabled: !!config.ai.globalAiEnabled,
      usage: { method: 'POST', path: '/api/ai/test', body: { text: 'your prompt' } }
    });
  } catch (_) {
    return res.status(200).json({ success: true, pong: true });
  }
});

// Retrieve recent assistant memories for a user
app.get('/api/ai/memory', (req, res) => {
  try {
    const userId = String(req.query.userId || '');
    const limit = parseInt(String(req.query.limit || '5'), 10) || 5;
    if (!userId) return res.status(400).json({ success: false, error: 'userId_required' });
    const items = getRecentMemories(userId, limit);
    return res.json({ success: true, items });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'memory_fetch_failed' });
  }
});

// AI config endpoints (toggle Global AI, mode, memory)
app.get('/api/ai/config', (_req, res) => {
  try {
    return res.json({
      success: true,
      config: {
        globalAiEnabled: !!config.ai.globalAiEnabled,
        globalAiMode: config.ai.globalAiMode || 'replace',
        memoryEnabled: !!config.ai.memoryEnabled
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

app.post('/api/ai/config', (req, res) => {
  try {
    const { globalAiEnabled, globalAiMode, memoryEnabled } = req.body || {};
    if (typeof globalAiEnabled === 'boolean') config.ai.globalAiEnabled = globalAiEnabled;
    if (globalAiMode && (globalAiMode === 'replace' || globalAiMode === 'hybrid')) config.ai.globalAiMode = globalAiMode;
    if (typeof memoryEnabled === 'boolean') config.ai.memoryEnabled = memoryEnabled;
    try { refreshGlobalKB(); } catch (_) {}
    return res.json({
      success: true,
      config: {
        globalAiEnabled: !!config.ai.globalAiEnabled,
        globalAiMode: config.ai.globalAiMode || 'replace',
        memoryEnabled: !!config.ai.memoryEnabled
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

// WhatsApp webhook (verification + inbound handling)
app.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expected = config.whatsapp.verifyToken || config.webhook.verifyToken || 'WORKFLOW_VERIFY_TOKEN';
    if (mode === 'subscribe' && String(token) === String(expected) && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  } catch (_) {
    return res.status(500).send('error');
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(200);
    }
    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const ch of changes) {
        const value = ch && ch.value ? ch.value : {};
        const messages = Array.isArray(value.messages) ? value.messages : [];
        const phoneNumberId = (value.metadata && value.metadata.phone_number_id) || config.whatsapp.phoneNumberId;
        for (const msg of messages) {
          try {
            const from = msg.from || msg.phone_number || msg.wa_id || 'unknown';
            const type = msg.type;
            const text = type === 'text' ? (msg.text && msg.text.body) : (msg.body || '');
            if (!text) continue;
            // Use Global AI if enabled
            if (config.ai.globalAiEnabled) {
              const { reply, sources } = await answerWithGlobalAI(String(text), String(from));
              try { appendMemory(String(from), String(msg.id || ''), `WA: ${String(text).slice(0,48)}`, { channel: 'whatsapp', sources }); } catch (_) {}
              // Send reply
              const { token } = getWhatsappCreds();
              if (phoneNumberId && token) {
                await axios.post(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
                  messaging_product: 'whatsapp',
                  to: from,
                  type: 'text',
                  text: { body: String(reply).slice(0, 900) }
                }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
              }
            }
          } catch (e) {
            // swallow per-message errors
          }
        }
      }
    }
    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(200);
  }
});

// WhatsApp utility endpoints (trimmed)
app.get('/api/integrations/whatsapp/config', (req, res) => {
  try {
    const hasToken = Boolean(config.whatsapp.token);
    const tokenMasked = hasToken ? `${config.whatsapp.token.slice(0, 6)}...${config.whatsapp.token.slice(-4)}` : null;
    const callbackUrl = (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/webhook` : 'http://localhost:10000/webhook');
    return res.json({
      success: true,
      whatsapp: {
        connected: !!(config.whatsapp.phoneNumberId && config.whatsapp.token),
        phoneNumberId: config.whatsapp.phoneNumberId || '',
        verifyTokenSet: Boolean(config.whatsapp.verifyToken),
        tokenMasked,
        callbackUrl,
        mode: config.whatsapp.mode || 'production'
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'internal_error' });
  }
});

app.post('/api/integrations/whatsapp/config', (req, res) => {
  try {
    const { token, phoneNumberId, verifyToken, mode } = req.body || {};
    if (!token || !phoneNumberId) return res.status(400).json({ success: false, message: 'token and phoneNumberId required' });
    config.whatsapp.token = String(token);
    config.whatsapp.phoneNumberId = String(phoneNumberId);
    if (verifyToken) config.whatsapp.verifyToken = String(verifyToken);
    if (mode && (mode === 'test' || mode === 'production')) config.whatsapp.mode = mode;
    return res.json({ success: true, whatsapp: { connected: true, phoneNumberId: config.whatsapp.phoneNumberId, verifyTokenSet: Boolean(config.whatsapp.verifyToken), mode: config.whatsapp.mode } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'internal_error' });
  }
});

app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, mode } = req.body || {};
    if (!phoneNumber || !message) return res.status(400).json({ error: 'Missing required fields' });
    const { token, phoneNumberId, mode: waMode } = getWhatsappCreds(mode);
    if (!phoneNumberId || !token) return res.status(400).json({ error: 'whatsapp_not_configured' });
    const resp = await axios.post(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: String(message).slice(0, 900) }
    }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-WA-Mode': waMode } });
    return res.json({ success: true, result: resp.data, mode: waMode });
  } catch (err) {
    const status = (err && err.response && err.response.status) || 500;
    const fbErr = err && err.response && err.response.data && err.response.data.error;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'whatsapp_send_failed',
      details: fbErr ? { message: fbErr.message, code: fbErr.code, subcode: fbErr.error_subcode } : undefined
    });
  }
});

app.get('/api/whatsapp/diagnose', async (_req, res) => {
  try {
    if (!config.whatsapp.phoneNumberId || !config.whatsapp.token) {
      return res.status(400).json({ success: false, issues: ['whatsapp_not_configured'] });
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
});

// Serve frontend build (Vite)
const clientDir = path.join(__dirname, '..', 'work-flow', 'dist');
app.use('/assets', express.static(path.join(clientDir, 'assets'), { maxAge: '1y', immutable: true }));
app.use(express.static(clientDir, { maxAge: '1h' }));

// Facebook App info for Integration banner
app.get('/api/facebook/app', (_req, res) => {
  try {
    return res.json({
      appId: config.facebook.appId || null,
      appName: process.env.FACEBOOK_APP_NAME || 'Facebook App',
      callback: config.facebook.callbackUrl || null
    });
  } catch (e) {
    return res.status(500).json({});
  }
});

// Integrations overall status
app.get('/api/integrations/status', (_req, res) => {
  try {
    const fbConnected = !!(config.facebook.pageToken && config.facebook.pageId);
    const waMode = config.whatsapp.mode || 'production';
    const waToken = waMode === 'test' ? (config.whatsapp.testToken || '') : (config.whatsapp.token || '');
    const waConnected = !!(config.whatsapp.phoneNumberId && waToken);

    return res.json({
      facebook: {
        connected: fbConnected,
        pageId: config.facebook.pageId || null,
        provider: config.facebook.provider || 'local'
      },
      whatsapp: {
        connected: waConnected,
        mode: waMode,
        phoneNumberId: config.whatsapp.phoneNumberId || null
      },
      instagram: {
        connected: false
      }
    });
  } catch (e) {
    return res.status(500).json({ facebook: { connected: false }, whatsapp: { connected: false }, instagram: { connected: false } });
  }
});

// Helper: fetch FB user profile picture URL
async function fetchFacebookProfilePic(pageToken, psid) {
  try {
    const resp = await axios.get(`https://graph.facebook.com/v18.0/${psid}/picture`, {
      params: { redirect: false, type: 'large', access_token: pageToken }
    });
    const data = resp && resp.data;
    return (data && data.data && data.data.url) ? data.data.url : null;
  } catch (_) {
    return null;
  }
}

// Helper function to fetch Facebook conversations
async function fetchFacebookConversations(pageToken, pageId) {

  try {
    // Fetch conversations from Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/conversations`, {
      params: {
        access_token: pageToken,
        fields: 'id,participants,messages.limit(10){message,from,to,created_time,id}',
        limit: 50
      }
    });

    const conversations = response.data.data || [];
    const normalizedConversations = [];

    for (const conv of conversations) {

      if (!conv.participants || !conv.participants.data) continue;

      // Find the customer participant (not the page)
      const customerParticipant = conv.participants.data.find(p => p.id !== pageId);
      if (!customerParticipant) continue;

      // Get the latest message
      const messages = conv.messages && conv.messages.data ? conv.messages.data : [];
      const lastMessage = messages.length > 0 ? messages[0] : null;

      // Create conversation object
      // IMPORTANT: use PSID (customerParticipant.id) as our canonical conversation ID.
      // This ensures outbound send via /me/messages works and inbound webhooks (sender.id) map to same ID.
      const conversation = {
        id: customerParticipant.id,
        threadId: conv.id,
        name: customerParticipant.name || customerParticipant.id,
        username: customerParticipant.id,
        profilePic: await fetchFacebookProfilePic(pageToken, customerParticipant.id),
        messages: messages.reverse().map(msg => ({
          id: msg.id,
          sender: msg.from.id === pageId ? 'agent' : 'customer',
          text: msg.message || '',
          timestamp: msg.created_time,
          isRead: true
        })),
        lastMessage: lastMessage ? (lastMessage.message || '') : '',
        timestamp: lastMessage ? lastMessage.created_time : new Date().toISOString(),
        aiMode: false,
        pending: { autoStartIfFirstMessage: false, initialMessage: '', profileId: 'default' }
      };


      normalizedConversations.push(conversation);
    }

    return normalizedConversations;
  } catch (error) {
    console.error('Error fetching Facebook conversations:', error.response?.data || error.message);
    return [];
  }
}

// Instagram OAuth
app.get('/auth/instagram', (req, res) => {
  try {
    const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${config.instagram.appId}&redirect_uri=${encodeURIComponent(config.instagram.redirectUri)}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
    console.log('🔗 Redirecting to Instagram Auth URL:', authUrl);
    res.redirect(authUrl);
  } catch (err) {
    console.error('🔥 Instagram login redirect error:', err);
    res.status(500).send('Server error during Instagram login');
  }
});

app.get('/auth/instagram/callback', async (req, res) => {
  try {
    console.log('📬 Received Instagram callback:', req.query);
    const { code, error, error_reason } = req.query;

    if (error) {
      throw new Error(`OAuth error: ${error_reason || 'unknown'} - ${error}`);
    }

    if (!code) {
      throw new Error('Authorization code is missing');
    }

    // Exchange code for token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: config.instagram.appId,
      client_secret: config.instagram.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.instagram.redirectUri,
      code: code
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': config.instagram.appId
      }
    });

    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      throw new Error('Invalid token response: ' + JSON.stringify(tokenResponse.data));
    }

    console.log('✅ Token exchange successful');
    const access_token = tokenResponse.data.access_token;
    const user_id = String(tokenResponse.data.user_id);

    // Calculate token expiration (60 days from now)
    const expirationTime = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
    // Note: In social-backend, token expirations might be handled differently, but for now, store in a map or persist

    // Get user profile
    const profileResponse = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: 'id,username,profile_picture_url',
        access_token: access_token
      },
      headers: { 'X-IG-App-ID': config.instagram.appId }
    });

    console.log(`👋 User authenticated: ${profileResponse.data.username} (ID: ${user_id})`);

    // Store user data - adapt to social-backend's authStore
    // Assuming authStore is defined somewhere, perhaps add to users map
    // For now, use a simple in-memory store or persist to file
    const userData = {
      access_token,
      username: profileResponse.data.username,
      profile_pic: profileResponse.data.profile_picture_url,
      instagram_id: user_id,
      last_login: new Date(),
      platform: 'instagram'
    };

    // Persist to integrations.json or users
    const integrationsFile = path.join(dataDir, 'integrations.json');
    const current = readJsonSafeEnsure(integrationsFile, {});
    current.instagram = current.instagram || {};
    current.instagram[user_id] = userData;
    writeJsonSafe(integrationsFile, current);

    res.redirect(`/dashboard/integration?instagram_connected=1`);
  } catch (err) {
    console.error('🔥 Instagram authentication error:', err);
    res.redirect(`/?error=instagram_auth_failed&message=${encodeURIComponent('Instagram login failed. Please try again.')}`);
  }
});

// Facebook OAuth to fetch Page Access Token (optional convenience)
app.get('/auth/facebook', (req, res) => {
  try {
    const redirect = config.facebook.callbackUrl;
    if (!config.facebook.appId || !config.facebook.appSecret) {
      return res.status(400).send('facebook_app_not_configured');
    }
    const params = new URLSearchParams({
      client_id: config.facebook.appId,
      redirect_uri: redirect,
      scope: [
        'pages_messaging',
        'pages_manage_metadata',
        'pages_read_engagement',
        'pages_show_list'
      ].join(','),
      response_type: 'code',
      auth_type: 'rerequest'
    }).toString();
    return res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
  } catch (e) {
    return res.status(500).send('auth_error');
  }
});

app.get('/auth/facebook/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('missing_code');
    const redirect = config.facebook.callbackUrl;
    const tokenResp = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: config.facebook.appId,
        client_secret: config.facebook.appSecret,
        redirect_uri: redirect,
        code
      }
    });
    const userAccessToken = tokenResp.data && tokenResp.data.access_token;
    if (!userAccessToken) return res.status(400).send('no_user_token');

    // Fetch pages for this user and pick a page
    const pagesResp = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: userAccessToken }
    });
    const pages = Array.isArray(pagesResp.data && pagesResp.data.data) ? pagesResp.data.data : [];
    if (!pages.length) return res.status(400).send('no_pages_found');

    const desiredPageId = process.env.FB_PAGE_ID || config.facebook.pageId || null;
    let page = null;
    if (desiredPageId) {
      page = pages.find(p => String(p.id) === String(desiredPageId)) || null;
    }
    if (!page) page = pages[0];

    const pageToken = page && page.access_token;
    const pageId = page && page.id;
    if (!pageToken || !pageId) return res.status(400).send('no_page_token');

    // Save in-memory
    config.facebook.pageToken = pageToken;
    config.facebook.pageId = pageId;

    // Persist to disk so it survives restarts
    try {
      const integrationsFile = path.join(dataDir, 'integrations.json');
      const current = readJsonSafeEnsure(integrationsFile, { facebook: {} });
      current.facebook = current.facebook || {};
      current.facebook.pageId = pageId;
      current.facebook.pageToken = pageToken;
      current.facebook.connectedAt = new Date().toISOString();
      writeJsonSafe(integrationsFile, current);
    } catch (_) {}

    // Redirect to Integration dashboard immediately with absolute URL; HTML fallback if redirect fails
    const baseUrl = process.env.RENDER_EXTERNAL_URL || '';
    const nextUrl = `${baseUrl}/dashboard/integration?connected=1`;
    try {
      return res.redirect(302, nextUrl);
    } catch (_) {
      return res
        .status(200)
        .send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Facebook Connected</title>
  <meta http-equiv="refresh" content="0; url=${nextUrl}" />
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(148,163,184,0.2); padding: 24px 28px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #94a3b8; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 10px 16px; border-radius: 10px; background: linear-gradient(135deg, #059669, #2563eb); color: white; text-decoration: none; font-weight: 600; }
  </style>
  <script>
    try {
      // Mark integration flag and ensure SPA can enter dashboard without manual login (demo UX)
      window.localStorage.setItem('integration_connected', '1');
      const existingUser = window.localStorage.getItem('user');
      if (!existingUser) {
        const demoUser = { id: 'oauth-user', email: 'oauth@return.local', role: 'user', onboardingCompleted: true };
        window.localStorage.setItem('user', JSON.stringify(demoUser));
      }
    } catch (e) {}
    setTimeout(function(){ window.location.replace('${nextUrl}'); }, 60);
  </script>
</head>
<body>
  <div class="card">
    <div class="title">Facebook connected</div>
    <div class="desc">Page token saved. Redirecting you to Integration dashboard…</div>
    <a class="btn" href="${nextUrl}">Go to Dashboard</a>
  </div>
</body>
</html>`);
    }
  } catch (e) {
    const msg = e && e.response && e.response.data ? JSON.stringify(e.response.data) : (e.message || 'error');
    return res.status(500).send(msg);
  }
});

// Facebook Messenger webhook (optional direct page webhooks)
app.get('/messenger/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expected = config.webhook.verifyToken || 'WORKFLOW_VERIFY_TOKEN';
    if (mode === 'subscribe' && String(token) === String(expected) && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('forbidden');
  } catch (_) {
    return res.status(500).send('error');
  }
});

app.post('/messenger/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.object !== 'page') {
      return res.sendStatus(200);
    }
    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const pageId = String(entry && entry.id || '');
      let pageOwner = pageId ? getOwnerForPage(pageId) : '';
      if (!pageOwner && pageId) { try { pageOwner = ensurePageOwner(pageId) || ''; } catch (_) {} }
      // Removed auto-default-campaign enforcement; rely on existing campaigns for this owner
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];
      for (const event of messaging) {
        try {
          const senderId = event.sender && event.sender.id ? String(event.sender.id) : null;
          const text = event.message && event.message.text ? String(event.message.text) : '';
          if (!senderId) continue;
          if (text) {
            const incoming = { id: String(event.message && event.message.mid || ('m_' + Date.now())), sender: 'customer', text, timestamp: new Date().toISOString(), isRead: false };
            const conv = appendMessage(senderId, incoming);
            try { io.emit('messenger:message_created', { conversationId: senderId, message: incoming }); } catch (_) {}
            // If profilePic is missing, try to fetch it now for better UI
            try {
              if (!conv.profilePic && config.facebook.pageToken) {
                const pic = await fetchFacebookProfilePic(config.facebook.pageToken, senderId);
                if (pic) {
                  conv.profilePic = pic;
                  messengerStore.conversations.set(senderId, conv);
                  saveMessengerStore();
                  try { io.emit('messenger:conversation_created', conv); } catch (_) {}
                }
              }
            } catch (_) {}
            bumpAnalytics('messenger', 'received');
          }

          // If Global AI enabled, auto-reply on Messenger
          if (text && config.ai.globalAiEnabled) {
            const conv = ensureConversation(senderId);
            // If page has owner mapping, enforce it on the conversation
            if (pageOwner && !conv.ownerUserId) {
              conv.ownerUserId = pageOwner;
              messengerStore.conversations.set(senderId, conv);
              saveMessengerStore();
            }
            // Removed auto-default-campaign enforcement; rely on existing campaigns for this owner
            const contextUserId = (conv && conv.ownerUserId) ? conv.ownerUserId : (pageOwner || senderId);
            const { reply, sources } = await answerWithGlobalAI(text, contextUserId);
            try { appendMemory(senderId, String(event.message && event.message.mid || ''), `FB: ${text.slice(0,48)}`, { channel: 'messenger', sources }); } catch (_) {}
            // Always append and emit the AI reply to dashboard for visibility
            const outgoing = { id: 'm_' + (Date.now() + 1), sender: 'agent', text: String(reply).slice(0, 900), timestamp: new Date().toISOString(), isRead: true };
            appendMessage(senderId, outgoing);
            try { io.emit('messenger:message_created', { conversationId: senderId, message: outgoing }); } catch (_) {}
            // Attempt to send to Facebook if pageToken configured
            if (config.facebook.pageToken) {
              try {
                await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${config.facebook.pageToken}`, {
                  recipient: { id: senderId },
                  message: { text: String(reply).slice(0, 900) }
                }, { headers: { 'Content-Type': 'application/json' } });
                bumpAnalytics('messenger', 'sent');
              } catch (sendErr) {
                try { console.warn('FB send failed (will keep local):', sendErr?.response?.data || sendErr?.message); } catch (_) {}
              }
            } else {
              try { console.warn('FB pageToken not configured; AI reply stored locally only.'); } catch (_) {}
            }
          }
        } catch (e) {
          // ignore per-message errors
        }
      }
    }
    return res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(200);
  }
});

// Mother AI endpoints (kept for compatibility with flow builder data)
app.get('/api/mother-ai', (_req, res) => {
  try {
    return res.json({ items: motherAIStore.items, activeMotherAIId: motherAIStore.activeMotherAIId || null });
  } catch (e) {
    return res.status(500).json({ error: 'list_failed' });
  }
});

app.post('/api/mother-ai', (req, res) => {
  try {
    const item = (req.body && req.body.item) || {};
    if (!item.id) item.id = 'mai_' + Date.now();
    const idx = motherAIStore.items.findIndex(i => i.id === item.id);
    if (idx >= 0) motherAIStore.items[idx] = item; else motherAIStore.items.push(item);
    saveMotherAIStore();
    return res.json({ success: true, items: motherAIStore.items, activeMotherAIId: motherAIStore.activeMotherAIId || null, lastId: item.id });
  } catch (e) {
    return res.status(500).json({ error: 'save_failed' });
  }
});

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  // Do not capture API/auth/webhook routes
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/auth') ||
    req.path.startsWith('/webhook') ||
    req.path.startsWith('/messenger')
  ) {
    return res.status(404).send('Not found');
  }
  try {
    res.sendFile(path.join(clientDir, 'index.html'));
  } catch (e) {
    res.status(200).sendFile(path.join(clientDir, 'index.html'));
  }
});

// Start HTTP server
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});