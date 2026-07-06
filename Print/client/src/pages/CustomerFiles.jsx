import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, FileText, Image as ImageIcon, Printer as PrinterIcon, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

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
      await api.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => String(j._id || j.id) !== String(jobId)));
      addToast('File deleted. Removed from printer dashboard.', 'success');
    } catch (err) {
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
      fetchJobs(); 
    } catch {
      addToast('Failed to clear files.', 'error');
    }
  };

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
      <motion.div 
        className="page page-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-lg)' }}>
             <ArrowLeft size={20} /> Back
          </button>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem' }}>My Recent Files</h1>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : jobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card glass empty-state" 
            style={{ padding: '80px 40px' }}
          >
            <div className="empty-state-icon">📄</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>No active files</div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>Search for a printer to start sending documents securely.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/customer/search')} style={{ marginTop: 32 }}>
               Find a Printer
            </button>
          </motion.div>
        ) : (
          <div className="my-files-list">
            <AnimatePresence>
              {Object.entries(byPrinter).map(([printerPublicId, printerJobs], index) => (
                <motion.div 
                  key={printerPublicId} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card glass" 
                  style={{ marginBottom: 24, borderRadius: 'var(--radius-xl)' }}
                >
                  <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PrinterIcon size={20}/></div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Shop ID: {printerPublicId}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{printerJobs.length} active document{printerJobs.length > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" style={{ fontWeight: 600, background: 'transparent', border: 'none' }} onClick={() => handleClearAll(printerPublicId)}>
                        Clear All
                    </button>
                  </div>
                  <div>
                     {printerJobs.map((job) => (
                        <div key={job._id || job.id} className="job-item" style={{ opacity: job.status === 'deleted' ? 0.6 : 1, padding: '20px 24px', background: 'rgba(255,255,255,0.4)', borderTop: '1px solid var(--border)' }}>
                           <div className={`job-file-icon ${isImage(job.mimeType) ? 'image' : 'pdf'}`} style={{ width: 44, height: 44, borderRadius: 12 }}>
                             {isImage(job.mimeType) ? <ImageIcon size={22} color="#0ea5e9"/> : <FileText size={22} color="#ef4444"/>}
                           </div>
                           <div style={{ flex: 1, minWidth: 0, marginLeft: 16 }}>
                              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{job.originalName}</div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12 }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {formatTime(job.sentAt)}</span>
                                 <span>{formatSize(job.fileSize)}</span>
                              </div>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span className={`badge ${statusColors[job.status] || 'badge-blue'}`} style={{ padding: '6px 12px', fontSize: 12 }}>{statusLabels[job.status]}</span>
                              {job.status !== 'deleted' && (
                                 <button className="btn btn-danger btn-sm" style={{ padding: '8px 12px' }} onClick={() => handleDelete(job._id || job.id, job.originalName)} disabled={deleting === (job._id || job.id)}>
                                    {deleting === (job._id || job.id) ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={16} />}
                                 </button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="alert alert-info" style={{ marginTop: 32, borderRadius: 'var(--radius-md)' }}>
          <ShieldCheck size={20} />
          <div>All files are end-to-end encrypted and automatically deleted after 24 hours for your security.</div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CustomerFiles;
