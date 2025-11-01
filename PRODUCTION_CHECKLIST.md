# Production Deployment Checklist

## Before Deploying to GitHub Pages

### 1. Reset Visitor Counter (localStorage)

The asterisk (*) after the visitor count means the counter is using localStorage (local browser storage) instead of the API. This is normal for localhost testing.

**To reset the local counter before testing:**

Open your browser console (F12 → Console tab) and run:
```javascript
localStorage.removeItem('local-visit-count');
```

Then refresh the page.

### 2. What Happens on GitHub Pages

When deployed to `nilbl.github.io`:
- ✅ The CountAPI should work properly (no asterisk)
- ✅ Counter will show global visitor count
- ✅ Each visitor increments the counter
- ✅ Counter persists across visits

**Why localhost shows asterisk:**
- CountAPI may be blocked by CORS on localhost
- Browser security policies restrict local API calls
- This is expected behavior during local testing

### 3. Verify API in Browser Console

After deploying, open browser console to check:
```javascript
// You should NOT see these errors on GitHub Pages:
// "CountAPI failed: ..."
// "CountAPI status: ..."

// You SHOULD see:
// "CountAPI response: {value: XX}"
```

### 4. If Counter Still Shows Asterisk on Production

If the asterisk persists after deployment to GitHub Pages:

**Option A: Check CountAPI Status**
1. Visit https://api.countapi.xyz/
2. Verify the service is operational

**Option B: Alternative Counter Services**
Consider these alternatives if CountAPI is down:
- GoatCounter (privacy-friendly)
- Simple Analytics
- Plausible Analytics

### 5. Clear Browser Cache Before Testing

After deploying:
```
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear site data:
   - F12 → Application → Storage → Clear site data
```

### 6. Final Checks

- [ ] All images load (check browser console for 404s)
- [ ] Sounds work on first interaction
- [ ] Timeline scrolls horizontally and vertically
- [ ] All languages translate correctly
- [ ] Visitor counter shows number without asterisk
- [ ] Mobile responsive design works
- [ ] All timeline cards appear when clicked

## Deploying to GitHub Pages

### Option 1: Push to GitHub
```bash
git add .
git commit -m "Deploy portfolio website"
git push origin main
```

Then:
1. Go to repository Settings
2. Pages → Source → Select "main" branch
3. Save
4. Wait 2-3 minutes for deployment
5. Visit https://nilbl.github.io

### Option 2: Using GitHub Desktop
1. Commit changes with message: "Deploy portfolio website"
2. Push to origin
3. Follow GitHub Pages setup above

## Post-Deployment

### Test Everything
1. Visit https://nilbl.github.io
2. Check visitor counter (should be without *)
3. Test on mobile device
4. Check all sections and interactions
5. Verify sounds work
6. Test language switching

### Monitor
- Check browser console for errors
- Test on different browsers (Chrome, Firefox, Safari)
- Test on different devices (Desktop, Tablet, Mobile)

## Troubleshooting

### Counter Shows "---"
- CountAPI is down
- Network blocked API requests
- Check browser console for errors

### Counter Shows Number with "*"
- Using localStorage fallback
- Should not happen on production
- Clear browser cache and test again

### Images Not Loading
- Check file paths are correct
- Ensure all files are committed to git
- Verify GitHub Pages is serving from correct branch

## Support

If issues persist:
1. Check browser console (F12)
2. Look for error messages
3. Verify all files are on GitHub
4. Check GitHub Pages deployment status
