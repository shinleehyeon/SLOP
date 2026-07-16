// TODO: replace with the real production web domain once deployed.
export const WEB_BASE_URL = "http://localhost:3000"

export const API_BASE_URL = "https://api.vport.dev"

// Read from extension/.env (gitignored). Plasmo only inlines env vars
// prefixed PLASMO_PUBLIC_ into any bundle — background, content scripts, or
// popup — so despite the name, this isn't actually "public" in the sense of
// reaching the host page's own JS: only background.ts imports it, and
// content scripts run in an isolated world from the page anyway. It does
// ship inside the built extension package itself, so anyone who unpacks the
// .crx can read it — fine for a local prototype, but before shipping this
// should move behind a backend proxy so the key never reaches the client.
export const OPENROUTER_API_KEY = process.env.PLASMO_PUBLIC_OPENROUTER_API_KEY ?? ""

export const OPENROUTER_MODEL = "openai/gpt-4o-mini"
