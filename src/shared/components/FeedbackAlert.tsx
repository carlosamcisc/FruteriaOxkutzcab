export type Feedback = { type: "success" | "error"; message: string };

export function FeedbackAlert({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) {
    return null;
  }

  return (
    <div className={`alert alert-${feedback.type === "success" ? "success" : "danger"}`} role="alert">
      {feedback.message}
    </div>
  );
}
