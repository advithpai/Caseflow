/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date) {
  if (!date) return "N/A"
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return "N/A"

  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

  return formatDate(date)
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  if (num == null) return "0"
  return num.toLocaleString("en-US")
}

/**
 * Format percentage
 */
export function formatPercent(value, total) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}
