const testimonials = [
  {
    name: 'Ali Hassan',
    grade: 'Grade 10, 2024',
    initials: 'AH',
    quote:
      '"My maths went from 55% to 92% after joining UTC. The teacher explains every concept patiently and the doubt sessions after class are incredibly helpful."',
    improvement: 'Maths: 55% → 92%',
  },
  {
    name: 'Zainab Malik',
    grade: 'Grade 12, 2024',
    initials: 'ZM',
    quote:
      '"Physics used to be my weakest subject. After joining the batch here, I not only understood the concepts but actually started enjoying them. Highly recommend!"',
    improvement: 'Physics: 48% → 88%',
  },
  {
    name: 'Ahmed Raza',
    grade: 'Grade 11, 2024',
    initials: 'AR',
    quote:
      '"The weekly tests kept me on track and the notes provided are excellent. Chemistry is now my strongest subject. The small batch size really makes a difference."',
    improvement: 'Chemistry: 60% → 85%',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-12 bg-[#f8f9ff]">
      <div className="px-12 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-headline text-[#0f172a] text-2xl font-bold mb-2">
            Student Results
          </h2>
          <p className="text-sm text-[#464555]">
            Real improvements from real students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white p-5 rounded-2xl border border-[#c7c4d8] relative">
              <span
                className="material-symbols-outlined text-[#1e1b4b] absolute top-3 right-3 select-none"
                style={{ fontSize: '48px', opacity: 0.08 }}
              >
                format_quote
              </span>

              <p className="text-sm italic text-[#0f172a] mb-4">{t.quote}</p>

              {/* Improvement badge */}
              <div className="inline-flex items-center gap-1.5 bg-[rgba(30,27,75,0.06)] rounded-lg px-3 py-1.5 mb-4">
                <span className="material-symbols-outlined text-[#1e1b4b] text-[14px]">trending_up</span>
                <span className="text-xs font-semibold text-[#1e1b4b]">{t.improvement}</span>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#e5eeff]">
                <div className="w-9 h-9 rounded-full bg-[#1e1b4b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-[#464555]">{t.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
