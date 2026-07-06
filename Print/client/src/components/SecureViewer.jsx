import { useState, useEffect, useRef } from 'react';
import { X, Printer, Shield, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

const SecureViewer = ({ jobId, fileName, mimeType, onClose, onPrint }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blobUrl, setBlobUrl] = useState(null);
  const [isObscured, setIsObscured] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    let url = null;
    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('ps_token');
        const res = await fetch(`http://localhost:5000/api/jobs/view/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.message || 'File not available.');
          return;
        }
        const data = await res.json();
        const binaryString = window.atob(data.fileBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || mimeType });
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch {
        setError('Could not load file. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchFile();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [jobId]);


  useEffect(() => {
    const handleBlur = () => setIsObscured(true);
    
    const handleKeyDown = (e) => {
      if (['Meta', 'Shift', 'PrintScreen', 'Control', 'Alt', 'F12'].includes(e.key)) {
        setIsObscured(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('Screenshots are disabled for secure documents.').catch(() => {});
        addToast('Screenshots are blocked for security.', 'error');
        setIsObscured(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [addToast]);


  useEffect(() => {
    const blockSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' && false)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', blockSave);
    return () => window.removeEventListener('keydown', blockSave);
  }, []);

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
    onPrint(jobId);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onContextMenu={(e) => e.preventDefault()}>

        <div className="modal-header">
           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={18} style={{ color: 'var(--accent-primary)' }} />
              <span className="modal-title">{fileName}</span>
           </div>
           <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ padding: '10px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Confidentially viewing secure document. Saving is disabled.</span>
        </div>


        <div className="modal-body">
          {loading && (
            <div className="loading-center" style={{ position: 'absolute', inset: 0 }}>
              <div>
                <div className="spinner" />
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Decrypting file…
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="loading-center" style={{ position: 'absolute', inset: 0, padding: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <AlertTriangle size={40} style={{ color: 'var(--accent-red)', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, marginBottom: 6 }}>File Not Available</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{error}</div>
              </div>
            </div>
          )}

          {blobUrl && !error && (
            <div className="viewer-container" style={{ 
              height: '70vh', width: '100%', overflow: 'hidden', position: 'relative',
              filter: isObscured ? 'blur(15px)' : 'none',
              opacity: isObscured ? 0.1 : 1,
              transition: 'all 0.1s ease'
            }}>
              <div className="secure-watermark">PRINT ONLY</div>
              {mimeType === 'application/pdf' ? (
                <iframe
                  ref={iframeRef}
                  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="secure-viewer-frame"
                  title="Secure Document Viewer"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'auto' }}>
                  <img
                    src={blobUrl}
                    alt="Document"
                    style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', borderRadius: 'var(--radius-sm)', userSelect: 'none', pointerEvents: 'none' }}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              )}
            </div>
          )}
        </div>


        {blobUrl && !error && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10
          }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ color: 'var(--accent-primary)', border: '1px solid var(--border)', userSelect: 'none' }}
              onMouseDown={() => setIsObscured(false)}
              onMouseUp={() => setIsObscured(true)}
              onMouseLeave={() => setIsObscured(true)}
              onTouchStart={() => setIsObscured(false)}
              onTouchEnd={() => setIsObscured(true)}
            >
              <Shield size={15} style={{ marginRight: 6 }} /> Hold to Reveal
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
            <button
              id="print-job-btn"
              className="btn btn-primary btn-md"
              onClick={handlePrint}
            >
              <Printer size={15} /> Print Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureViewer;
