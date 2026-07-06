import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer as PrinterIcon, QrCode, ArrowRight } from 'lucide-react';
import jsQR from 'jsqr';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

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
            const url = new URL(code.data);
            const pid = url.pathname.split('/').pop();
            if (pid && pid.length >= 6) {
              addToast('Printer detected! 🖨️', 'success');
              navigate(`/customer/printer/${pid}`);
            } else {
              addToast('QR code is not a valid Printer ID.', 'error');
            }
          } catch {
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

  const steps = [
    { title: '1. Find Shop', desc: 'Search by ID or scan their QR code.', icon: '🔍' },
    { title: '2. Send Files', desc: 'Upload PDFs or images securely.', icon: '📤' },
    { title: '3. Print & Go', desc: 'Collect your prints at the shop.', icon: '🏃' }
  ];

  return (
    <div className="app-container">
      <Navbar />
      <motion.div 
        className="page page-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }} 
             transition={{ delay: 0.2 }}
             style={{ display: 'inline-flex', padding: '16px', background: 'var(--bg-card)', borderRadius: '50%', marginBottom: 24, boxShadow: 'var(--shadow-md)' }}
           >
             <Search size={40} color="var(--accent-primary)" />
           </motion.div>
           <h1 className="page-title">Find a Printer</h1>
           <p className="page-subtitle" style={{ fontSize: '1.1rem' }}>Enter a Shop ID to securely send your documents</p>
        </div>


        <div className="search-container" ref={wrapperRef} style={{ marginBottom: 60, maxWidth: 600, margin: '0 auto 60px' }}>
          <div className="search-input-wrapper" style={{ padding: '8px 16px', borderRadius: 'var(--radius-xl)' }}>
            <Search size={24} style={{ color: 'var(--text-muted)' }} />
            <input
              id="printer-search-input"
              className="search-input"
              type="text"
              placeholder="Enter Shop ID (e.g. A3F1B2)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              autoComplete="off"
              style={{ fontSize: 18 }}
            />
            {loading && <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3, marginRight: 16 }} />}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQRUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="btn btn-ghost" 
              style={{ padding: 12, borderRadius: 'var(--radius-lg)' }}
              onClick={() => fileInputRef.current?.click()}
              title="Upload QR Code"
            >
              <QrCode size={24} color="var(--accent-primary)" />
            </button>
          </div>

          <AnimatePresence>
            {showResults && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="search-results"
                style={{ borderRadius: 'var(--radius-lg)', marginTop: 12 }}
              >
                {results.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No shops found for "<strong>{query}</strong>"
                  </div>
                ) : (
                  results.map((printer, index) => (
                    <motion.div
                      key={printer._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="search-result-item"
                      id={`search-result-${printer.publicId}`}
                      onClick={() => handleSelect(printer)}
                      style={{ padding: '20px 24px' }}
                    >
                      <div className="customer-avatar" style={{ background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', width: 48, height: 48, borderRadius: 16 }}>
                         <PrinterIcon size={24} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                          {printer.printerName || printer.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                          <span className="badge badge-gray">ID: {printer.publicId}</span> {printer.location && `• ${printer.location}`}
                        </div>
                      </div>
                      <ArrowRight size={20} color="var(--text-muted)" />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card glass" 
          style={{ padding: 32, borderRadius: 'var(--radius-xl)' }}
        >
           <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>How PrintShield Works</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ textAlign: 'center', padding: 24, background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-lg)' }}>
                   <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{step.icon}</div>
                   <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>{step.title}</div>
                   <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{step.desc}</p>
                </div>
              ))}
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CustomerSearch;
