# PriorityViz Local — Setup Guide

## Requirements

- **Node.js LTS** — download from https://nodejs.org
- **Chrome or Edge** browser (required for the file auto-save feature)

---

## First-time setup

1. Open Terminal in this folder
2. Run: `npm install`
3. Run: `npm run dev`
4. Open **http://localhost:5173** in Chrome or Edge
5. Click **"Create new data file"** and choose where to save your data (e.g. `Documents/priorityviz-data.json`)

Your data is saved automatically to that file whenever you make changes.

---

## Daily use

```bash
npm run dev
```

Open http://localhost:5173 — the app loads your data file automatically.

---

## Daily email summary (optional)

The companion script reads your data file and sends an email with completed tasks, overdue items, and upcoming deadlines.

### Setup

1. Copy the example config:
   ```bash
   cp email-config.json.example email-config.json
   ```

2. Edit `email-config.json`:
   - Set `dataFilePath` to the full path of your data file (the one you chose in the app)
   - Set `recipientEmail` to where you want the summary sent
   - Fill in your SMTP credentials

   **Gmail**: Enable 2FA, then create an App Password at https://myaccount.google.com/apppasswords

3. Test it:
   ```bash
   node scripts/send-daily-summary.js
   ```

4. Schedule it to run daily at 6 PM (Mac):
   ```bash
   bash scripts/setup-cron.sh
   ```

---

## Save a backup

Click **"Save copy"** in the top bar to download a backup JSON file at any time.

---

## Troubleshooting

**App shows "No file selected" on reload** — click "Open file" and re-select your data file. The browser may ask for permission again.

**File System Access API not working** — make sure you're using Chrome or Edge (not Safari or Firefox).

**Email not sending** — check `/tmp/pv-summary.log` for error details. For Gmail, confirm you're using an App Password, not your regular password.
