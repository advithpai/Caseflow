export function cn(...classes) {
    return classes
        .flatMap((value) => {
            if (!value) return []

            if (typeof value === "string") {
                return value.split(" ")
            }

            if (Array.isArray(value)) {
                return value
            }

            if (typeof value === "object") {
                return Object.entries(value)
                    .filter(([, active]) => Boolean(active))
                    .map(([key]) => key)
            }

            return []
        })
        .filter(Boolean)
        .join(" ")
}

