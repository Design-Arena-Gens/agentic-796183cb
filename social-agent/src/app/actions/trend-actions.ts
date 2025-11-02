'use server';

import {
  approveTrendAndGenerateContent,
  ingestTrends,
  listPlatformAccounts,
  updateTrendStatus,
  upsertPlatformAccount,
} from "@/lib/services/trend-service";
import { generateImage, generatePostFromTrend } from "@/lib/services/ai-service";
import { dispatchDueJobs } from "@/lib/services/posting-service";
import { TrendStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function fetchTrendsAction(formData: FormData) {
  const language = formData.get("language")?.toString();
  const region = formData.get("region")?.toString();
  const category = formData.get("category")?.toString();

  await ingestTrends({
    language: language || undefined,
    region: region || undefined,
    category: category || undefined,
    limit: 20,
  });

  revalidatePath("/");
}

export async function updateTrendStatusAction(
  trendId: string,
  status: TrendStatus,
) {
  await updateTrendStatus(trendId, status);
  revalidatePath("/");
}

export async function generateContentAction(params: {
  trendId: string;
  title: string;
  description?: string | null;
  platform: string;
  tone?: string;
  language?: string;
}) {
  const result = await generatePostFromTrend({
    trendTitle: params.title,
    trendDescription: params.description ?? undefined,
    platform: params.platform,
    tone: params.tone,
    language: params.language,
  });
  return result;
}

export async function generateImageAction(prompt: string) {
  const imageUrl = await generateImage({ prompt });
  return imageUrl;
}

export async function approveTrendAction({
  trendId,
  platform,
  tone,
  prompt,
  body,
  imagePrompt,
  imageUrl,
  scheduleAt,
  metadata,
}: {
  trendId: string;
  platform: string;
  tone?: string;
  prompt: string;
  body: string;
  imagePrompt?: string;
  imageUrl?: string;
  scheduleAt?: string;
  metadata?: Record<string, unknown>;
}) {
  await approveTrendAndGenerateContent({
    trendId,
    platform,
    tone,
    prompt,
    body,
    imagePrompt,
    imageUrl,
    scheduleAt,
    metadata,
  });
  revalidatePath("/");
  revalidatePath("/content");
}

export async function listPlatformAccountsAction() {
  const accounts = await listPlatformAccounts();
  return accounts;
}

export async function upsertPlatformAccountAction(
  data: FormData,
) {
  const id = data.get("id")?.toString();
  const platform = data.get("platform")!.toString();
  const label = data.get("label")!.toString();
  const isEnabled = data.get("isEnabled")?.toString() === "on";
  const credentialsJson = data.get("credentials")?.toString() ?? "{}";
  const credentials = JSON.parse(credentialsJson);

  await upsertPlatformAccount({
    id,
    platform,
    label,
    isEnabled,
    credentials,
  });

  revalidatePath("/settings");
}

export async function dispatchJobsAction() {
  const processed = await dispatchDueJobs();
  return processed;
}
