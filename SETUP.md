# PriorityViz — Windows & Mac Setup Guide

**One-time setup · ~10 minutes**

---

## Prerequisites

You'll need two tools installed before running the app: **Node.js** and **Git**.

Choose the instructions for your operating system below.

---

# Windows Installation

## Step 1 — Install Node.js

1. Go to **[nodejs.org](https://nodejs.org)** and download the **LTS** version
2. Run the installer with all default settings — make sure **"Add to PATH"** stays checked
3. Open **PowerShell** (`Win + X → Terminal`) and confirm it worked:

```powershell
node --version
npm --version
```

Both should print a version number (for example, `v22.x.x`).

If you see `"not recognized"`, close and reopen PowerShell, then try again.

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
cd "$env:USERPROFILE\Desktop" # or whichever location you prefer
git clone https://github.com/AnvayB/PriorityViz-local.git
cd PriorityViz-local
```

This creates a **PriorityViz-local** folder inside your Documents folder.

---

## Step 4 — Install dependencies

```powershell
npm install
```

This may take a minute or two. A progress indicator and package installation messages are normal.

---

## Step 5 — Run the app

```powershell
npm run dev
```

Then open **Chrome or Edge** and go to:

```text
http://localhost:5173
```

> **First launch:** the app will ask you to create or open a data file. Pick any location on your computer, such as your Desktop. This is where your tasks are stored. Changes are saved automatically; no manual saving is needed.

> **Note:** Keep the PowerShell window open while using the app. To stop the app, click the PowerShell window and press `Ctrl + C`.

---

## Step 6 — Set up daily email summary *(optional)*

This sends you an automated task digest each day at a time you choose.

**In the app:** click the **mail icon** in the top-right of the header. Enter your email address, preferred send time, and your Gmail or Outlook credentials, then click **Save settings**.

**Back in PowerShell:**

```powershell
Copy-Item email-config.json.example email-config.json
```

Open **email-config.json** in Notepad and set `dataFilePath` to the full path of your data file, for example:

```text
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

# Mac Installation

## Step 1 — Install Node.js

1. Go to **[nodejs.org](https://nodejs.org)** and download the **LTS** version for macOS
2. Open the downloaded `.pkg` installer
3. Follow the installer using the default settings
4. Open **Terminal**:

   * Press `Command + Space`
   * Search for **Terminal**
   * Press Enter
5. Confirm Node.js and npm were installed:

```bash
node --version
npm --version
```

Both should print a version number, such as:

```text
v22.x.x
```

If Terminal says the command cannot be found, close Terminal, reopen it, and try again.

---

## Step 2 — Install Git

Git may already be available on your Mac.

In Terminal, run:

```bash
git --version
```

If a version number appears, Git is already installed and you can continue to Step 3.

If macOS asks you to install the **Command Line Developer Tools**, click **Install** and let the installation finish.

You can then verify again with:

```bash
git --version
```

---

## Step 3 — Download the app

In Terminal, run:

```bash
cd ~/Desktop # or whichever location you prefer
git clone https://github.com/AnvayB/PriorityViz-local.git
cd PriorityViz-local
```

This creates a **PriorityViz-local** folder inside your Documents folder.

---

## Step 4 — Install dependencies

```bash
npm install
```

This may take a minute or two. Package installation messages in Terminal are normal.

---

## Step 5 — Run the app

```bash
npm run dev
```

Then open **Chrome, Safari, or another browser** and go to:

```text
http://localhost:5173
```

> **First launch:** the app will ask you to create or open a data file. Pick any location on your Mac, such as your Desktop or Documents folder. This is where your tasks are stored. Changes are saved automatically; no manual saving is needed.

> **Note:** Keep the Terminal window open while using the app. To stop the app, click the Terminal window and press `Control + C`.

---

## Step 6 — Set up daily email summary *(optional)*

This sends you an automated task digest each day at a time you choose.

**In the app:** click the **mail icon** in the top-right of the header. Enter your email address, preferred send time, and your Gmail or Outlook credentials, then click **Save settings**.

**Back in Terminal:**

```bash
cp email-config.json.example email-config.json
```

Open **email-config.json** in a text editor.

For example, you can open it in TextEdit with:

```bash
open -e email-config.json
```

Set `dataFilePath` to the full path of your data file.

For example:

```text
/Users/YourName/Desktop/my-tasks.json
```

Test the email summary manually:

```bash
node scripts/send-daily-summary.js
```

### Automating the summary on Mac

The Windows `setup-task.ps1` script uses **Windows Task Scheduler**, so it does not work on macOS.

On Mac, the daily summary should instead be scheduled using **launchd** (macOS's built-in background task scheduler).

If the repository includes a Mac setup script, run the corresponding script from the project directory. For example:

```bash
bash scripts/setup-task-mac.sh
```

If `setup-task-mac.sh` is not included in the repository, the automatic scheduling portion will need to be configured separately before Step 6 can run automatically each day.

You can still send the summary manually at any time with:

```bash
node scripts/send-daily-summary.js
```

> **Gmail users:** use an App Password, not your regular password. Create one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

> **Outlook users:** your regular password works.

---

## You're ready

After **Step 5**, PriorityViz is fully functional on both Windows and Mac.

**Step 6 is optional** and is only needed if you want the automated daily email digest.
