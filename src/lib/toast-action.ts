"use client";

import { toast } from "sonner";

export async function runAction<T>(
  promise: Promise<T>,
  options: { success?: string } = {}
): Promise<T> {
  const result = await promise;
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  ) {
    toast.error((result as { error: string }).error);
  } else if (options.success) {
    toast.success(options.success);
  }
  return result;
}
