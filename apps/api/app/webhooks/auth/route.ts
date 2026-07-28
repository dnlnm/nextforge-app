import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
  await request.text();
  return NextResponse.json(
    { message: "Supabase Auth manages user sessions directly", ok: false },
    { status: 410 }
  );
};
