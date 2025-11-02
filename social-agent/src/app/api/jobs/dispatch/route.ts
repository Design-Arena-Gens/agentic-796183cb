import { dispatchDueJobs } from "@/lib/services/posting-service";
import { NextResponse } from "next/server";

export async function GET() {
  const processed = await dispatchDueJobs();
  return NextResponse.json({ processed });
}

export async function POST() {
  const processed = await dispatchDueJobs();
  return NextResponse.json({ processed });
}
