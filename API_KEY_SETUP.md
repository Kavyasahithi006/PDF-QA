# API Key Setup - Anthropic Claude

## Getting Your API Key

### Step 1: Sign Up / Log In
1. Go to https://console.anthropic.com
2. Sign in with your Google or email account
3. Create account if needed (free tier available)

### Step 2: Create API Key
1. Click **"Account"** in the top right
2. Click **"API Keys"**
3. Click **"Create Key"**
4. Name it something like: `pdf-qa-app`
5. Click **"Generate"**
6. **Copy the key immediately** - you won't see it again!

### Step 3: Add to Your Project

#### Method 1: Create `.env.local` (Recommended)
```bash
cd PDF-QA-main
echo "VITE_ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" > .env.local
```

**Windows (PowerShell)**:
```powershell
"VITE_ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" | Out-File .env.local
```

#### Method 2: Edit `.env.local` Manually
1. Open `PDF-QA-main/.env.local` in your text editor
2. Paste your key:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
3. Save the file

### Step 4: Verify Setup
1. Start dev server: `npm run dev`
2. Upload a PDF
3. Ask a question
4. If you see an answer, it worked! ✅

---

## ⚠️ Important Notes

### Security
- **Never commit `.env.local`** to Git
- Already in `.gitignore` (but double-check!)
- Never share your API key publicly
- Your key starts with: `sk-ant-`

### Rate Limits
- Free tier: Limited requests per minute
- Check usage at: https://console.anthropic.com/usage
- Upgrade to paid tier if needed

### Pricing
- Claude Sonnet 4 (~$3 per million input tokens)
- Most questions: ~100-300 tokens input, 50-200 output
- Estimate: $0.01 per question (rough)

### If Key Doesn't Work
1. ✅ Check you copied it correctly (no spaces)
2. ✅ Restart `npm run dev` after adding key
3. ✅ Check `.env.local` is in root of `PDF-QA-main/`
4. ✅ Verify key hasn't been revoked on console.anthropic.com
5. ✅ Check browser console for error messages

---

## Troubleshooting

### Error: "API key not configured"
**Solution**:
- Create `.env.local` in project root
- Add: `VITE_ANTHROPIC_API_KEY=sk-ant-...`
- Restart dev server

### Error: "Unauthorized" or "401"
**Solution**:
- Check API key is correct and complete
- Check key hasn't been revoked
- Try generating a new key

### Error: "Rate limit exceeded"
**Solution**:
- Wait a few minutes before asking more questions
- Check usage on console.anthropic.com
- Upgrade to paid tier if frequently hitting limits

### Error: "Invalid API Key"
**Solution**:
- Double-check you copied the entire key
- Make sure key starts with `sk-ant-`
- Try generating a new key

---

## Testing Your Setup

### Quick Test
1. Upload any PDF
2. Ask: "What is this document about?"
3. You should get an answer within 3 seconds

### Debug Test
1. Open DevTools (F12)
2. Go to Console tab
3. Ask a question
4. Look for any error messages
5. If errors, copy and Google them

---

## Questions?

- **Anthropic Docs**: https://docs.anthropic.com/en/docs/getting-started/introduction
- **API Reference**: https://docs.anthropic.com/en/api/getting-started
- **Status Page**: https://status.anthropic.com

---

## Next Steps

Once API key is set up:
1. Start backend: `python -m uvicorn main:app --reload`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173
4. Upload a PDF and ask questions!

**Done! 🎉**
