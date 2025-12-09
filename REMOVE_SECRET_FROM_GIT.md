# Remove Firebase Secret from Git

## Problem

GitHub detected that you're trying to push `tracktoto-parent-firebase-adminsdk.json` which contains sensitive credentials. GitHub's secret scanning blocked the push to protect your secrets.

## Solution: Remove the File from Git

### Step 1: Remove File from Git Tracking (Keep Local File)

Run these commands in PowerShell:

```powershell
# Remove from git tracking but keep the file locally
git rm --cached tracktoto-parent-firebase-adminsdk.json

# Commit the removal
git commit -m "Remove Firebase service account JSON from git (use environment variables instead)"

# Push the changes
git push
```

### Step 2: Verify .gitignore

The file should already be in `.gitignore`. Verify it's there:

```powershell
# Check if it's in .gitignore
cat .gitignore
```

You should see `tracktoto-parent-firebase-adminsdk.json` listed.

If it's not there, add it:

```powershell
# Add to .gitignore
echo "tracktoto-parent-firebase-adminsdk.json" >> .gitignore
git add .gitignore
git commit -m "Add Firebase JSON to .gitignore"
git push
```

### Step 3: Remove from Git History (If Already Pushed)

⚠️ **Important:** If you already pushed this file to GitHub before, you need to remove it from git history:

```powershell
# Remove from git history (use with caution)
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch tracktoto-parent-firebase-adminsdk.json" --prune-empty --tag-name-filter cat -- --all

# Force push (this rewrites history - coordinate with team first!)
git push origin --force --all
```

**OR** use the simpler method with git-filter-repo (if installed):

```powershell
git filter-repo --path tracktoto-parent-firebase-adminsdk.json --invert-paths
git push origin --force --all
```

### Step 4: Regenerate Service Account Key (Security Best Practice)

Since the key was exposed in git, you should regenerate it:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Find your service account
4. Click **"..."** → **Delete** (or generate a new key and delete the old one)
5. Generate a new private key
6. Update your Render environment variables with the new key

---

## Quick Commands (Copy & Paste)

```powershell
# Step 1: Remove from git
git rm --cached tracktoto-parent-firebase-adminsdk.json

# Step 2: Commit
git commit -m "Remove Firebase service account JSON from git"

# Step 3: Push
git push
```

---

## Why This Happened

The `tracktoto-parent-firebase-adminsdk.json` file contains:
- Private keys
- Service account credentials
- Sensitive authentication data

GitHub's secret scanning detected these and blocked the push to protect you.

---

## Best Practice: Use Environment Variables

Instead of committing the JSON file:

1. ✅ **Use environment variables** in Render (already set up)
2. ✅ **Keep JSON file local only** (for development)
3. ✅ **Never commit** service account files
4. ✅ **Regenerate keys** if accidentally committed

---

## After Fixing

After removing the file and pushing:

1. ✅ GitHub will accept your push
2. ✅ File stays local (for development)
3. ✅ Production uses environment variables (Render)
4. ✅ No secrets in git history

---

## Verify It's Removed

After pushing, verify:

```powershell
# Check if file is still tracked
git ls-files | grep tracktoto-parent-firebase-adminsdk.json

# Should return nothing (file not tracked)
```

---

## Need Help?

If you still get errors:

1. Make sure file is in `.gitignore`
2. Make sure you ran `git rm --cached`
3. Check if file was already pushed (may need to remove from history)
4. Regenerate the service account key for security

