export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-10 px-6">
      <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <a href="/" className="font-display font-bold text-lg">conteo</a>
        <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          <a href="/pricing" className="hover:text-neutral-900 dark:hover:text-white transition">Pricing</a>
          <a href="/blog" className="hover:text-neutral-900 dark:hover:text-white transition">Blog</a>
          <a href="/docs" className="hover:text-neutral-900 dark:hover:text-white transition">Docs</a>
          <a href="/about" className="hover:text-neutral-900 dark:hover:text-white transition">About</a>
          <a href="/vs/google-analytics" className="hover:text-neutral-900 dark:hover:text-white transition">vs GA</a>
          <a href="/login" className="hover:text-neutral-900 dark:hover:text-white transition">Login</a>
          <a href="/signup" className="hover:text-neutral-900 dark:hover:text-white transition">Sign Up</a>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/50 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-600">
          &copy; 2026 Conteo. Simple and private analytics.
        </p>
      </div>
    </footer>
  )
}
