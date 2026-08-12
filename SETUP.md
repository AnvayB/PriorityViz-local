# PriorityViz — Windows Setup Guide

**One-time setup · ~10 minutes**

---

## Prerequisites

You'll need two tools installed before running the app: **Node.js** and **Git**.

---

## Step 1 — Install Node.js

1. Go to **[nodejs.org](https://nodejs.org)** and download the **LTS** version (the left button)
2. Run the installer with all default settings — make sure **"Add to PATH"** stays checked
3. Open **PowerShell** (`Win + X → Terminal`) and confirm it worked:

```powershell
node --version
npm --version
```

Both should print a version number (e.g. `v22.x.x`). If you see "not recognized", close and reopen PowerShell, then try again.

---

## Step 2 — Install Git

1. Go to **[git-scm.com/download/win](https://git-scm.com/download/win)** and download the installer
2. Run it with all default settings
3. Verify in PowerShell:

```powershell
git --version
```

---

## Step 3 — Download the app

In PowerShell, run:

```powershell
cd "$env:USERPROFILE\Documents"
git clone https://github.com/AnvayB/PriorityViz-local.git
cd PriorityViz-local
```

This creates a **PriorityViz-local** folder inside your Documents.

---

## Step 4 — Install dependencies

```powershell
npm install
```

This takes a minute or two — a progress bar will appear, that's normal.

---

## Step 5 — Run the app

```powershell
npm run dev
```

Then open **Chrome or Edge** and go to:

```
http://localhost:5173
```

> **First launch:** the app will ask you to create or open a data file — pick any location on your computer (e.g. Desktop). This is where your tasks are stored. Changes are saved automatically; no manual saving needed.

> **Note:** Keep the PowerShell window open while using the app. To stop it, click the window and press `Ctrl + C`.

---

## Step 6 — Set up daily email summary *(optional)*

This sends you an automated task digest each day at a time you choose.

**In the app:** click the **mail icon** in the top-right of the header. Enter your email address, preferred send time, and your Gmail or Outlook credentials, then click **Save settings**.

**Back in PowerShell:**

```powershell
Copy-Item email-config.json.example email-config.json
```

Open **email-config.json** in Notepad and set `dataFilePath` to the full path of your data file, for example:

```
C:\Users\YourName\Desktop\my-tasks.json
```

Then register the scheduled task:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-task.ps1
```

Test it immediately:

```powershell
node scripts\send-daily-summary.js
```

> **Gmail users:** use an App Password, not your regular password. Create one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).  
> **Outlook users:** your regular password works.

---

After Step 5 the app is fully functional. Step 6 is only needed if you want the automated email digest.
