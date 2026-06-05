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
              {[
                { icon: 'facebook', label: 'Facebook' },
                { icon: 'instagram', label: 'Instagram' },
                { icon: 'youtube_activity', label: 'YouTube' },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[#6366f1] flex items-center justify-center transition-colors"
                  aria-label={s.label}
                >
                  <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                </a>
              ))}
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
                { icon: 'location_on', text: '123 Education St, Karachi' },
                { icon: 'call', text: '+92 300 1234567' },
                { icon: 'mail', text: 'info@uzairtuition.com' },
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
