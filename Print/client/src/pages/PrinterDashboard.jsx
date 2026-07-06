import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Eye, FileText, Image, Clock, Users, CheckCircle, AlertCircle, QrCode, Download, Printer as PrinterIcon, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import SecureViewer from '../components/SecureViewer';

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
  const [viewer, setViewer] = useState(null); // { jobId, fileName, mimeType }
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
    // Auto-refresh every 30 seconds
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
      // Update local state
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

  // Stats
  const totalJobs = customers.reduce((s, c) => s + c.jobCount, 0);
  const pending = customers.reduce((s, c) => s + c.jobs.filter(j => j.status === 'pending').length, 0);
  const done = customers.reduce((s, c) => s + c.jobs.filter(j => j.status === 'completed').length, 0);

  const isImage = (mime) => mime?.startsWith('image/');

  return (
    <div className="app-container">
      <Navbar />
      <div className="page">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 className="page-title">{user?.printerName || user?.name}</h1>
            <p className="page-subtitle">Shop ID: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{user?.publicId}</span></p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(true)}>
              <QrCode size={14} /> Shop QR
            </button>
            <button className="btn btn-primary btn-sm" onClick={fetchDashboard}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="card stat-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20}/></div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 700 }}>{customers.length}</div>
               <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active Clients</div>
             </div>
          </div>
          <div className="card stat-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, background: '#fff7ed', color: '#ea580c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={20}/></div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 700 }}>{pending}</div>
               <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending Jobs</div>
             </div>
          </div>
          <div className="card stat-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, background: '#f0fdf4', color: '#16a34a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={20}/></div>
             <div>
               <div style={{ fontSize: 20, fontWeight: 700 }}>{done}</div>
               <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Printed Today</div>
             </div>
          </div>
        </div>

        {/* Job List */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No incoming jobs</div>
            <div className="empty-state-desc">
              Share your Printer ID <strong>{user?.publicId}</strong> with customers to receive print jobs
            </div>
          </div>
        ) : (
          <div className="job-list">
            {customers.map((customer) => {
              const isOpen = expanded.has(customer.customerPublicId);
              return (
                <div key={customer.customerPublicId} className="customer-row">
                  {/* Customer Header Row */}
                  <div
                    className="customer-row-header"
                    onClick={() => toggleExpand(customer.customerPublicId)}
                    id={`customer-row-${customer.customerPublicId}`}
                  >
                    <div className="customer-avatar">
                      {customer.customerPublicId.charAt(0)}
                    </div>
                    <div className="customer-info">
                      <div className="customer-id">
                        👤 {customer.customerPublicId} 
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 400 }}>
                          ({customer.customerName})
                        </span>
                      </div>
                      <div className="customer-meta">
                        {customer.jobCount} file{customer.jobCount !== 1 ? 's' : ''} &nbsp;·&nbsp;
                        <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        &nbsp;{formatTime(customer.latestSentAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {customer.jobs.some(j => j.status === 'pending') && (
                        <span className="badge badge-amber">New</span>
                      )}
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: Jobs for this customer */}
                  {isOpen && (
                    <div className="customer-jobs-expanded">
                      {customer.jobs.map((job) => (
                        <div key={job.id} className="job-item">
                          {/* File type icon */}
                          <div className={`job-file-icon ${isImage(job.mimeType) ? 'image' : 'pdf'}`}>
                            {isImage(job.mimeType)
                              ? <Image size={17} style={{ color: 'var(--accent-cyan)' }} />
                              : <FileText size={17} style={{ color: 'var(--accent-red)' }} />
                            }
                          </div>

                          {/* File info */}
                          <div className="job-info">
                            <div className="job-name">{job.originalName}</div>
                            <div className="job-meta" style={{ display: 'flex', gap: 10 }}>
                              <span>{formatTime(job.sentAt)}</span>
                              <span>{formatSize(job.fileSize)}</span>
                              <span style={{ color: 'var(--accent-amber)' }}>
                                ⏱ Expires {formatTime(job.expiresAt)}
                              </span>
                            </div>
                          </div>

                          {/* Status + Actions */}
                          <div className="job-actions">
                            <span className={`badge ${statusColors[job.status] || 'badge-blue'}`}>
                              {statusLabels[job.status] || job.status}
                            </span>

                            {job.status !== 'deleted' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setViewer({ jobId: job.id, fileName: job.originalName, mimeType: job.mimeType })}
                                id={`view-job-${job.id}`}
                                title="View file securely"
                              >
                                <Eye size={13} /> View
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="alert alert-info" style={{ marginTop: 24 }}>
          🔒 Files are only visible in the secure viewer. Downloading and saving are not possible.
          Auto-refresh every 30 seconds.
        </div>
      </div>

      {/* Secure Viewer Modal */}
      {viewer && (
        <SecureViewer
          jobId={viewer.jobId}
          fileName={viewer.fileName}
          mimeType={viewer.mimeType}
          onClose={() => setViewer(null)}
          onPrint={handlePrint}
        />
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Share Shop Profile</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div ref={qrRef} className="qr-container-export" style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)', display: 'inline-block' }}>
                <QRCodeCanvas 
                  value={`${window.location.origin}/customer/printer/${user?.publicId}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18, color: '#000' }}>{user?.publicId}</div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadQR('png')}>
                <Download size={14} /> PNG
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadQR('jpg')}>
                <Download size={14} /> JPG
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePrintQR} style={{ gridColumn: 'span 2' }}>
                <PrinterIcon size={14} /> Print PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterDashboard;
