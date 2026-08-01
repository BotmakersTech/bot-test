import type { NotificationResponse } from "../api/notification.api";

const DEFAULT_MAX_LEN = 90;

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Short, enterprise-style preview: message truncated on a word boundary,
 * falling back to the title when the notification has no message body. */
export function getPreview(notification: NotificationResponse, maxLen = DEFAULT_MAX_LEN): string {
  const message = collapseWhitespace(notification.message ?? "");
  if (!message) return notification.title;
  if (message.length <= maxLen) return message;

  const cut = message.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  const boundary = lastSpace > maxLen * 0.6 ? lastSpace : maxLen;
  return `${cut.slice(0, boundary).trimEnd()}…`;
}

/** Full message text, falling back to the title when there's no message. */
export function getFullText(notification: NotificationResponse): string {
  return collapseWhitespace(notification.message ?? "") || notification.title;
}

/** Whether getPreview() actually cuts the message short (i.e. there's more to show). */
export function isTruncated(notification: NotificationResponse, maxLen = DEFAULT_MAX_LEN): boolean {
  return collapseWhitespace(notification.message ?? "").length > maxLen;
}
