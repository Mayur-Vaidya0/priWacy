import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Send, ArrowLeft, MapPin, Printer, X, FileText, Image } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';

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
      <div className="page page-md">
        {/* Back */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/customer/search')}
          style={{ marginBottom: 20, paddingLeft: 0 }}
        >
          <ArrowLeft size={15} /> Back to Search
        </button>

        {/* Printer Profile Header */}
        <div className="printer-profile-header">
          <div className="printer-profile-avatar">🖨️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="printer-profile-name">
                {printer.printerName || printer.name}
              </h1>
              <span className="badge badge-violet">🟢 Active</span>
            </div>
            <div className="printer-profile-id">Printer ID: {printer.publicId}</div>
            {printer.location && (
              <div className="printer-profile-location">
                <MapPin size={13} /> {printer.location}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className="badge badge-blue">Verified Printer</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={17} style={{ color: 'var(--accent-blue)' }} />
            Send a Document
          </h2>

          <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            id="upload-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-input"
            />
            <div className="upload-icon">{dragover ? '📂' : '📁'}</div>
            <div className="upload-text">
              {dragover ? 'Drop to upload' : 'Click or drag & drop your file'}
            </div>
            <div className="upload-hint">PDF, JPG, PNG, GIF, WebP • Max 20MB</div>
          </div>

          {file && (
            <div className="upload-preview">
              <div style={{ fontSize: 24 }}>{isImage ? '🖼️' : '📄'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="upload-preview-name">{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {formatSize(file.size)} • {file.type}
                </div>
              </div>
              <span className="upload-preview-size">{formatSize(file.size)}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                id="remove-file-btn"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Security notice */}
          <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
            🔒 Files are AES-256 encrypted before sending. Auto-deleted after 24 hours.
          </div>

          <button
            id="send-file-btn"
            className="btn btn-primary btn-lg"
            onClick={handleSend}
            disabled={!file || uploading}
            style={{ width: '100%', marginTop: 16 }}
          >
            {uploading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Encrypting & Sending…
              </>
            ) : (
              <>
                <Send size={16} /> Send Securely to {printer.printerName || printer.name}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrinterProfile;
