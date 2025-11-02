import { upsertPlatformAccountAction } from "@/app/actions/trend-actions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { PlatformAccount } from "@prisma/client";

async function getSettingsData() {
  const accounts = await prisma.platformAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return { accounts };
}

function CredentialsPreview({ account }: { account: PlatformAccount }) {
  const safeJson = JSON.stringify(account.credentials, null, 2);
  return (
    <pre
      style={{
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "16px",
        borderRadius: "12px",
        fontSize: "12px",
        overflowX: "auto",
      }}
    >
      {safeJson}
    </pre>
  );
}

export default async function SettingsPage() {
  const { accounts } = await getSettingsData();

  return (
    <div className="stack">
      <header className="page-heading">
        <h1 className="page-heading__title">Admin Configuration</h1>
        <p className="page-heading__subtitle">
          Connect social pipelines, define webhook targets, and configure API
          providers for the autonomous agent.
        </p>
      </header>

      <section className="card">
        <h2 className="card__title">Platform Accounts</h2>
        <p className="card__subtitle">
          Provide a webhook URL or integration credentials for each channel.
          Each webhook receives <code>{'{ text, hashtags[], callToAction, imageUrl }'}</code> payloads.
        </p>

        <form action={upsertPlatformAccountAction} className="stack">
          <div className="grid three">
            <div className="form-group">
              <label>Platform</label>
              <input
                name="platform"
                className="input"
                placeholder="facebook, instagram, twitter..."
                required
              />
            </div>
            <div className="form-group">
              <label>Label</label>
              <input
                name="label"
                className="input"
                placeholder="Primary Facebook Page"
                required
              />
            </div>
            <div className="form-group" style={{ alignSelf: "flex-end" }}>
              <label style={{ visibility: "hidden" }}>Enabled</label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" name="isEnabled" defaultChecked /> Enabled
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>Credentials JSON</label>
            <textarea
              name="credentials"
              className="textarea"
              placeholder='{"webhookUrl": "https://hooks.zapier.com/...", "webhookAuthorization": "Bearer xyz"}'
              required
            />
          </div>
          <button className="button" type="submit">
            Save Account
          </button>
        </form>

        <div className="stack" style={{ marginTop: 40 }}>
          {accounts.length === 0 ? (
            <div className="empty-state">
              No accounts configured yet. Add at least one webhook target per
              platform you plan to automate.
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="card" style={{ marginTop: 0 }}>
                <div className="stack-sm">
                  <div className="chips">
                    <span className="pill badge--platform">
                      {account.platform}
                    </span>
                    <span className="pill">
                      {account.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <span className="pill">
                      Added {formatDate(account.createdAt)}
                    </span>
                  </div>
                  <strong>{account.label}</strong>
                  <CredentialsPreview account={account} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Environment Variables</h2>
        <p className="card__subtitle">
          Set the following environment variables in your deployment to unlock
          premium capabilities:
        </p>
        <ul style={{ paddingLeft: 20, color: "#475569", lineHeight: 1.8 }}>
          <li>
            <code>OPENAI_API_KEY</code> (required for text + image generation)
          </li>
          <li>
            <code>NEWS_API_KEY</code> (optional, NewsAPI headlines ingestion)
          </li>
          <li>
            <code>YOUTUBE_API_KEY</code> (optional, YouTube trending videos)
          </li>
          <li>
            <code>TWITTER_BEARER_TOKEN</code> (optional, X trending topics)
          </li>
        </ul>
      </section>
    </div>
  );
}
