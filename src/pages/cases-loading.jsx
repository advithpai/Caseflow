

import { Loader2 } from "lucide-react"

export default function CasesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3 text-muted-foreground animate-fade-in">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
        <span className="text-sm sm:text-base">Loading cases...</span>
      </div>
    </div>
  )
}
