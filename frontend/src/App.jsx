import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('CHECKING');
  const [backendMsg, setBackendMsg] = useState('Initializing health check...');
  const [dbStatus, setDbStatus] = useState('CHECKING');
  const [dbMsg, setDbMsg] = useState('Initializing database connection check...');

  const runDiagnostics = async () => {
    setBackendStatus('CHECKING');
    setBackendMsg('Pinging backend server...');
    setDbStatus('CHECKING');
    setDbMsg('Pinging MySQL database...');

    // 1. Check Backend Health
    try {
      const response = await axios.get(`${API_URL}/api/health`);
      if (response.data.status === 'UP') {
        setBackendStatus('UP');
        setBackendMsg(response.data.message || 'Server is responsive.');
      } else {
        setBackendStatus('DOWN');
        setBackendMsg('Backend returned non-UP status.');
      }
    } catch (err) {
      setBackendStatus('DOWN');
      setBackendMsg(
        err.response?.data?.message || err.message || 'Cannot reach the backend server. Is it running?'
      );
    }

    // 2. Check Database Health
    try {
      const response = await axios.get(`${API_URL}/api/health/db`);
      if (response.data.status === 'UP') {
        setDbStatus('UP');
        setDbMsg(response.data.message || 'Connected to MySQL successfully.');
      } else {
        setDbStatus('DOWN');
        setDbMsg(response.data.message || 'Database ping returned non-UP status.');
      }
    } catch (err) {
      setDbStatus('DOWN');
      setDbMsg(
        err.response?.data?.message || err.message || 'Failed to establish connection to database via backend.'
      );
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <main style={{ position: 'relative', width: '100%' }}>
      <div className="glow-spot-1"></div>
      <div className="glow-spot-2"></div>
      
      <div className="glass-panel" style={{ margin: '2rem auto' }}>
        <h1>ForgeAI Platform</h1>
        <p className="subtitle">Phase 1A Diagnostics & Core Connectivity</p>

        <div className="status-list">
          {/* Backend Status */}
          <div className="status-item">
            <div className="status-label">
              <span className="status-title">Backend API Connection</span>
              <span className="status-desc">{backendMsg}</span>
            </div>
            <span className={`status-badge ${backendStatus.toLowerCase()}`}>
              {backendStatus}
            </span>
          </div>

          {/* Database Status */}
          <div className="status-item">
            <div className="status-label">
              <span className="status-title">MySQL Database Connection</span>
              <span className="status-desc">{dbMsg}</span>
            </div>
            <span className={`status-badge ${dbStatus.toLowerCase()}`}>
              {dbStatus}
            </span>
          </div>
        </div>

        <button className="btn" onClick={runDiagnostics} disabled={backendStatus === 'CHECKING' || dbStatus === 'CHECKING'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Run Diagnostics Check
        </button>
      </div>
    </main>
  );
}
