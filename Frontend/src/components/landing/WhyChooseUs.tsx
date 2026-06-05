const features = [
  {
    icon: 'person_raised_hand',
    title: 'Expert Teachers',
    description:
      'Learn from qualified, experienced tutors who know exactly where students struggle and how to fix it with clarity.',
    colSpan: 2,
    bg: 'bg-[#eff4ff]',
  },
  {
    icon: 'groups',
    title: 'Small Batches',
    description: 'Max 20 students per batch so every student gets individual attention.',
    colSpan: 1,
    bg: 'bg-white',
  },
  {
    icon: 'quiz',
    title: 'Weekly Tests',
    description: 'Regular assessments to track progress and identify weak areas early.',
    colSpan: 1,
    bg: 'bg-white',
  },
  {
    icon: 'menu_book',
    title: 'Study Materials & Doubt Sessions',
    description:
      'Comprehensive notes, practice sheets, and dedicated doubt-clearing sessions after every class.',
    colSpan: 2,
    bg: 'bg-[rgba(211,228,254,0.3)]',
    wide: true,
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-12 px-12 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-headline text-[#0f172a] text-2xl font-bold mb-2">
          Why Choose Uzair Tuition?
        </h2>
        <p className="text-sm text-[#464555] max-w-xl mx-auto">
          We don't just cover the syllabus — we build genuine understanding so students perform with confidence in exams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className={`${f.bg} border border-[#c7c4d8] rounded-xl p-5 flex ${
              f.wide ? 'items-center gap-6' : 'flex-col justify-between'
            } hover:shadow-md transition-shadow ${f.colSpan === 2 ? 'md:col-span-2' : ''}`}
          >
            {f.wide ? (
              <>
                <div className="flex-1">
                  <h3 className="font-headline font-semibold text-base mb-1">{f.title}</h3>
                  <p className="text-sm text-[#464555]">{f.description}</p>
                </div>
                <div className="hidden sm:block w-20 h-20 opacity-10 flex-shrink-0">
                  <span className="material-symbols-outlined text-[#1e1b4b]" style={{ fontSize: '80px' }}>
                    {f.icon}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-[rgba(30,27,75,0.1)] text-[#1e1b4b] rounded-lg flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                </div>
                <div>
                  <h3 className="font-headline font-semibold text-base mb-1">{f.title}</h3>
                  <p className="text-sm text-[#464555]">{f.description}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
