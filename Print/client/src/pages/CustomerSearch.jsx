import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Printer as PrinterIcon, Clock, QrCode, Upload, X } from 'lucide-react';
import jsQR from 'jsqr';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';

const CustomerSearch = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleQRUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          try {
            // Check if it's our URL format
            const url = new URL(code.data);
            const pid = url.pathname.split('/').pop();
            if (pid && pid.length >= 6) {
              addToast('Printer detected! 🖨️', 'success');
              navigate(`/customer/printer/${pid}`);
            } else {
              addToast('QR code is not a valid Printer ID.', 'error');
            }
          } catch {
            // If not a URL, maybe it's just the PID text
            if (code.data.length >= 6 && code.data.length <= 10) {
              addToast('Printer ID detected!', 'success');
              navigate(`/customer/printer/${code.data}`);
            } else {
              addToast('Could not find Printer ID in QR code.', 'error');
            }
          }
        } else {
          addToast('No QR code found in this image.', 'error');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/printers/search?q=${encodeURIComponent(query)}`);
        setResults(data.printers || []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (printer) => {
    setShowResults(false);
    setQuery('');
    navigate(`/customer/printer/${printer.publicId}`);
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="page page-md">
        <div style={{ marginBottom: 32 }}>
           <h1 className="page-title">Find a Printer</h1>
           <p className="page-subtitle">Enter a Shop ID to securely send your documents</p>
        </div>

        {/* Search box */}
        <div className="search-container" ref={wrapperRef} style={{ marginBottom: 40 }}>
          <div className="search-input-wrapper" style={{ padding: '4px 12px' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              id="printer-search-input"
              className="search-input"
              type="text"
              placeholder="Enter Shop ID (e.g. A3F1B2)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              autoComplete="off"
              style={{ fontSize: 16 }}
            />
            {loading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 10 }} />}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQRUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => fileInputRef.current?.click()}
              title="Upload QR Code"
              style={{ color: 'var(--accent-primary)' }}
            >
              <QrCode size={20} />
            </button>
          </div>

          {showResults && (
            <div className="search-results">
              {results.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No shops found for "<strong>{query}</strong>"
                </div>
              ) : (
                results.map((printer) => (
                  <div
                    key={printer._id}
                    className="search-result-item"
                    id={`search-result-${printer.publicId}`}
                    onClick={() => handleSelect(printer)}
                  >
                    <div className="customer-avatar" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}>
                       <PrinterIcon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {printer.printerName || printer.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        ID: {printer.publicId} {printer.location && `• ${printer.location}`}
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm">Select</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ padding: 24, background: 'white', border: '1px solid var(--border)', borderRadius: 8 }}>
           <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>How it works</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              <div style={{ fontSize: 13 }}>
                 <div style={{ fontWeight: 600, marginBottom: 4 }}>1. Find Shop</div>
                 <p style={{ color: 'var(--text-secondary)' }}>Search by ID or scan their QR code.</p>
              </div>
              <div style={{ fontSize: 13 }}>
                 <div style={{ fontWeight: 600, marginBottom: 4 }}>2. Send Files</div>
                 <p style={{ color: 'var(--text-secondary)' }}>Upload PDFs or images securely.</p>
              </div>
              <div style={{ fontSize: 13 }}>
                 <div style={{ fontWeight: 600, marginBottom: 4 }}>3. Print & Go</div>
                 <p style={{ color: 'var(--text-secondary)' }}>Collect your prints at the shop.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSearch;
