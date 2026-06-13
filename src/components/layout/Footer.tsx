export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-1 px-6 py-8 text-center text-xs tracking-[0.24px]">
        <p className="font-medium text-[#575e70]">
          {new Date().getFullYear()} CodeNow Next App. Powered by{" "}
          <span className="font-bold text-brand">CodeNow</span>
        </p>
      </div>
    </footer>
  )
}
