import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDate, parseTagsJson } from "@/lib/utils";

async function getGeneratedContent() {
  return prisma.generatedContent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      trend: true,
      postingJobs: true,
    },
  });
}

export default async function ContentPage() {
  const items = await getGeneratedContent();

  return (
    <div className="stack">
      <header className="page-heading">
        <h1 className="page-heading__title">AI Creative Library</h1>
        <p className="page-heading__subtitle">
          Audit, edit, and export the long-form history of generated posts,
          their scheduling targets, and execution logs.
        </p>
      </header>

      <div className="card">
        <h2 className="card__title">Generated Posts</h2>
        <p className="card__subtitle">
          Filtered listing of all AI produced assets mapped to their originating
          trend.
        </p>
        <div className="stack">
          {items.length === 0 ? (
            <div className="empty-state">
              Approve a trend from the dashboard to generate your first post.
            </div>
          ) : (
            items.map((content) => {
              const metadata = (content.metadata ?? {}) as Record<string, unknown>;
              const hashtagsValue = metadata["hashtags"];
              const hashtags = Array.isArray(hashtagsValue)
                ? hashtagsValue.filter((tag): tag is string => typeof tag === "string")
                : [];
              const tags = parseTagsJson(content.trend?.tags ?? "[]");
              const imageUrl = typeof content.imageUrl === "string" ? content.imageUrl : undefined;
              return (
                <div key={content.id} className="card" style={{ marginTop: 0 }}>
                  <div className="stack-sm">
                    <div className="chips">
                      <span className="pill badge--platform">
                        Platform: {content.platform}
                      </span>
                      <span className="pill">
                        Status: {content.status.toLowerCase()}
                      </span>
                      {content.scheduledFor && (
                        <span className="pill">
                          Scheduled: {formatDate(content.scheduledFor)}
                        </span>
                      )}
                    </div>
                    <p>{content.body}</p>
                    {hashtags.length > 0 && (
                      <div className="tag-list">
                        {hashtags.map((tag: string) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt="Generated visual"
                        width={640}
                        height={640}
                        unoptimized
                        style={{
                          width: "100%",
                          height: "auto",
                          borderRadius: 12,
                        }}
                      />
                    )}
                    <div className="stack-sm">
                      <span className="muted">
                        Created {formatDate(content.createdAt)}
                      </span>
                      <div className="muted">
                        Source trend: <strong>{content.trend?.title}</strong>
                      </div>
                      {tags.length > 0 && (
                        <div className="tag-list">
                          {tags.map((tag) => (
                            <span key={tag} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {content.postingJobs.length > 0 && (
                      <div className="card" style={{ marginTop: 0 }}>
                        <div className="section__title">Posting Jobs</div>
                        <div className="stack-sm">
                          {content.postingJobs.map((job) => (
                            <div key={job.id} className="chips">
                              <span
                                className={`pill ${
                                  job.status === "SUCCESS"
                                    ? "success"
                                    : job.status === "FAILED"
                                      ? "danger"
                                      : "warning"
                                }`}
                              >
                                {job.status}
                              </span>
                              <span className="pill">
                                Scheduled: {formatDate(job.scheduledFor)}
                              </span>
                              {job.executedAt && (
                                <span className="pill">
                                  Executed: {formatDate(job.executedAt)}
                                </span>
                              )}
                              {job.errorMessage && (
                                <span className="pill danger">
                                  {job.errorMessage}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
