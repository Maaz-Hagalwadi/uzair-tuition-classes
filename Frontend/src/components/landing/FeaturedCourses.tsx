const courses = [
  {
    title: 'Mathematics',
    grades: 'Grade 9 – 12',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    badge: 'Most Popular',
    topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
    sessionsPerWeek: 3,
    students: 85,
  },
  {
    title: 'Physics',
    grades: 'Grade 9 – 12',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80',
    badge: null,
    topics: ['Mechanics', 'Electromagnetism', 'Optics', 'Modern Physics'],
    sessionsPerWeek: 3,
    students: 72,
  },
  {
    title: 'Chemistry',
    grades: 'Grade 9 – 12',
    image: 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&q=80',
    badge: null,
    topics: ['Organic', 'Inorganic', 'Physical', 'Analytical'],
    sessionsPerWeek: 2,
    students: 68,
  },
];

export default function FeaturedCourses() {
  return (
    <section id="courses" className="py-12 bg-white">
      <div className="px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline text-[#0f172a] text-2xl font-bold">Featured Courses</h2>
            <p className="text-sm text-[#464555]">Structured curriculum aligned with board exams.</p>
          </div>
          <a href="#contact" className="text-[#1e1b4b] font-bold text-sm hover:underline">
            View all →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.title}
              className="bg-white border border-[#c7c4d8] rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform shadow-sm"
            >
              {/* Image */}
              <div className="h-36 relative overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {course.badge && (
                  <div className="absolute top-3 left-3 bg-[#1e1b4b] text-white px-2.5 py-0.5 rounded text-xs font-bold">
                    {course.badge}
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 text-[#1e1b4b] px-2.5 py-0.5 rounded text-xs font-medium">
                  {course.grades}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <h3 className="font-headline font-semibold text-lg">{course.title}</h3>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5">
                  {course.topics.map(t => (
                    <span key={t} className="bg-[#eff4ff] text-[#1e1b4b] text-xs px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-[#464555]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {course.students} students
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {course.sessionsPerWeek}× / week
                  </span>
                </div>

                <a
                  href="#contact"
                  className="block w-full py-2.5 text-center border border-[#1e1b4b] text-[#1e1b4b] rounded-xl text-sm font-medium hover:bg-[#1e1b4b] hover:text-white transition-all"
                >
                  Enroll Now
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
