import { NextResponse } from "next/server";
import { createBoostOrder } from "@/lib/smm/boost-action";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createBoostOrder(body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
