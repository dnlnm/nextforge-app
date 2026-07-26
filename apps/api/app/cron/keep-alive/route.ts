import { database } from "@repo/database";

export const GET = async () => {
  await database.organization.count();

  return new Response("OK", { status: 200 });
};
