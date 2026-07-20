import { reportClientError, reportClientNavigation } from "@/shared/observability/browser";

performance.mark("cmep-app-init");

window.addEventListener("error", (event) => {
  reportClientError("client.error", {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError("client.unhandledrejection", {
    reason: String(event.reason),
  });
});

export function onRouterTransitionStart(url: string, navigationType: "push" | "replace" | "traverse") {
  reportClientNavigation(url, navigationType);
}
