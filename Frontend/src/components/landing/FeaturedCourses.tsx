import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface Course {
  id: number;
  title: string;
  description: string | null;
  duration: string | null;
  thumbnailUrl: string | null;
  status: string;
  materialCount: number;
}

interface SubjectMeta {
  image: string;
  topics: string[];
  grades: string;
}

const SUBJECT_MAP: { keywords: string[]; meta: SubjectMeta }[] = [
  {
    keywords: ['math', 'maths', 'mathematics'],
    meta: {
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
      topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
      grades: 'Grade 9 – 12',
    },
  },
  {
    keywords: ['physics'],
    meta: {
      image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80',
      topics: ['Mechanics', 'Electromagnetism', 'Optics', 'Modern Physics'],
      grades: 'Grade 9 – 12',
    },
  },
  {
    keywords: ['chem', 'chemistry'],
    meta: {
      image: 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&q=80',
      topics: ['Organic', 'Inorganic', 'Physical', 'Analytical'],
      grades: 'Grade 9 – 12',
    },
  },
  {
    keywords: ['bio', 'biology'],
    meta: {
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80',
      topics: ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology'],
      grades: 'Grade 9 – 12',
    },
  },
  {
    keywords: ['english', 'lang', 'language'],
    meta: {
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80',
      topics: ['Grammar', 'Essay Writing', 'Comprehension', 'Literature'],
      grades: 'Grade 9 – 12',
    },
  },
  {
    keywords: ['computer', 'cs', 'ict'],
    meta: {
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80',
      topics: ['Programming', 'Databases', 'Networking', 'Web Dev'],
      grades: 'Grade 9 – 12',
    },
  },
];

const FALLBACK_META: SubjectMeta = {
  image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
  topics: ['Concepts', 'Practice', 'Revision', 'Exams'],
  grades: 'Grade 9 – 12',
};

function getSubjectMeta(title: string): SubjectMeta {
  const lower = title.toLowerCase();
  for (const { keywords, meta } of SUBJECT_MAP) {
    if (keywords.some(k => lower.includes(k))) return meta;
  }
  return FALLBACK_META;
}

function getTopics(course: Course, meta: SubjectMeta): string[] {
  if (course.description) {
    const parts = course.description.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every(p => p.length < 40 && !p.includes('.'))) {
      return parts.slice(0, 4);
    }
  }
  return meta.topics;
}

export default function FeaturedCourses() {
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['public-courses'],
    queryFn: async () => (await api.get('/public/courses')).data,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section id="courses" className="py-12 bg-white">
      <div className="px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline text-[#0f172a] text-2xl font-bold">Featured Courses</h2>
            <p className="text-sm text-[#464555]">Structured curriculum aligned with board exams.</p>
          </div>
          <a href="#contact" className="text-[#1e1b4b] font-bold text-sm hover:underline">
            View all →
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-[#c7c4d8] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-[#e5eeff]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#e5eeff] rounded w-2/3" />
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(j => <div key={j} className="h-5 bg-[#f1f5f9] rounded-full w-16" />)}
                  </div>
                  <div className="h-3 bg-[#f1f5f9] rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-[#94a3b8] text-center py-8">No courses available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course, idx) => {
              const meta   = getSubjectMeta(course.title);
              const img    = course.thumbnailUrl || meta.image;
              const topics = getTopics(course, meta);
              const isFirst = idx === 0;

              return (
                <div
                  key={course.id}
                  className="bg-white border border-[#c7c4d8] rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform shadow-sm"
                >
                  {/* Image */}
                  <div className="h-36 relative overflow-hidden">
                    <img
                      src={img}
                      alt={course.title}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = meta.image; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isFirst && (
                      <div className="absolute top-3 left-3 bg-[#1e1b4b] text-white px-2.5 py-0.5 rounded text-xs font-bold">
                        Most Popular
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 text-[#1e1b4b] px-2.5 py-0.5 rounded text-xs font-medium">
                      {course.duration ?? meta.grades}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-headline font-semibold text-lg">{course.title}</h3>

                    {/* Topic chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map(t => (
                        <span key={t} className="bg-[#eff4ff] text-[#1e1b4b] text-xs px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-[#464555]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">menu_book</span>
                        {course.materialCount} {course.materialCount === 1 ? 'material' : 'materials'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        Board exam prep
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
