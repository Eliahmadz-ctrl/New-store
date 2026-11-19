# Cliproom

A personal social-video clipping workspace. It lets you paste supported video links or upload a source file, choose a cut, create platform-friendly crops and captions, and download finished WebM clips directly in the browser.

## AI viral moments

Cliproom ranks transcript moments for hooks, curiosity, tension, emotional language, specificity, and standalone payoff. Paste a transcript or caption file content into **AI viral moments**—timestamped captions provide the most precise cut points.

- Without configuration, Cliproom uses built-in smart scoring in the browser.
- For deeper editorial ranking, add `OPENAI_API_KEY` to the Vercel project. The serverless route at `/api/analyze` then uses the configured OpenAI model (default: `gpt-4.1-mini`). Optionally set `OPENAI_MODEL` to another compatible model.

Do not expose API keys in client-side variables or commit them to Git.

## Source and export notes

- YouTube and Vimeo links play in the embedded preview. Browser security prevents rendering an embedded social player into a downloadable file.
- Upload an MP4, MOV, or WebM source for the most reliable preview, AI-assisted editing, and downloadable WebM cut.
- Direct media URLs can render and export only when their host grants browser CORS access.

## Development

```bash
npm install
npm run dev
```

Build the production site with:

```bash
npm run build
```
