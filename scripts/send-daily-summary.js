#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// email-config.json only needs dataFilePath (and optional SMTP fallback)
const configPath = path.join(__dirname, '..', 'email-config.json');
if (!fs.existsSync(configPath)) {
  console.error('email-config.json not found. Copy email-config.json.example and set dataFilePath.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!fs.existsSync(config.dataFilePath)) {
  console.error(`Data file not found: ${config.dataFilePath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(config.dataFilePath, 'utf8'));
const sections = raw.sections ?? raw ?? [];
const emailSettings = raw.emailSettings ?? {};

// SMTP: prefer app-configured settings, fall back to email-config.json
const smtp = (emailSettings.smtp?.host && emailSettings.smtp?.user && emailSettings.smtp?.pass)
  ? emailSettings.smtp
  : config.smtp;

const recipientEmail = emailSettings.recipientEmail || config.recipientEmail;

if (!recipientEmail) {
  console.error('No recipient email. Set it in the app (gear icon → "Send summary to").');
  process.exit(1);
}
if (!smtp?.host || !smtp?.user || !smtp?.pass) {
  console.error('No SMTP credentials. Set them in the app (gear icon → "Outgoing mail").');
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];

function getAllTasks(sections) {
  return sections.flatMap(s =>
    s.subsections.flatMap(sub =>
      sub.tasks.map(t => ({ ...t, sectionTitle: s.title, subsectionTitle: sub.title }))
    )
  );
}

const all = getAllTasks(sections);
const completedToday = all.filter(t => t.completed && t.completedAt === today);
const overdue       = all.filter(t => !t.completed && t.dueDate && t.dueDate < today);
const dueToday      = all.filter(t => !t.completed && t.dueDate === today);
const upcoming      = all.filter(t => {
  if (!t.dueDate || t.completed) return false;
  const diff = Math.ceil((new Date(t.dueDate + 'T00:00:00') - new Date()) / 86400000);
  return diff > 0 && diff <= 7;
});

function taskLine(t) {
  return `  • ${t.title} (${t.sectionTitle} → ${t.subsectionTitle})`;
}
function block(title, tasks) {
  if (!tasks.length) return '';
  return `\n${title} (${tasks.length})\n${tasks.map(taskLine).join('\n')}\n`;
}

const body = [
  `PriorityViz Daily Summary — ${today}`,
  '═'.repeat(45),
  block('✅ Completed Today', completedToday),
  block('🔴 Overdue',         overdue),
  block('📅 Due Today',       dueToday),
  block('⏳ Due This Week',   upcoming),
  (completedToday.length + overdue.length + dueToday.length + upcoming.length === 0)
    ? '\nNo tasks due or completed today.\n' : '',
].filter(Boolean).join('\n');

const htmlBody = body
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');

async function send() {
  let nodemailer;
  try { nodemailer = require('nodemailer'); }
  catch { console.error('nodemailer not installed. Run: npm install nodemailer'); process.exit(1); }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port ?? 587,
    secure: (smtp.port ?? 587) === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: smtp.user,
    to: recipientEmail,
    subject: `PriorityViz Summary — ${today}`,
    text: body,
    html: `<pre style="font-family:monospace;font-size:14px">${htmlBody}</pre>`,
  });

  console.log(`Summary sent to ${recipientEmail}`);
}

send().catch(err => { console.error('Failed:', err.message); process.exit(1); });
