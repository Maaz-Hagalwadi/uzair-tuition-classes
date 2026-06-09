import { LogoMark } from '../Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1e1b4b] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoMark size={34} />
              <span className="font-bold text-[15px] text-white leading-none tracking-tight">Uzair TC</span>
            </div>
            <p className="text-sm text-[rgba(255,255,255,0.55)] leading-relaxed mb-5">
              Empowering students to achieve academic excellence through expert guidance and personalised attention.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[#6366f1] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[#6366f1] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[#6366f1] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Courses', href: '#courses' },
                { label: 'Upcoming Batches', href: '#batches' },
                { label: 'About Us', href: '#about' },
                { label: 'Contact', href: '#contact' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Courses</h4>
            <ul className="space-y-2.5">
              {['Mathematics', 'Physics', 'Chemistry', 'Grade 9–10', 'Grade 11–12'].map(c => (
                <li key={c}>
                  <a href="#courses" className="text-sm text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Contact</h4>
            <ul className="space-y-3">
              {[
                { icon: 'location_on', text: 'Valki, Honnavar, Karnataka 581335' },
                { icon: 'call', text: '+91 9980386446' },
                { icon: 'mail', text: 'info.uzairtuitionclasses@gmail.com' },
                { icon: 'schedule', text: 'Mon–Sat: 9 AM – 7 PM' },
              ].map(item => (
                <li key={item.icon} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#818cf8] text-[16px] mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span className="text-sm text-[rgba(255,255,255,0.55)]">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.08)] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[rgba(255,255,255,0.4)]">
            © {currentYear} Uzair Tuition Classes. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service'].map(l => (
              <a key={l} href="#" className="text-xs text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
