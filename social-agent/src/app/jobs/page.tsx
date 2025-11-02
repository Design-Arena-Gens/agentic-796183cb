import { DispatchJobsButton } from "@/components/dispatch-jobs-button";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

async function getJobs() {
  return prisma.postingJob.findMany({
    orderBy: { scheduledFor: "desc" },
    include: {
      content: {
        select: {
          platform: true,
          body: true,
        },
      },
    },
    take: 50,
  });
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div className="stack">
      <header className="page-heading">
        <h1 className="page-heading__title">Publishing Automation Queue</h1>
        <p className="page-heading__subtitle">
          Monitor upcoming autopost executions and force-dispatch due items when
          needed.
        </p>
      </header>

      <div className="card">
        <h2 className="card__title">Queue Controls</h2>
        <p className="card__subtitle">
          Use cron (e.g., Vercel Scheduled Functions) to hit{" "}
          <code>/api/jobs/dispatch</code> hourly, or trigger manually here.
        </p>
        <DispatchJobsButton />
      </div>

      <div className="card">
        <h2 className="card__title">Job Ledger</h2>
        <p className="card__subtitle">
          Detailed history of automated publishing attempts, including remote
          webhook responses.
        </p>
        <div className="stack">
          {jobs.length === 0 ? (
            <div className="empty-state">
              No jobs scheduled yet. Approve a trend with a schedule to enqueue.
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="card" style={{ marginTop: 0 }}>
                <div className="stack-sm">
                  <div className="chips">
                    <span className="pill badge--platform">
                      Platform: {job.platform}
                    </span>
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
                  </div>
                  <div className="muted">
                    Scheduled for {formatDate(job.scheduledFor)}
                  </div>
                  {job.executedAt && (
                    <div className="muted">
                      Executed at {formatDate(job.executedAt)}
                    </div>
                  )}
                  <p>{job.content.body.slice(0, 220)}...</p>
                  {job.errorMessage && (
                    <span className="pill danger">{job.errorMessage}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
