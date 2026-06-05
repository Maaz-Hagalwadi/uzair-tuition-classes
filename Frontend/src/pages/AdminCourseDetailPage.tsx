import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api from '../lib/api';

interface Course {
  id: number;
  title: string;
  description: string | null;
  duration: string | null;
  thumbnailUrl: string | null;
  status: string;
  createdByName: string | null;
  materialCount: number;
  createdAt: string;
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

const FILE_TYPES = ['PDF', 'Video', 'Document', 'Slides', 'Link', 'Other'];

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE:   { bg: 'bg-[#d8f4e4]', text: 'text-[#0a3320]', dot: 'bg-[#1a6b3a]' },
  DRAFT:    { bg: 'bg-[#fef9c3]', text: 'text-[#713f12]', dot: 'bg-[#ca8a04]' },
  INACTIVE: { bg: 'bg-[#e4e2e6]', text: 'text-[#47464f]', dot: 'bg-[#787680]' },
};

function fileTypeIcon(type: string | null) {
  const t = (type ?? '').toLowerCase();
  if (t === 'pdf') return 'picture_as_pdf';
  if (t === 'video') return 'smart_display';
  if (t === 'slides') return 'slideshow';
  if (t === 'link') return 'link';
  return 'description';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [matForm, setMatForm] = useState({ title: '', fileUrl: '', fileType: 'PDF' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const courseId = Number(id);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['admin-course', courseId],
    queryFn: async () => { const { data } = await api.get(`/admin/courses/${courseId}`); return data; },
    enabled: !!courseId,
  });

  const { data: materials = [], isLoading: matsLoading } = useQuery<Material[]>({
    queryKey: ['admin-course-materials', courseId],
    queryFn: async () => { const { data } = await api.get(`/admin/courses/${courseId}/materials`); return data; },
    enabled: !!courseId,
  });

  const invalidateMats = () => {
    qc.invalidateQueries({ queryKey: ['admin-course-materials', courseId] });
    qc.invalidateQueries({ queryKey: ['admin-course', courseId] });
    qc.invalidateQueries({ queryKey: ['admin-courses'] });
  };

  const addMutation = useMutation({
    mutationFn: (form: typeof matForm) => api.post(`/admin/courses/${courseId}/materials`, form),
    onSuccess: () => {
      invalidateMats();
      setMatForm({ title: '', fileUrl: '', fileType: 'PDF' });
      setShowAddForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (matId: number) => api.delete(`/admin/courses/${courseId}/materials/${matId}`),
    onSuccess: () => { invalidateMats(); setDeleteConfirm(null); },
  });

  if (courseLoading) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex items-center justify-center py-32 text-[#787680]">
          <span className="material-symbols-outlined text-[24px] animate-spin mr-2">sync</span>
          Loading…
        </div>
      </DashboardShell>
    );
  }

  if (!course) {
    return (
      <DashboardShell navItems={ADMIN_NAV}>
        <div className="flex items-center justify-center py-32 text-[#93000a]">
          <span className="material-symbols-outlined text-[24px] mr-2">error</span>
          Course not found.
        </div>
      </DashboardShell>
    );
  }

  const statusMeta = STATUS_META[course.status] ?? STATUS_META.INACTIVE;

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-1 text-sm text-[#505f76] hover:text-[#070235] mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Courses
        </button>

        {/* Course header */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden mb-6">
          <div className="h-40 bg-[#eaedff] flex items-center justify-center overflow-hidden">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <span
                className="material-symbols-outlined text-[56px] text-[#c8c5d0]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                menu_book
              </span>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="font-serif text-[24px] font-semibold text-[#070235] leading-snug">
                {course.title}
              </h1>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
              </span>
            </div>
            {course.description && (
              <p className="text-sm text-[#505f76] mb-4 leading-relaxed">{course.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-[#787680]">
              {course.duration && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {course.duration}
                </span>
              )}
              {course.createdByName && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {course.createdByName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {formatDate(course.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Materials section */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2e6]">
            <h2 className="font-semibold text-[#131b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#505f76]">attach_file</span>
              Course Materials
              <span className="ml-1 px-2 py-0.5 bg-[#eaedff] text-[#070235] rounded-full text-xs font-medium">
                {materials.length}
              </span>
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#070235] text-white rounded-lg text-xs font-semibold hover:bg-[#1e1b4b] transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Material
            </button>
          </div>

          {/* Add material form */}
          {showAddForm && (
            <div className="px-6 py-4 bg-[#faf8ff] border-b border-[#e4e2e6] space-y-3">
              {/* Mode toggle */}
              <div className="flex gap-1 bg-white border border-[#c8c5d0] rounded-lg p-1 w-fit">
                <button
                  type="button"
                  onClick={() => { setUploadMode('file'); setUploadError(''); setSelectedFile(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    uploadMode === 'file' ? 'bg-[#070235] text-white' : 'text-[#505f76] hover:bg-[#f2f3ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">upload_file</span>
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadMode('url'); setUploadError(''); setSelectedFile(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    uploadMode === 'url' ? 'bg-[#070235] text-white' : 'text-[#505f76] hover:bg-[#f2f3ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  Paste URL
                </button>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-lg px-3 py-2 text-xs">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {uploadError}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setUploadError('');

                  if (uploadMode === 'file') {
                    if (!selectedFile) { setUploadError('Please select a file.'); return; }
                    setUploadProgress(true);
                    try {
                      const fd = new FormData();
                      fd.append('file', selectedFile);
                      const { data } = await api.post('/admin/upload', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      addMutation.mutate({ ...matForm, fileUrl: data.url });
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    } catch (err: any) {
                      setUploadError(err.response?.data?.message ?? 'Upload failed. Check AWS credentials.');
                    } finally {
                      setUploadProgress(false);
                    }
                  } else {
                    if (!matForm.fileUrl) { setUploadError('Please enter a URL.'); return; }
                    addMutation.mutate(matForm);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#070235] mb-1">Title *</label>
                    <input
                      required
                      type="text"
                      value={matForm.title}
                      onChange={(e) => setMatForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Chapter 1 Notes"
                      className="block w-full px-3 py-2 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    />
                  </div>

                  {uploadMode === 'file' ? (
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-[#070235] mb-1">File *</label>
                      <div
                        className="relative flex items-center gap-2 px-3 py-2 bg-white border border-[#c8c5d0] rounded-lg cursor-pointer hover:border-[#070235] transition-all group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#505f76] group-hover:text-[#070235]">attach_file</span>
                        <span className="text-sm truncate text-[#505f76] group-hover:text-[#131b2e]">
                          {selectedFile ? selectedFile.name : 'Choose file…'}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp,.ppt,.pptx,.doc,.docx"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setSelectedFile(f);
                            setUploadError('');
                            if (f && !matForm.title) {
                              setMatForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }));
                            }
                          }}
                        />
                      </div>
                      {selectedFile && (
                        <p className="mt-1 text-[10px] text-[#787680]">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-[#070235] mb-1">URL *</label>
                      <input
                        type="url"
                        value={matForm.fileUrl}
                        onChange={(e) => setMatForm((f) => ({ ...f, fileUrl: e.target.value }))}
                        placeholder="https://…"
                        className="block w-full px-3 py-2 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#070235] mb-1">Type</label>
                    <select
                      value={matForm.fileType}
                      onChange={(e) => setMatForm((f) => ({ ...f, fileType: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all"
                    >
                      {FILE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedFile(null);
                      setUploadError('');
                      setMatForm({ title: '', fileUrl: '', fileType: 'PDF' });
                    }}
                    className="px-4 py-2 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-semibold hover:bg-[#f2f3ff] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addMutation.isPending || uploadProgress}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#070235] text-white rounded-lg text-xs font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60"
                  >
                    {(addMutation.isPending || uploadProgress) && (
                      <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                    )}
                    {uploadProgress ? 'Uploading…' : addMutation.isPending ? 'Saving…' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Materials list */}
          {matsLoading ? (
            <div className="flex items-center justify-center py-12 text-[#787680]">
              <span className="material-symbols-outlined text-[20px] animate-spin mr-2">sync</span>
              Loading materials…
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span
                className="material-symbols-outlined text-[40px] text-[#c8c5d0] mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                folder_open
              </span>
              <p className="text-sm text-[#787680]">No materials yet. Add the first one above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#e4e2e6]">
              {materials.map((mat) => (
                <li key={mat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#faf8ff] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-[#eaedff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[#070235]">
                      {fileTypeIcon(mat.fileType)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#131b2e] truncate">{mat.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {mat.fileType && (
                        <span className="text-xs text-[#787680]">{mat.fileType}</span>
                      )}
                      {mat.uploadedByName && (
                        <span className="text-xs text-[#787680]">· {mat.uploadedByName}</span>
                      )}
                      <span className="text-xs text-[#787680]">· {formatDate(mat.createdAt)}</span>
                    </div>
                  </div>
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#787680] hover:text-[#070235] hover:bg-[#f2f3ff] rounded-lg transition-colors"
                    title="Open"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                  {deleteConfirm === mat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(mat.id)}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-1 text-xs bg-[#ba1a1a] text-white rounded-lg font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs border border-[#c8c5d0] text-[#505f76] rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(mat.id)}
                      className="p-2 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
