'use client';

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import type { Trend, TrendStatus } from "@prisma/client";
import {
  approveTrendAction,
  generateContentAction,
  generateImageAction,
  updateTrendStatusAction,
} from "@/app/actions/trend-actions";
import { parseTagsJson, formatDate } from "@/lib/utils";
import type { GeneratedPost } from "@/lib/services/ai-service";

const PLATFORM_OPTIONS = [
  "facebook",
  "instagram",
  "x",
  "twitter",
  "youtube",
  "pinterest",
  "threads",
  "tiktok",
  "linkedin",
];

const TONE_OPTIONS = ["informative", "professional", "funny", "bold", "friendly"];

type TrendWithComputed = Trend & { parsedTags: string[] };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
};

export function TrendTable({ trends }: { trends: Trend[] }) {
  const computedTrends = useMemo<TrendWithComputed[]>(
    () =>
      trends.map((trend) => ({
        ...trend,
        parsedTags: parseTagsJson(trend.tags),
      })),
    [trends],
  );

  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modalTrend, setModalTrend] = useState<TrendWithComputed | null>(null);
  const [draft, setDraft] = useState<GeneratedPost | null>(null);
  const [platform, setPlatform] = useState<string>("facebook");
  const [tone, setTone] = useState<string>("informative");
  const [language, setLanguage] = useState<string>("en");
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePrompt, setImagePrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetModalState = () => {
    setDraft(null);
    setPlatform("facebook");
    setTone("informative");
    setLanguage("en");
    setScheduleAt("");
    setImagePrompt("");
    setImageUrl("");
    setError(null);
    setSuccessMessage(null);
  };

  const onApprove = (trendId: string) => {
    setPendingStatusId(trendId);
    startTransition(async () => {
      await updateTrendStatusAction(trendId, "APPROVED" as TrendStatus);
      setPendingStatusId(null);
    });
  };

  const onReject = (trendId: string) => {
    setPendingStatusId(trendId);
    startTransition(async () => {
      await updateTrendStatusAction(trendId, "REJECTED" as TrendStatus);
      setPendingStatusId(null);
    });
  };

  const onReset = (trendId: string) => {
    setPendingStatusId(trendId);
    startTransition(async () => {
      await updateTrendStatusAction(trendId, "PENDING" as TrendStatus);
      setPendingStatusId(null);
    });
  };

  const openModal = (trend: TrendWithComputed) => {
    resetModalState();
    setModalTrend(trend);
    setPlatform("facebook");
    setLanguage(trend.language ?? "en");
  };

  const handleGenerateDraft = async () => {
    if (!modalTrend) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateContentAction({
        trendId: modalTrend.id,
        title: modalTrend.title,
        description: modalTrend.description,
        platform,
        tone,
        language,
      });
      setDraft(data);
      setImagePrompt(data.imagePrompt ?? "");
      setSuccessMessage("Draft generated successfully.");
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to generate AI content."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) {
      setError("Provide an image prompt before generating.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateImageAction(imagePrompt);
      setImageUrl(url);
      setSuccessMessage("Image generated successfully.");
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Image generation failed."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!modalTrend || !draft) {
      setError("Generate a draft before saving.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await approveTrendAction({
        trendId: modalTrend.id,
        platform,
        tone,
        prompt: draft.imagePrompt ?? "",
        body: draft.post,
        imagePrompt,
        imageUrl,
        scheduleAt: scheduleAt || undefined,
        metadata: {
          hashtags: draft.hashtags ?? [],
          callToAction: draft.callToAction,
        },
      });
      setSuccessMessage("Trend approved and content saved.");
      setModalTrend(null);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to save generated content."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="toolbar">
        <div>
          <h2 className="card__title">Trending Opportunities</h2>
          <p className="card__subtitle">
            Review AI-discovered trends and approve for content generation.
          </p>
        </div>
      </div>
      <div className="scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Trend</th>
              <th style={{ width: "15%" }}>Source</th>
              <th style={{ width: "15%" }}>Language</th>
              <th style={{ width: "15%" }}>Tags</th>
              <th style={{ width: "12%" }}>Status</th>
              <th style={{ width: "15%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {computedTrends.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    No trends ingested yet. Use the fetch controls above.
                  </div>
                </td>
              </tr>
            ) : (
              computedTrends.map((trend) => (
                <tr key={trend.id}>
                  <td>
                    <div className="stack-sm">
                      <strong>{trend.title}</strong>
                      {trend.description && (
                        <span className="muted">{trend.description}</span>
                      )}
                      {trend.link && (
                        <a
                          href={trend.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chip"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge--source">{trend.source}</span>
                    <div className="muted" style={{ marginTop: 8 }}>
                      {formatDate(trend.fetchedAt)}
                    </div>
                  </td>
                  <td>
                    <div className="stack-sm">
                      <span className="chip">
                        Language: {trend.language ?? "N/A"}
                      </span>
                      {trend.region && (
                        <span className="chip">Region: {trend.region}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="tag-list">
                      {trend.parsedTags.slice(0, 5).map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge--status ${
                        trend.status === "PENDING" ? "pending" : ""
                      }`}
                    >
                      {trend.status}
                    </span>
                  </td>
                  <td>
                    <div className="stack-sm">
                      <button
                        className="button"
                        onClick={() => openModal(trend)}
                      >
                        Generate Content
                      </button>
                      <button
                        className="button secondary"
                        disabled={isPending && pendingStatusId === trend.id}
                        onClick={() => onReset(trend.id)}
                      >
                        Reset
                      </button>
                      <div className="chips">
                        <button
                          className="button secondary"
                          disabled={isPending && pendingStatusId === trend.id}
                          onClick={() => onApprove(trend.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="button secondary"
                          disabled={isPending && pendingStatusId === trend.id}
                          onClick={() => onReject(trend.id)}
                          style={{ background: "#fee2e2", color: "#b91c1c" }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalTrend && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ position: "relative" }}>
            <button
              className="close-button"
              aria-label="Close modal"
              onClick={() => setModalTrend(null)}
            >
              ×
            </button>
            <div className="stack">
              <div>
                <h3 className="section__title">{modalTrend.title}</h3>
                <p className="muted">{modalTrend.description}</p>
              </div>
              <div className="grid two">
                <div className="form-group">
                  <label>Platform</label>
                  <select
                    className="select"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                  >
                    {PLATFORM_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tone</label>
                  <select
                    className="select"
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                  >
                    {TONE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid two">
                <div className="form-group">
                  <label>Language</label>
                  <input
                    className="input"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    placeholder="en, ur, etc."
                  />
                </div>
                <div className="form-group">
                  <label>Schedule (optional)</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(event) => setScheduleAt(event.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image Prompt</label>
                <textarea
                  className="textarea"
                  value={imagePrompt}
                  onChange={(event) => setImagePrompt(event.target.value)}
                  placeholder="Vivid description of the image to generate"
                />
                <div className="chips" style={{ marginTop: 10 }}>
                  <button
                    className="button secondary"
                    onClick={handleGenerateDraft}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate AI Draft"}
                  </button>
                  <button
                    className="button secondary"
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !imagePrompt}
                  >
                    Generate Image
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Generated Post</label>
                <textarea
                  className="textarea"
                  value={draft?.post ?? ""}
                  onChange={(event) =>
                    setDraft((prev) =>
                      prev
                        ? { ...prev, post: event.target.value }
                        : {
                            platform,
                            post: event.target.value,
                            tone,
                          },
                    )
                  }
                  placeholder="AI generated copy will appear here"
                />
              </div>

              {draft && (
                <div className="form-group">
                  <label>Hashtags</label>
                  <input
                    className="input"
                    value={(draft.hashtags ?? []).join(", ")}
                    onChange={(event) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              hashtags: event.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean),
                            }
                          : null,
                      )
                    }
                    placeholder="#trend, #viral"
                  />
                </div>
              )}

              {draft && (
                <div className="form-group">
                  <label>Call to Action</label>
                  <input
                    className="input"
                    value={draft.callToAction ?? ""}
                    onChange={(event) =>
                      setDraft((prev) =>
                        prev
                          ? { ...prev, callToAction: event.target.value }
                          : null,
                      )
                    }
                    placeholder="Visit the site, subscribe, etc."
                  />
                </div>
              )}

              {imageUrl && (
                <div className="form-group">
                  <label>Generated Image Preview</label>
                  <Image
                    src={imageUrl}
                    alt="Generated visual"
                    width={640}
                    height={640}
                    unoptimized
                    style={{
                      borderRadius: 12,
                      width: "100%",
                      height: "auto",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              {error && <div className="pill danger">{error}</div>}
              {successMessage && <div className="pill success">{successMessage}</div>}

              <div className="chips" style={{ justifyContent: "flex-end" }}>
                <button
                  className="button secondary"
                  onClick={() => setModalTrend(null)}
                >
                  Cancel
                </button>
                <button
                  className="button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Approve & Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
