# Next.js Blog Editor — Starter

## Setup

1. Create a new folder and paste the files above.
2. `npm install` (or `yarn`)
3. `npm run dev`
4. Open `http://localhost:3000`

## Features implemented
- Title input
- Tags (comma-separated)
- Rich-text editor (React-Quill)
  - Bold, italic, underline, strikethrough
  - Headings (H1, H2, H3)
  - Ordered/unordered lists
  - Blockquotes
  - Code blocks
  - Image embedding (local files -> base64)
  - Hyperlinks
  - Alignment (left/center/right)
- Preview mode
- Save Draft / Publish (stored in `localStorage`)
- Post listing and edit/delete on the index page

## Next steps / enhancements (optional)
- Wire up a real backend (API route or external DB) to persist posts server-side
- Add image uploads to cloud storage (S3 / Cloudinary) instead of base64
- Implement user authentication
- Add SEO metadata when publishing
- Add better tag UI (chips, suggestions)
- Replace React-Quill with TipTap for a more extensible editor
