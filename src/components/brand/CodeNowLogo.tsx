import { cn } from "@/lib/utils"

type CodeNowLogoProps = {
  className?: string
  size?: number
}

export function CodeNowLogo({ className, size = 32 }: CodeNowLogoProps) {
  return (
    <div
      role="img"
      aria-label="CodeNow"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-[#3f51b5] font-bold tracking-tight text-[#cacfff]",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        lineHeight: 1,
      }}
    >
      CN
    </div>
  )
}
