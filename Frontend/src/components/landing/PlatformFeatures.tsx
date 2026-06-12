import { useState } from 'react';

type Role = 'student' | 'teacher' | 'admin';

const FEATURES: Record<Role, { icon: string; title: string; description: string }[]> = {
  student: [
    { icon: 'smart_toy',       title: 'AI Study Assistant',    description: 'Ask any subject question and get instant explanations, concept breakdowns, and study tips powered by AI.' },
    { icon: 'quiz',            title: 'Online Quizzes',        description: 'Attempt timed quizzes assigned by your teacher. See your score and review every answer right after.' },
    { icon: 'assignment',      title: 'Assignments',           description: 'Submit assignments, track due dates, and view teacher feedback and marks all in one place.' },
    { icon: 'calendar_month',  title: 'Class Schedule',        description: 'View upcoming sessions with one-click meeting links for online classes. Never miss a session.' },
    { icon: 'fact_check',      title: 'Attendance Tracking',   description: 'Check your attendance percentage per batch and stay on top of your presence record in real time.' },
    { icon: 'menu_book',       title: 'Study Materials',       description: 'Download teacher-uploaded notes, PDFs, and practice sheets anytime, from any device.' },
    { icon: 'trending_up',     title: 'Progress Tracking',     description: 'Visualise quiz scores and academic progress over time with clear, easy-to-read charts.' },
    { icon: 'payments',        title: 'Payment Status',        description: 'Check fee payment history and pending dues without having to contact anyone.' },
    { icon: 'campaign',        title: 'Announcements',         description: 'Receive important notices, holiday schedules, and batch updates from your teacher instantly.' },
    { icon: 'support_agent',   title: 'Support Tickets',       description: 'Raise a query and get a direct reply from admin. Track the status of every ticket you raise.' },
  ],
  teacher: [
    { icon: 'smart_toy',       title: 'AI Quiz Generator',     description: 'Generate multiple-choice questions on any topic with one click using AI, then publish directly to your batch.' },
    { icon: 'assignment_add',  title: 'AI Assignment Creator', description: 'Draft complete assignments with AI-generated descriptions, objectives, and marking criteria in seconds.' },
    { icon: 'groups',          title: 'Batch Management',      description: 'Create and manage batches, add students, and organise your classes by subject and grade effortlessly.' },
    { icon: 'calendar_month',  title: 'Session Scheduling',    description: 'Schedule class sessions with Google Meet, Zoom, or Teams links that students can access directly.' },
    { icon: 'how_to_reg',      title: 'Attendance Marking',    description: 'Mark attendance for every session in seconds — one click per student, with a full history.' },
    { icon: 'upload_file',     title: 'Study Materials',       description: 'Upload notes, PDFs, and worksheets to the cloud and share them with your batch students instantly.' },
    { icon: 'quiz',            title: 'Quiz Management',       description: 'Create, edit, and publish quizzes with custom time limits. Review each student\'s attempt in detail.' },
    { icon: 'grading',         title: 'Assignment Grading',    description: 'Review student submissions, add marks and feedback, and publish grades directly from the platform.' },
    { icon: 'campaign',        title: 'Announcements',         description: 'Post batch-level announcements visible to all enrolled students with push notifications.' },
    { icon: 'people',          title: 'Student Overview',      description: 'View all enrolled students across every batch you teach in a single consolidated list.' },
  ],
  admin: [
    { icon: 'manage_accounts',      title: 'User Management',       description: 'Create and manage student, teacher, and admin accounts. Assign roles and reset credentials.' },
    { icon: 'library_books',        title: 'Course Management',     description: 'Create courses with full descriptions and materials. Organise them into structured batches.' },
    { icon: 'school',               title: 'Batch Management',      description: 'Create batches, assign teachers, set schedules, and manage enrollment capacity end-to-end.' },
    { icon: 'how_to_reg',           title: 'Enrollment Control',    description: 'Approve or reject student enrollment requests instantly. Full visibility into pending requests.' },
    { icon: 'payments',             title: 'Payment Tracking',      description: 'Mark and track fee payments for all students. View pending dues and payment history at a glance.' },
    { icon: 'support_agent',        title: 'Support Inbox',         description: 'View and reply to all student and teacher support tickets. Set status to Open, In Progress, or Closed.' },
    { icon: 'contact_phone',        title: 'Lead Management',       description: 'Track callback requests from the landing page and manage prospective student inquiries.' },
    { icon: 'analytics',            title: 'Reports & Analytics',   description: 'Platform-wide reports on enrollments, revenue, attendance, and quiz performance trends.' },
    { icon: 'visibility',           title: 'Visitor Analytics',     description: 'Monitor website visitors in real time — browser, device, OS, page, and referrer source.' },
    { icon: 'history',              title: 'Login History',         description: 'Audit every login with IP address, device, browser, and timestamp for complete security oversight.' },
    { icon: 'smart_toy',            title: 'AI Assistant',          description: 'Use AI to draft platform-wide announcements, generate content, and handle administrative tasks faster.' },
    { icon: 'campaign',             title: 'Global Announcements',  description: 'Broadcast announcements to all students and teachers across the entire platform at once.' },
  ],
};

