import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { TEACHER_NAV } from '../lib/teacherNav';
import api from '../lib/api';

interface Batch {
  id: number;
  courseId: number;
  courseName: string;
}

interface Material {
  id: number;
  courseId: number;
  title: string;
  fileUrl: string;
  fileType: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

interface Course {
  id: number;
  name: string;
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'picture_as_pdf',
  'video/mp4': 'smart_display',
  'video/webm': 'smart_display',
  'video/quicktime': 'smart_display',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/vnd.ms-powerpoint': 'slideshow',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'slideshow',
  'application/msword': 'description',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'description',
};
const FILE_COLORS: Record<string, string> = {
  picture_as_pdf: 'text-[#ef4444]',
  smart_display: 'text-[#8b5cf6]',
  image: 'text-[#10b981]',
  slideshow: 'text-[#f59e0b]',
  description: 'text-[#3b82f6]',
};

function fileIcon(type: string | null) {
  if (!type) return 'attach_file';
  return FILE_ICONS[type] ?? 'attach_file';
}
function fileColor(type: string | null) {
  const icon = fileIcon(type);
  return FILE_COLORS[icon] ?? 'text-[#6b7280]';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({
  courses,
  onClose,
  onUploaded,
}: {
  courses: Course[];
  onClose: () => void;
  onUploaded: (courseId: number) => void;
}) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id?.toString() ?? '');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!file || !title.trim() || !selectedCourse) return;
    setError('');
    setUploading(true);
    try {
      // Step 1: upload to S3
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'materials');
      const { data: uploadData } = await api.post<{ url: string }>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Step 2: create material record
      await api.post(`/admin/courses/${selectedCourse}/materials`, {
        title: title.trim(),
        fileUrl: uploadData.url,
        fileType: file.type,
      });

      onUploaded(Number(selectedCourse));
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = file && title.trim() && selectedCourse && !uploading;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="font-semibold text-[#1e1b4b] text-sm">Upload Material</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#fdf2f2] border border-[#fca5a5] rounded-lg text-xs text-[#ef4444]">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Course *</label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra Notes"
              className="w-full px-3 py-2 border border-[#e4e2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">File *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#e4e2e6] rounded-lg p-6 text-center cursor-pointer hover:border-[#6366f1] hover:bg-[#fafaff] transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${fileColor(file.type)}`}>{fileIcon(file.type)}</span>
                  <div className="text-left">
                    <p className="text-xs font-medium text-[#374151] truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-[#9ca3af]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 text-[#9ca3af] hover:text-[#ef4444]"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[32px] text-[#9ca3af] mb-1">upload_file</span>
                  <p className="text-xs text-[#6b7280]">Click to select a file</p>
                  <p className="text-[10px] text-[#9ca3af] mt-0.5">PDF, Video, Image, Word, PowerPoint — max 50 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.ppt,.pptx,.doc,.docx"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#f3f4f6]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#374151]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#1e1b4b] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {uploading && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TeacherMaterialsPage() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  const { data: batches = [], isLoading: batchLoading } = useQuery<Batch[]>({
    queryKey: ['teacher-batches'],
    queryFn: async () => { const { data } = await api.get('/teacher/batches'); return data; },
  });

  // Unique courses from teacher's batches
  const courses: Course[] = getUniqueCourses(batches);

  // Fetch materials for each course in parallel
  const { data: materialsByCourse = {} } = useQuery<Record<number, Material[]>>({
    queryKey: ['teacher-materials-all', courses.map(c => c.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        courses.map(async c => {
          const { data } = await api.get<Material[]>(`/admin/courses/${c.id}/materials`);
          return [c.id, data] as [number, Material[]];
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: courses.length > 0,
  });

  function invalidateMaterials(courseId: number) {
    qc.invalidateQueries({ queryKey: ['teacher-materials-all'] });
    setExpandedCourse(courseId);
  }

  const totalMaterials = Object.values(materialsByCourse).reduce((s, m) => s + m.length, 0);

  return (
    <DashboardShell navItems={TEACHER_NAV}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
          <div>
            <h1 className="font-['Source_Serif_4'] text-[20px] sm:text-[28px] font-semibold text-[#0f172a] leading-tight">Course Materials</h1>
            <p className="text-[11px] sm:text-[13px] text-[#64748b] mt-0.5">
              {totalMaterials > 0 ? `${totalMaterials} material${totalMaterials !== 1 ? 's' : ''} across ${courses.length} course${courses.length !== 1 ? 's' : ''}` : 'Upload PDFs, videos, and resources for your students'}
            </p>
          </div>
          {courses.length > 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="w-fit self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0f172a] text-white rounded-xl text-[12px] sm:text-sm font-medium hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[15px]">upload</span>
              Upload
            </button>
          )}
        </div>

        {batchLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[24px] animate-spin mb-2">sync</span>
            <p className="text-[13px]">Loading…</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <span className="material-symbols-outlined text-[36px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
            <p className="text-[13px] font-medium">No courses assigned yet</p>
            <p className="text-[11px] mt-1">You'll see materials here once you're assigned to a batch</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => {
              const materials = materialsByCourse[course.id] ?? [];
              const isExpanded = expandedCourse === course.id;
              return (
                <div key={course.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
                  {/* Course header — accordion toggle */}
                  <button
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-[#fafbff] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-[#6366f1]">menu_book</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-semibold text-[#0f172a]">{course.name}</p>
                        <p className="text-[11px] text-[#94a3b8]">{materials.length} material{materials.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-[#94a3b8] transition-transform shrink-0"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </button>

                  {/* Materials list */}
                  {isExpanded && (
                    <div className="border-t border-[#e2e8f0]">
                      {materials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
                          <span className="material-symbols-outlined text-[32px] mb-1">folder_open</span>
                          <p className="text-[12px]">No materials uploaded for this course</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#f1f5f9]">
                          {materials.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-[#fafbff] transition-colors">
                              <span className={`material-symbols-outlined text-[18px] sm:text-[20px] shrink-0 ${fileColor(m.fileType)}`}>
                                {fileIcon(m.fileType)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] sm:text-[13px] font-medium text-[#374151] truncate">{m.title}</p>
                                <p className="text-[10px] text-[#94a3b8]">
                                  {m.uploadedByName} · {fmtDate(m.createdAt)}
                                </p>
                              </div>
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-[#6366f1] hover:underline shrink-0"
                              >
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          courses={courses}
          onClose={() => setShowUpload(false)}
          onUploaded={invalidateMaterials}
        />
      )}
    </DashboardShell>
  );
}

function getUniqueCourses(batches: Batch[]): Course[] {
  const seen = new Set<number>();
  const result: Course[] = [];
  for (const b of batches) {
    if (!seen.has(b.courseId)) {
      seen.add(b.courseId);
      result.push({ id: b.courseId, name: b.courseName });
    }
  }
  return result;
}
