import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Send, ArrowLeft, MapPin, Printer as PrinterIcon, X, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PrinterProfile = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [printer, setPrinter] = useState(null);
  const [printerLoading, setPrinterLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get(`/printers/${publicId}`)
      .then(({ data }) => setPrinter(data.printer))
      .catch(() => { addToast('Printer not found.', 'error'); navigate('/customer/search'); })
      .finally(() => setPrinterLoading(false));
  }, [publicId]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(f.type)) {
      addToast('Only PDF and image files are allowed.', 'error');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      addToast('File must be under 20MB.', 'error');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const handleSend = async () => {
    if (!file) { addToast('Please select a file first.', 'error'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('printerPublicId', publicId);
      await api.post('/jobs/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('File sent securely! 🎉', 'success');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send file.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const isImage = file?.type?.startsWith('image/');

  if (printerLoading) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="loading-center" style={{ flex: 1 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!printer) return null;

  return (
    <div className="app-container">
      <Navbar />
      <motion.div 
        className="page page-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/customer/search')}
          style={{ marginBottom: 24, borderRadius: 'var(--radius-lg)' }}
        >
          <ArrowLeft size={16} /> Back to Search
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card glass" 
          style={{ padding: '32px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 24, borderRadius: 'var(--radius-xl)' }}
        >
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--accent-primary) 0%, #818cf8 100%)', color: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(79,70,229,0.3)' }}>
             <PrinterIcon size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {printer.printerName || printer.name}
              </h1>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{display:'inline-block',width:6,height:6,background:'#16a34a',borderRadius:'50%'}}></span> Active</span>
            </div>
            <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
               <span style={{ fontWeight: 600 }}>ID: {printer.publicId}</span>
               {printer.location && (
                 <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {printer.location}</span>
               )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-blue" style={{ background: '#e0e7ff', color: '#3730a3' }}>Verified Shop</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card glass" 
          style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', padding: 8, borderRadius: 10 }}>
               <Upload size={20} />
            </div>
            Send a Document
          </h2>

          <div
            className={`upload-zone ${dragover ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            id="upload-dropzone"
            style={{ marginBottom: 24 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input"
            />
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>{dragover ? '📂' : '📁'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {dragover ? 'Drop to upload' : 'Click or drag & drop your file'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>PDF, JPG, PNG, GIF, WebP • Max 20MB</div>
          </div>

          {file && (
            <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}
            >
              <div style={{ fontSize: 32, background: 'var(--bg-secondary)', padding: 12, borderRadius: 12 }}>{isImage ? '🖼️' : '📄'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {formatSize(file.size)} • {file.type}
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: 8, color: 'var(--accent-danger)' }}
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                id="remove-file-btn"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}

          <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12 }}>
            <ShieldCheck size={24} style={{ color: '#1e40af', flexShrink: 0 }} />
            <div style={{ fontSize: 14, color: '#1e40af' }}>Files are AES-256 encrypted before sending. Auto-deleted after 24 hours.</div>
          </div>

          <button
            id="send-file-btn"
            className="btn btn-primary btn-lg"
            onClick={handleSend}
            disabled={!file || uploading}
            style={{ width: '100%', marginTop: 24, height: 56, fontSize: 16 }}
          >
            {uploading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 3, borderTopColor: 'white' }} />
                Encrypting & Sending…
              </>
            ) : (
              <>
                <Send size={20} /> Send Securely to {printer.printerName || printer.name}
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PrinterProfile;
