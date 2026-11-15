import { memo } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = ({ sidebarOpen, onToggle }) => {
  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm lg:left-72">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="text-base font-bold sm:text-lg bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            InterviewIQ
          </h1>
        </div>
      </header>
    </div>
  );
};

export default memo(Navbar);
