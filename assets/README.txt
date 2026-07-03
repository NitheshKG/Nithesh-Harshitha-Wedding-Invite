ASSETS FOLDER — Nithesh & Harshitha Wedding Invite
====================================================

This folder is a placeholder for media files you'll add later.
All assets are OPTIONAL — the site works fine without them.

────────────────────────────────────────────────────────────
PHOTOS (Gallery — Our Story section)
────────────────────────────────────────────────────────────
Add up to 6 photos and name them exactly:

  gallery-1.jpg
  gallery-2.jpg
  gallery-3.jpg
  gallery-4.jpg
  gallery-5.jpg
  gallery-6.jpg

Recommended specs:
  • Format: JPEG (smaller file size)
  • Aspect ratio: 4:3 (landscape) works best with the grid
  • Width: 800–1200px (no larger needed — keeps page fast)
  • Quality: 80–85% compression is fine

Then in index.html, replace each placeholder block like this:

  BEFORE:
    <div class="gallery-placeholder"><span>Photo 1</span></div>

  AFTER:
    <img src="assets/gallery-1.jpg" alt="Your caption here"
         loading="lazy" />

────────────────────────────────────────────────────────────
BACKGROUND MUSIC
────────────────────────────────────────────────────────────
Add a single audio file:

  background-music.mp3

Then make sure index.html has:
  <source src="assets/background-music.mp3" type="audio/mpeg" />

Free royalty-free wedding music sources:
  • https://pixabay.com/music/search/wedding/  (free, no attribution needed)
  • https://freemusicarchive.org               (check per-track licence)
  • https://bensound.com                       (free with attribution)

Recommended specs:
  • Format: MP3
  • Bitrate: 128 kbps is plenty for background ambience
  • Length: 3–5 minutes (it loops automatically)

────────────────────────────────────────────────────────────
OG PREVIEW IMAGE (WhatsApp / social sharing thumbnail)
────────────────────────────────────────────────────────────
Add one file:

  og-preview.jpg

Then update index.html:
  <meta property="og:image" content="assets/og-preview.jpg" />

Recommended specs:
  • Size: 1200 × 630 px  (standard Open Graph size)
  • Content: a nice couple photo, or decorated text "Nithesh weds Harshitha"
  • Format: JPEG, max ~300 KB

────────────────────────────────────────────────────────────
FAVICON (optional — emoji one is already set in index.html)
────────────────────────────────────────────────────────────
If you want a custom icon file, add:

  favicon.png  (32×32 or 64×64 px)

And update index.html <head>:
  <link rel="icon" type="image/png" href="assets/favicon.png" />