const TABS: { key: Role; label: string; icon: string; active: string; pill: string }[] = [
  { key: 'student', label: 'For Students', icon: 'school',               active: 'bg-[#1e1b4b] text-white',         pill: 'bg-[#eff4ff] text-[#1e1b4b]'  },
  { key: 'teacher', label: 'For Teachers', icon: 'person_raised_hand',   active: 'bg-[#15803d] text-white',         pill: 'bg-[#f0fdf4] text-[#15803d]'  },
  { key: 'admin',   label: 'For Admins',   icon: 'admin_panel_settings', active: 'bg-[#7c3aed] text-white',         pill: 'bg-[#f5f3ff] text-[#7c3aed]'  },
];

const ICON_COLOR: Record<Role, { bg: string; color: string }> = {
  student: { bg: '#eff4ff', color: '#1e1b4b' },
  teacher: { bg: '#f0fdf4', color: '#15803d' },
  admin:   { bg: '#f5f3ff', color: '#7c3aed' },
};

export default function PlatformFeatures() {
  const [role, setRole] = useState<Role>('student');
  const ic = ICON_COLOR[role];

  return (
    <section id="features" className="py-16 px-6 sm:px-12 bg-[#f8f9ff]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(30,27,75,0.08)] text-[#1e1b4b] rounded-full text-xs font-medium mb-3">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Full-Featured Platform
          </span>
          <h2 className="font-headline text-[#0f172a] text-2xl sm:text-3xl font-bold mb-3">
            Everything your institute needs
          </h2>
          <p className="text-sm text-[#464555] max-w-xl mx-auto">
            A complete learning management system built for students, teachers, and admins — all in one place.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-2xl p-1.5 shadow-sm">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setRole(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  role === t.key ? t.active + ' shadow-sm' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {t.icon}
                </span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.replace('For ', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES[role].map(f => (
            <div
              key={f.title}
              className="bg-white border border-[#e2e8f0] rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0"
                style={{ backgroundColor: ic.bg }}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: ic.color, fontVariationSettings: "'FILL' 1" }}
                >
                  {f.icon}
                </span>
              </div>
              <h3 className="font-headline font-semibold text-[#0f172a] text-[14px] mb-1.5">{f.title}</h3>
              <p className="text-[12px] text-[#64748b] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <a
            href="/register"
            className="px-6 py-3 bg-[#1e1b4b] text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            Get Started Free
          </a>
          <a
            href="#contact"
            className="px-6 py-3 border-2 border-[#1e1b4b] text-[#1e1b4b] rounded-xl text-sm font-semibold hover:bg-[rgba(30,27,75,0.05)] transition-colors"
          >
            Request a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
