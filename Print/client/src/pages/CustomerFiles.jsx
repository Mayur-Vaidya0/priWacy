import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RefreshCw, FileText, Image, Clock, Printer as PrinterIcon, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusColors = {
  pending: 'badge-amber',
  printing: 'badge-blue',
  completed: 'badge-green',
  deleted: 'badge-red',
};

const statusLabels = {
  pending: '⏳ Pending',
  printing: '🖨️ Printing',
  completed: '✅ Done',
  deleted: '🗑️ Deleted',
};

const CustomerFiles = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/my-sent');
      setJobs(data.jobs || []);
    } catch {
      addToast('Failed to load files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleDelete = async (jobId, fileName) => {
    if (!confirm(`Delete "${fileName}"? This will instantly remove it from the printer's dashboard.`)) return;
    setDeleting(jobId);
    try {
      console.log('Deleting job:', jobId);
      await api.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => String(j._id || j.id) !== String(jobId)));
      addToast('File deleted. Removed from printer dashboard.', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      addToast(err.response?.data?.message || 'Failed to delete file.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async (printerPublicId) => {
    if (!confirm(`Clear all documents sent to printer ${printerPublicId}?`)) return;
    try {
      await api.delete(`/jobs/clear-all/${printerPublicId}`);
      setJobs(prev => prev.map(j => 
        j.printerPublicId === printerPublicId ? { ...j, status: 'deleted' } : j
      ).filter(j => j.printerPublicId !== printerPublicId || j.status !== 'deleted'));
      addToast(`All files for ${printerPublicId} cleared.`, 'success');
      fetchJobs(); // Refresh to be sure
    } catch {
      addToast('Failed to clear files.', 'error');
    }
  };

  // Group jobs by printer
  const byPrinter = jobs.reduce((acc, job) => {
    const key = job.printerPublicId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});

  const isImage = (mime) => mime?.startsWith('image/');

  return (
    <div className="app-container">
      <Navbar />
      <div className="page page-md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: 0 }}>
             <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">My Recent Files</h1>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : jobs.length === 0 ? (
          <div className="card empty-state" style={{ padding: 60 }}>
            <div className="empty-state-icon">📄</div>
            <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-primary)' }}>No active files</div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Search for a printer to start sending documents.</p>
            <button className="btn btn-primary btn-md" onClick={() => navigate('/customer/search')} style={{ marginTop: 24 }}>
               Find a Printer
            </button>
          </div>
        ) : (
          <div className="my-files-list">
            {Object.entries(byPrinter).map(([printerPublicId, printerJobs]) => (
              <div key={printerPublicId} className="card" style={{ marginBottom: 20 }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PrinterIcon size={16}/></div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Printer: {printerPublicId}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-danger)' }} onClick={() => handleClearAll(printerPublicId)}>
                      Clear All
                  </button>
                </div>
                <div>
                   {printerJobs.map((job) => (
                      <div key={job._id} className="job-item" style={{ opacity: job.status === 'deleted' ? 0.6 : 1 }}>
                         <div className={`job-file-icon ${isImage(job.mimeType) ? 'image' : 'pdf'}`}>
                           {isImage(job.mimeType) ? <Image size={16} color="#0d9488"/> : <FileText size={16} color="#dc2626"/>}
                         </div>
                         <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{job.originalName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                               {formatTime(job.sentAt)} • {formatSize(job.fileSize)}
                            </div>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`badge ${statusColors[job.status] || 'badge-blue'}`}>{statusLabels[job.status]}</span>
                            {job.status !== 'deleted' && (
                               <button className="btn btn-danger btn-sm" style={{ padding: 6 }} onClick={() => handleDelete(job._id, job.originalName)} disabled={deleting === job._id}>
                                  {deleting === job._id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={14} />}
                               </button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="alert alert-info" style={{ marginTop: 24 }}>
          🕐 All files are automatically deleted after 24 hours for your security.
        </div>
      </div>
    </div>
  );
};

export default CustomerFiles;
