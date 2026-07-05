# Nithesh & Harshitha — Wedding Invitation Website

A beautiful, animated, mobile-first single-page wedding invite.  
Zero build steps — just open `index.html` in any browser.

---

## Quick Start

```
Double-click index.html  →  opens directly in Chrome / Safari / Firefox
```

No server, no `npm install`, no build tools required.

---

## How to Edit Content

Every piece of text you'll want to change is marked with an  
`<!-- EDIT: ... -->` comment in **index.html** or a `/* EDIT: ... */`  
comment in **js/script.js**. Use Find & Replace (`Cmd+F` / `Ctrl+F`) and  
search for `EDIT:` to jump to each one.

### Key locations

| What to change | Where |
|---|---|
| Groom / bride names | `index.html` — look for `EDIT: Update groom name` |
| Wedding date (countdown) | `js/script.js` — line with `weddingDate: new Date(...)` |
| Date display text | `index.html` — `EDIT: Update wedding date display text` |
| Tagline | `index.html` — `EDIT: Update romantic tagline` |
| Event dates / times / venues | `index.html` — each event section has 4 `EDIT:` comments |
| Closing message in footer | `index.html` — `EDIT: Update closing message` |
| Thank-you message | `index.html` — `EDIT: Personalise the thank-you message` |
| WhatsApp share preview | `index.html` — the five `<meta property="og:...">` tags |
| Background music | `index.html` — `<source src="assets/background-music.mp3">` |
| Gallery photos | See `assets/README.txt` for exact instructions |

---

## Colours & Fonts

All colours are CSS custom properties  at the top of `css/style.css`  
in the `:root {}` block. Change `--rose-mid`, `--gold`, etc. there and  
the whole site updates automatically.

Fonts are loaded from Google Fonts in `index.html`:
- **Great Vibes** — script/handwriting (names, titles)
- **Cormorant Garamond** — elegant serif (headings, dates)
- **Poppins** — clean sans-serif (body text, labels)

---

## Connect the RSVP Form (free options)

By default the form is visual-only (shows a thank-you animation).  
To collect real submissions, choose one of these free options:

### Option A — Formspree (recommended, 5 min setup)

1. Go to [formspree.io](https://formspree.io) → sign up free
2. Create a new form → copy your form ID (looks like `xabc1234`)
3. Open `js/script.js`, find the large comment block inside `initRSVP()`
4. Uncomment the `fetch(...)` block and replace `YOUR_FORM_ID_HERE`  
   with your actual Formspree ID
5. Submissions arrive in your email inbox (free tier: 50/month)

### Option B — Google Forms embed

1. Create a Google Form at [forms.google.com](https://forms.google.com)
2. Click **Send → Embed** and copy the `<iframe>` code
3. Replace the `<form id="rsvp-form">` block in `index.html` with the iframe

---

## Deploy for Free

### GitHub Pages (recommended)

1. Create a new repository on [github.com](https://github.com)
2. Upload all files (or `git push` the folder)
3. Go to **Settings → Pages → Branch: main → / (root)** → Save
4. Your site will be live at `https://yourusername.github.io/repo-name/`
5. Update the `og:url` meta tag in `index.html` to match

### Netlify (drag & drop, 30 seconds)

1. Go to [netlify.com](https://netlify.com) → sign up free
2. Drag the entire `wedding_invite` folder onto the deploy area
3. Done — you get a `*.netlify.app` URL instantly
4. Connect a custom domain later in **Site settings → Domain management**

---

## File Structure

```
wedding_invite/
├── index.html          ← All HTML; edit text/content here
├── css/
│   └── style.css       ← All styles; edit colours/fonts here
├── js/
│   └── script.js       ← All interactivity; edit dates/config here
├── assets/
│   ├── README.txt      ← Instructions for adding photos & music
│   ├── gallery-1.jpg   ← Add your photos here (see README.txt)
│   └── background-music.mp3  ← Add your music here
└── README.md           ← This file
```

---

## Browser Support

Chrome 90+, Safari 14+, Firefox 88+, Edge 90+, iOS Safari 14+, Android Chrome 90+.  
Animations degrade gracefully when `prefers-reduced-motion` is set.

---

*Made with ♥ for Nithesh & Harshitha*
