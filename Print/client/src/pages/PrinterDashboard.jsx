import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Eye, FileText, Image as ImageIcon, Clock, Users, CheckCircle, AlertCircle, QrCode, Download, Printer as PrinterIcon, X, ShieldCheck } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import SecureViewer from '../components/SecureViewer';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusColors = { pending: 'badge-amber', printing: 'badge-blue', completed: 'badge-green', deleted: 'badge-red' };
const statusLabels = { pending: '⏳ Pending', printing: '🔄 Printing', completed: '✅ Done', deleted: '🗑️ Deleted' };

const PrinterDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [viewer, setViewer] = useState(null); 
  const [printing, setPrinting] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/jobs/dashboard');
      setCustomers(data.customers || []);
    } catch {
      addToast('Failed to refresh dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const toggleExpand = (customerId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(customerId) ? next.delete(customerId) : next.add(customerId);
      return next;
    });
  };

  const handleDownloadQR = async (format) => {
    const canvas = document.querySelector('.qr-container-export canvas');
    if (!canvas) {
      addToast('QR code readying...', 'info');
      return;
    }
    try {
      const link = document.createElement('a');
      link.download = `Shop_QR_${user?.publicId}.${format}`;
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      link.href = canvas.toDataURL(mime);
      link.click();
    } catch (err) {
      console.error(err);
      addToast('Failed to download QR code.', 'error');
    }
  };

  const handlePrintQR = () => {
    const printContent = qrRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Printer QR Code - ${user?.publicId}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            .card { padding: 40px; border: 3px solid #000; border-radius: 30px; text-align: center; }
            h1 { font-size: 32px; margin-bottom: 20px; }
            .qr-wrapper { margin: 20px 0; }
            .id-text { font-size: 24px; font-weight: bold; margin-top: 20px; color: #4f8ef7; }
            .hint { color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Scan to Send Files</h1>
            <div class="qr-wrapper">${printContent.innerHTML}</div>
            <div class="id-text">Printer ID: ${user?.publicId}</div>
            <div class="hint">${user?.printerName || user?.name}</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = async (jobId) => {
    setPrinting(jobId);
    try {
      await api.post(`/jobs/print/${jobId}`);
      addToast('Marked as printed! ✅', 'success');
      setCustomers(prev => prev.map(c => ({
        ...c,
        jobs: c.jobs.map(j => j.id === jobId ? { ...j, status: 'completed' } : j)
      })));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setPrinting(null);
      setViewer(null);
    }
  };

  const totalJobs = customers.reduce((s, c) => s + c.jobCount, 0);
  const pending = customers.reduce((s, c) => s + c.jobs.filter(j => j.status === 'pending').length, 0);
  const done = customers.reduce((s, c) => s + c.jobs.filter(j => j.status === 'completed').length, 0);
  const isImage = (mime) => mime?.startsWith('image/');

  return (
    <div className="app-container">
      <Navbar />
      <motion.div 
        className="page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">{user?.printerName || user?.name}</h1>
            <p className="page-subtitle">Shop ID: <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{user?.publicId}</span></p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowQR(true)}>
              <QrCode size={18} /> Shop QR
            </button>
            <button className="btn btn-primary" onClick={fetchDashboard}>
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 40 }}>
          <motion.div whileHover={{ y: -4 }} className="card stat-card glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
             <div style={{ width: 56, height: 56, background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={28}/></div>
             <div>
               <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{customers.length}</div>
               <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Active Clients</div>
             </div>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="card stat-card glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
             <div style={{ width: 56, height: 56, background: '#fff7ed', color: '#ea580c', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={28}/></div>
             <div>
               <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{pending}</div>
               <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Jobs</div>
             </div>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="card stat-card glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
             <div style={{ width: 56, height: 56, background: '#f0fdf4', color: '#16a34a', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={28}/></div>
             <div>
               <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{done}</div>
               <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Printed Today</div>
             </div>
          </motion.div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : customers.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state card glass">
            <div className="empty-state-icon">📭</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>No incoming jobs</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Share your Shop ID <strong style={{ color: 'var(--text-primary)' }}>{user?.publicId}</strong> with customers to receive print jobs
            </div>
          </motion.div>
        ) : (
          <div className="job-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {customers.map((customer, index) => {
              const isOpen = expanded.has(customer.customerPublicId);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={customer.customerPublicId} 
                  className="customer-row"
                >
                  <div
                    className="customer-row-header"
                    onClick={() => toggleExpand(customer.customerPublicId)}
                    id={`customer-row-${customer.customerPublicId}`}
                    style={{ background: isOpen ? 'var(--bg-secondary)' : 'white' }}
                  >
                    <div className="customer-avatar">
                      {customer.customerPublicId.charAt(0)}
                    </div>
                    <div className="customer-info" style={{ flex: 1 }}>
                      <div className="customer-id" style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                        👤 {customer.customerPublicId} 
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8, fontWeight: 500 }}>
                          ({customer.customerName})
                        </span>
                      </div>
                      <div className="customer-meta" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {customer.jobCount} file{customer.jobCount !== 1 ? 's' : ''} •
                        <Clock size={12} />
                        {formatTime(customer.latestSentAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {customer.jobs.some(j => j.status === 'pending') && (
                        <span className="badge badge-amber">New</span>
                      )}
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {customer.jobs.map((job) => (
                          <div key={job.id} className="job-item" style={{ padding: '20px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                            <div className={`job-file-icon ${isImage(job.mimeType) ? 'image' : 'pdf'}`} style={{ width: 48, height: 48, borderRadius: 12 }}>
                              {isImage(job.mimeType)
                                ? <ImageIcon size={24} />
                                : <FileText size={24} />
                              }
                            </div>
                            <div className="job-info" style={{ flex: 1, marginLeft: 16 }}>
                              <div className="job-name" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{job.originalName}</div>
                              <div className="job-meta" style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                <span>{formatTime(job.sentAt)}</span>
                                <span>{formatSize(job.fileSize)}</span>
                                <span style={{ color: '#ea580c', fontWeight: 600 }}>
                                  ⏱ Expires {formatTime(job.expiresAt)}
                                </span>
                              </div>
                            </div>
                            <div className="job-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span className={`badge ${statusColors[job.status] || 'badge-blue'}`} style={{ padding: '6px 12px', fontSize: 13 }}>
                                {statusLabels[job.status] || job.status}
                              </span>
                              {job.status !== 'deleted' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => setViewer({ jobId: job.id, fileName: job.originalName, mimeType: job.mimeType })}
                                  id={`view-job-${job.id}`}
                                >
                                  <Eye size={16} /> View
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="alert alert-info" style={{ marginTop: 32 }}>
          <ShieldCheck size={20} />
          <div>Files are only visible in the secure viewer. Downloading and saving are restricted. Auto-refresh every 30 seconds.</div>
        </div>
      </motion.div>


      {viewer && (
        <SecureViewer
          jobId={viewer.jobId}
          fileName={viewer.fileName}
          mimeType={viewer.mimeType}
          onClose={() => setViewer(null)}
          onPrint={handlePrint}
        />
      )}


      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay" 
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal glass" 
              onClick={e => e.stopPropagation()} 
              style={{ maxWidth: 440, background: 'var(--bg-card-solid)' }}
            >
              <div className="modal-header">
                <span className="modal-title">Share Shop Profile</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(false)} style={{ padding: 8 }}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div ref={qrRef} className="qr-container-export" style={{ background: 'white', padding: 32, borderRadius: 24, border: '1px solid var(--border)', display: 'inline-block', boxShadow: 'var(--shadow-md)' }}>
                  <QRCodeCanvas 
                    value={`${window.location.origin}/customer/printer/${user?.publicId}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  <div style={{ marginTop: 24, fontWeight: 800, fontSize: 24, color: 'var(--text-primary)', letterSpacing: 1 }}>{user?.publicId}</div>
                  <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>{user?.printerName || user?.name}</div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button className="btn btn-secondary" onClick={() => handleDownloadQR('png')}>
                  <Download size={18} /> PNG
                </button>
                <button className="btn btn-secondary" onClick={() => handleDownloadQR('jpg')}>
                  <Download size={18} /> JPG
                </button>
                <button className="btn btn-primary" onClick={handlePrintQR} style={{ gridColumn: 'span 2' }}>
                  <PrinterIcon size={18} /> Print Poster
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrinterDashboard;
