import { CheckCircle2, XCircle } from "lucide-react";

type AdminNoticeProps = {
  success?: string;
  error?: string;
};

export function AdminNotice({ success, error }: AdminNoticeProps) {
  const message = success || error;

  if (!message) {
    return null;
  }

  const isError = Boolean(error);
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      className={[
        "mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/25 bg-primary/10 text-foreground"
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <Icon data-icon="inline-start" />
      <p>{message}</p>
    </div>
  );
}
