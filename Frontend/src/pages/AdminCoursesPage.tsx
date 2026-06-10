import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
export { ADMIN_NAV };
import api, { apiGet } from '../lib/api';
import { COURSE_STATUS_META } from '../lib/statusMeta';

interface Course {
  id: number;
  title: string;
  description: string | null;
  duration: string | null;
  thumbnailUrl: string | null;
  status: string;
  materialCount: number;
}

interface CourseForm {
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  status: string;
}

const EMPTY_FORM: CourseForm = { title: '', description: '', duration: '', thumbnailUrl: '', status: 'ACTIVE' };

function StatusBadge({ status }: { status: string }) {
  const m = COURSE_STATUS_META[status] ?? COURSE_STATUS_META.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function CourseModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: CourseForm & { id?: number };
  onClose: () => void;
  onSave: (form: CourseForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CourseForm>({
    title: initial.title,
    description: initial.description,
    duration: initial.duration,
    thumbnailUrl: initial.thumbnailUrl,
    status: initial.status,
  });
  const set = (k: keyof CourseForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!initial.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2e6]">
          <h2 className="font-semibold text-[#131b2e]">{isEdit ? 'Edit Course' : 'New Course'}</h2>
          <button onClick={onClose} className="text-[#787680] hover:text-[#131b2e] transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">Title *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Mathematics Grade 10"
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">
              Description <span className="font-normal text-[#787680]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What students will learn…"
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">
                Duration <span className="font-normal text-[#787680]">(optional)</span>
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                placeholder="e.g. 3 months"
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#070235] mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#070235] mb-1.5">
              Thumbnail URL <span className="font-normal text-[#787680]">(optional)</span>
            </label>
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={(e) => set('thumbnailUrl', e.target.value)}
              placeholder="https://…"
              className="block w-full px-4 py-2.5 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] focus:ring-2 focus:ring-[#070235]/10 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-sm font-semibold hover:bg-[#f2f3ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60"
            >
              {saving && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [modal, setModal] = useState<null | (CourseForm & { id?: number })>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: courses = [], isLoading, isError } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: apiGet('/admin/courses'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-courses'] });

  const createMutation = useMutation({
    mutationFn: (form: CourseForm) => api.post('/admin/courses', form),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: CourseForm }) => api.put(`/admin/courses/${id}`, form),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/courses/${id}`),
    onSuccess: () => { invalidate(); setDeleteConfirm(null); },
  });

  function handleSave(form: CourseForm) {
    if (modal?.id) updateMutation.mutate({ id: modal.id, form });
    else createMutation.mutate(form);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="font-serif text-[20px] sm:text-[28px] leading-tight sm:leading-[36px] font-semibold text-[#070235]">Courses</h1>
            <p className="text-[11px] sm:text-sm text-[#505f76] mt-0.5 sm:mt-1">Create and manage courses on the platform.</p>
          </div>
          <button
            onClick={() => setModal(EMPTY_FORM)}
            className="w-fit self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-[#070235] text-white rounded-lg text-[12px] sm:text-sm font-semibold hover:bg-[#1e1b4b] transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] sm:text-[18px]">add</span>
            New Course
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32 text-[#787680]">
            <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
            Loading courses…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-32 text-[#93000a]">
            <span className="material-symbols-outlined text-[24px] mr-2">error</span>
            Failed to load courses.
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span
              className="material-symbols-outlined text-[56px] text-[#c8c5d0] mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              menu_book
            </span>
            <p className="text-sm text-[#787680] mb-4">No courses yet. Create your first one.</p>
            <button
              onClick={() => setModal(EMPTY_FORM)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#070235] text-white rounded-lg text-sm font-semibold hover:bg-[#1e1b4b] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {courses.map((course) => (
              <div key={course.id} className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail with status badge overlay */}
                <div
                  className="relative h-24 sm:h-36 bg-[#eaedff] flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                >
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className="material-symbols-outlined text-[36px] sm:text-[48px] text-[#c8c5d0]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      menu_book
                    </span>
                  )}
                  {/* Status badge — overlaid on image on mobile, hidden (shown below) on desktop */}
                  <div className="absolute top-1.5 right-1.5 sm:hidden">
                    <StatusBadge status={course.status} />
                  </div>
                </div>

                <div className="p-2.5 sm:p-4">
                  {/* Desktop: title + badge side by side */}
                  <div className="hidden sm:flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="font-semibold text-[#131b2e] text-sm leading-snug cursor-pointer hover:text-[#070235] line-clamp-2"
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                    >
                      {course.title}
                    </h3>
                    <StatusBadge status={course.status} />
                  </div>

                  {/* Mobile: title only (badge is on thumbnail) */}
                  <h3
                    className="sm:hidden font-semibold text-[#131b2e] text-[12px] leading-snug cursor-pointer hover:text-[#070235] line-clamp-2 mb-2"
                    onClick={() => navigate(`/admin/courses/${course.id}`)}
                  >
                    {course.title}
                  </h3>

                  {course.description && (
                    <p className="hidden sm:block text-xs text-[#787680] line-clamp-2 mb-3">{course.description}</p>
                  )}

                  <div className="hidden sm:flex items-center gap-3 text-xs text-[#505f76] mb-4">
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {course.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">attach_file</span>
                      {course.materialCount} material{course.materialCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Mobile: icon-only actions */}
                  <div className="sm:hidden flex items-center justify-between border-t border-[#f1f0f4] pt-2 mt-1">
                    <button
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                      className="flex items-center gap-1 text-[10px] text-[#505f76] font-medium"
                    >
                      <span className="material-symbols-outlined text-[13px]">folder_open</span>
                      View
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal({ id: course.id, title: course.title, description: course.description ?? '', duration: course.duration ?? '', thumbnailUrl: course.thumbnailUrl ?? '', status: course.status })}
                        className="p-1 text-[#787680] hover:text-[#070235] rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      {deleteConfirm === course.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteMutation.mutate(course.id)} disabled={deleteMutation.isPending}
                            className="px-1.5 py-0.5 text-[10px] bg-[#ba1a1a] text-white rounded font-semibold">OK</button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="px-1.5 py-0.5 text-[10px] border border-[#c8c5d0] text-[#505f76] rounded">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(course.id)}
                          className="p-1 text-[#787680] hover:text-[#ba1a1a] rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop: full action row */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-medium hover:bg-[#f2f3ff] hover:text-[#070235] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">folder_open</span>
                      Materials
                    </button>
                    <button
                      onClick={() => setModal({ id: course.id, title: course.title, description: course.description ?? '', duration: course.duration ?? '', thumbnailUrl: course.thumbnailUrl ?? '', status: course.status })}
                      className="p-2 text-[#787680] hover:text-[#070235] hover:bg-[#f2f3ff] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    {deleteConfirm === course.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteMutation.mutate(course.id)}
                          disabled={deleteMutation.isPending}
                          className="px-2 py-1 text-xs bg-[#ba1a1a] text-white rounded-lg font-semibold hover:bg-[#93000a] transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 text-xs border border-[#c8c5d0] text-[#505f76] rounded-lg hover:bg-[#f2f3ff] transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(course.id)}
                        className="p-2 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CourseModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </DashboardShell>
  );
}
