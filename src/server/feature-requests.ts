import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const StatusSchema = z.enum(["open", "planned", "done", "rejected"]);

const UpdateInput = z.object({
  password: z.string().min(1).max(200),
  id: z.string().uuid(),
  status: StatusSchema,
});

const DeleteInput = z.object({
  password: z.string().min(1).max(200),
  id: z.string().uuid(),
});

const VerifyInput = z.object({
  password: z.string().min(1).max(200),
});

function checkPassword(input: string): boolean {
  const expected = process.env.FEATURE_REQUEST_ADMIN_PASSWORD;
  if (!expected) return false;
  // Constant-time comparison
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => VerifyInput.parse(raw))
  .handler(async ({ data }) => {
    return { ok: checkPassword(data.password) };
  });

export const updateFeatureRequestStatus = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => UpdateInput.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) {
      throw new Error("Unauthorized");
    }
    const { error } = await supabaseAdmin
      .from("feature_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFeatureRequest = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => DeleteInput.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) {
      throw new Error("Unauthorized");
    }
    const { error } = await supabaseAdmin
      .from("feature_requests")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });