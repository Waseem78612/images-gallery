export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
        <span>🖼️ Image Gallery — Upload · Compress · Manage</span>
        <span>© {new Date().getFullYear()} — Built with MERN + Sharp</span>
      </div>
    </footer>
  );
}
