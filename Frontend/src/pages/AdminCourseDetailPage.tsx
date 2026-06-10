import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardShell from '../components/DashboardShell';
import { ADMIN_NAV } from '../lib/adminNav';
import api, { apiGet } from '../lib/api';
import { COURSE_STATUS_META } from '../lib/statusMeta';

interface CourseEditForm {
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  status: string;
}

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

  // Edit course state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<CourseEditForm>({ title: '', description: '', duration: '', thumbnailUrl: '', status: 'ACTIVE' });
  const [thumbUploading, setThumbUploading] = useState(false);
  const [editError, setEditError] = useState('');
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const courseId = Number(id);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['admin-course', courseId],
    queryFn: apiGet(`/admin/courses/${courseId}`),
    enabled: !!courseId,
  });

  const { data: materials = [], isLoading: matsLoading } = useQuery<Material[]>({
    queryKey: ['admin-course-materials', courseId],
    queryFn: apiGet(`/admin/courses/${courseId}/materials`),
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

  const updateCourseMutation = useMutation({
    mutationFn: (form: CourseEditForm) => api.put(`/admin/courses/${courseId}`, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      duration: form.duration.trim() || null,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      status: form.status,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] });
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      setEditing(false);
      setEditError('');
    },
    onError: (err: any) => setEditError(err.response?.data?.message ?? 'Failed to save changes.'),
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

  const statusMeta = COURSE_STATUS_META[course.status] ?? COURSE_STATUS_META.INACTIVE;

  return (
    <DashboardShell navItems={ADMIN_NAV}>
      <div className="max-w-6xl mx-auto">
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
          {/* Thumbnail */}
          <div className="relative h-28 sm:h-40 bg-[#eaedff] flex items-center justify-center overflow-hidden group">
            {(editing ? editForm.thumbnailUrl : course.thumbnailUrl) ? (
              <img
                src={editing ? editForm.thumbnailUrl : course.thumbnailUrl!}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="material-symbols-outlined text-[48px] sm:text-[56px] text-[#c8c5d0]"
                style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            )}
            {editing && (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                disabled={thumbUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {thumbUploading
                  ? <span className="material-symbols-outlined text-[28px] animate-spin">sync</span>
                  : <><span className="material-symbols-outlined text-[24px] mr-1">photo_camera</span><span className="text-sm font-semibold">Change Thumbnail</span></>
                }
              </button>
            )}
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setThumbUploading(true);
                try {
                  const fd = new FormData(); fd.append('file', file);
                  const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                  setEditForm(f => ({ ...f, thumbnailUrl: data.url }));
                } catch { setEditError('Thumbnail upload failed.'); }
                finally { setThumbUploading(false); e.target.value = ''; }
              }}
            />
          </div>

          <div className="p-4 sm:p-6">
            {editing ? (
              /* ── Edit form ── */
              <form onSubmit={(e) => { e.preventDefault(); updateCourseMutation.mutate(editForm); }} className="space-y-3">
                {editError && (
                  <div className="flex items-center gap-2 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-lg px-3 py-2 text-xs">
                    <span className="material-symbols-outlined text-[14px]">error</span>{editError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#070235] mb-1">Title *</label>
                    <input required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="block w-full px-3 py-2 border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#070235] mb-1">Status</label>
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      className="block w-full px-3 py-2 border border-[#c8c5d0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#070235] transition-all">
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#070235] mb-1">Description</label>
                    <textarea rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description or topic list (comma-separated)…"
                      className="block w-full px-3 py-2 border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#070235] mb-1">Duration</label>
                    <input value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                      placeholder="e.g. 3 months"
                      className="block w-full px-3 py-2 border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#070235] mb-1">Thumbnail URL <span className="font-normal text-[#787680]">(or click image above to upload)</span></label>
                  <input type="url" value={editForm.thumbnailUrl} onChange={e => setEditForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                    placeholder="https://…"
                    className="block w-full px-3 py-2 border border-[#c8c5d0] rounded-lg text-sm focus:outline-none focus:border-[#070235] transition-all" />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setEditing(false); setEditError(''); }}
                    className="px-4 py-2 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-semibold hover:bg-[#f2f3ff] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateCourseMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#070235] text-white rounded-lg text-xs font-semibold hover:bg-[#1e1b4b] transition-colors disabled:opacity-60">
                    {updateCourseMutation.isPending && <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>}
                    {updateCourseMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── View mode ── */
              <>
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                  <h1 className="font-serif text-[18px] sm:text-[24px] font-semibold text-[#070235] leading-snug">{course.title}</h1>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium ${statusMeta.bg} ${statusMeta.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                      {course.status.charAt(0) + course.status.slice(1).toLowerCase()}
                    </span>
                    <button
                      onClick={() => {
                        setEditForm({
                          title: course.title,
                          description: course.description ?? '',
                          duration: course.duration ?? '',
                          thumbnailUrl: course.thumbnailUrl ?? '',
                          status: course.status,
                        });
                        setEditing(true);
                        setEditError('');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-[#c8c5d0] text-[#505f76] rounded-lg text-xs font-semibold hover:bg-[#f2f3ff] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Edit
                    </button>
                  </div>
                </div>
                {course.description && (
                  <p className="text-[12px] sm:text-sm text-[#505f76] mb-3 sm:mb-4 leading-relaxed">{course.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-[#787680]">
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] sm:text-[14px]">schedule</span>
                      {course.duration}
                    </span>
                  )}
                  {course.createdByName && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] sm:text-[14px]">person</span>
                      {course.createdByName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] sm:text-[14px]">calendar_today</span>
                    {formatDate(course.createdAt)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Materials section */}
        <div className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e4e2e6]">
            <h2 className="text-[13px] sm:text-sm font-semibold text-[#131b2e] flex items-center gap-1.5 sm:gap-2">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#505f76]">attach_file</span>
              Course Materials
              <span className="ml-1 px-2 py-0.5 bg-[#eaedff] text-[#070235] rounded-full text-[11px] sm:text-xs font-medium">
                {materials.length}
              </span>
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 bg-[#070235] text-white rounded-lg text-[10px] sm:text-xs font-semibold hover:bg-[#1e1b4b] transition-colors"
            >
              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">add</span>
              Add Material
            </button>
          </div>

          {/* Add material form */}
          {showAddForm && (
            <div className="px-4 sm:px-6 py-4 bg-[#faf8ff] border-b border-[#e4e2e6] space-y-3">
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
                      const { data } = await api.post('/upload', fd, {
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
                <li key={mat.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#faf8ff] transition-colors">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#eaedff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#070235]">
                      {fileTypeIcon(mat.fileType)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] sm:text-sm font-medium text-[#131b2e] truncate">{mat.title}</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                      {mat.fileType && (
                        <span className="text-[10px] sm:text-xs text-[#787680]">{mat.fileType}</span>
                      )}
                      {mat.uploadedByName && (
                        <span className="text-[10px] sm:text-xs text-[#787680]">· {mat.uploadedByName}</span>
                      )}
                      <span className="text-[10px] sm:text-xs text-[#787680]">· {formatDate(mat.createdAt)}</span>
                    </div>
                  </div>
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 text-[#787680] hover:text-[#070235] hover:bg-[#f2f3ff] rounded-lg transition-colors"
                    title="Open"
                  >
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px]">open_in_new</span>
                  </a>
                  {deleteConfirm === mat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(mat.id)}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-1 text-[10px] sm:text-xs bg-[#ba1a1a] text-white rounded-lg font-semibold"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-[10px] sm:text-xs border border-[#c8c5d0] text-[#505f76] rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(mat.id)}
                      className="p-1.5 sm:p-2 text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px] sm:text-[16px]">delete</span>
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
