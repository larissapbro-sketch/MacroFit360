import { cn } from "@/lib/utils/cn";

interface FormMessageProps {
  type?: "error" | "success";
  message?: string | null;
}

export function FormMessage({ type = "error", message }: FormMessageProps) {
  if (!message) return null;

  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[var(--radius-sm)] px-3 py-2 text-sm",
        type === "error" && "bg-danger/10 text-danger",
        type === "success" && "bg-success/10 text-success"
      )}
    >
      {message}
    </p>
  );
}
