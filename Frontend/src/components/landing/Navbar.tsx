import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Courses', href: '#courses' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 glass-effect border-b border-[#c7c4d8] transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <nav className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto h-14">
        <Logo size={32} textColor="#1e1b4b" />

        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                i === 0
                  ? 'text-[#1e1b4b] font-bold border-b-2 border-[#1e1b4b]'
                  : 'text-[#464555] hover:text-[#1e1b4b]'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden md:inline-flex px-4 py-1.5 border border-[#1e1b4b] text-[#1e1b4b] rounded-full text-sm font-medium hover:bg-[#1e1b4b] hover:text-white transition-all"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="hidden md:inline-flex px-4 py-1.5 bg-[#1e1b4b] text-white rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-md"
          >
            Get Started
          </Link>
          <button
            className="md:hidden text-[#1e1b4b]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden glass-effect border-t border-[#c7c4d8] px-6 py-4 flex flex-col gap-3">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#464555] hover:text-[#1e1b4b] py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="flex-1 text-center px-4 py-2 border border-[#1e1b4b] text-[#1e1b4b] rounded-full text-sm font-medium">
              Login
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}
              className="flex-1 text-center px-4 py-2 bg-[#1e1b4b] text-white rounded-full text-sm font-medium">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
