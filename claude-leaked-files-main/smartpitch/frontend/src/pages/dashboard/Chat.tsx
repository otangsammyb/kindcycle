import React, { useState } from 'react';
import DashboardLayout from './Layout';
import { GithubIcon, ArtificialIntelligence04Icon, FileDownloadIcon } from 'hugeicons-react';
import { useAuthStore } from '../../store/authStore';

const Chat: React.FC = () => {
  const { user } = useAuthStore();
  const [repoUrl, setRepoUrl] = useState('');
  const [mode, setMode] = useState<'standard' | 'red_team'>('standard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [streamData, setStreamData] = useState<{
    status: string;
    text: string;
    result: any;
    analysisId?: string;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!repoUrl) return;
    setIsAnalyzing(true);
    setStreamData({ status: 'Connecting...', text: '', result: null });
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ repoUrl, mode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Analysis failed. Check your plan quota.');
      }

      if (!response.body) throw new Error("ReadableStream not supported by browser.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const messages = chunk.split('\n\n');
          
          for (let msg of messages) {
            if (msg.startsWith('data: ')) {
              try {
                const data = JSON.parse(msg.replace('data: ', ''));

                if (data.event === 'started') {
                  setStreamData(prev => ({
                    ...prev!,
                    analysisId: data.analysisId
                  }));
                } else if (data.event === 'error') {
                  setStreamData(prev => ({ ...prev!, status: 'Error', text: prev!.text + '\n\nERROR: ' + data.message }));
                  setIsAnalyzing(false);
                  return;
                }
                
                if (data.event === 'chunk') {
                  const cleanText = (data.text || '').replace(/\*\*/g, '');
                  setStreamData(prev => ({
                    ...prev!,
                    text: prev!.text + cleanText
                  }));
                } else if (data.event === 'completed') {
                  setStreamData(prev => ({
                    ...prev!,
                    status: 'Completed',
                    text: prev!.text + '\n\n✅ Analysis Fully Generated!',
                    result: data.data
                  }));
                  setIsAnalyzing(false);
                  return;
                }
              } catch(e) {
                console.error("[SSE_PARSE_ERROR]", e);
              }
            }
          }
        }
      }
      setIsAnalyzing(false);
    } catch (err: any) {
      setStreamData(prev => ({
        status: 'Error',
        text: (prev?.text || '') + '\n\n' + (err.message || 'Failed to start analysis.'),
        result: null,
        analysisId: prev?.analysisId
      }));
      setIsAnalyzing(false);
    }
  };

  const handleExport = async (type: 'pdf' | 'pptx') => {
    if (!streamData?.analysisId) {
      alert("Analysis ID missing. Please refresh and try again.");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          analysisId: streamData.analysisId,
          type,
          style: 'startup'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Export request failed');
      }

      const resData = await response.json();
      
      // Trigger download using a secure host-relative path
      const host = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
      const downloadLink = `${host}${resData.data.downloadUrl}?token=${token}`;
      
      console.log("[EXPORT] Opening download link:", downloadLink);
      window.open(downloadLink, '_blank');
    } catch (err: any) {
      console.error("[EXPORT_ERROR]", err);
      alert(err.message || 'Export failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>Pitch Generator</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 40 }}>Paste any public GitHub repository to extract an investor-ready pitch.</p>

        {/* Input Card */}
        <div className="glass-panel" style={{ padding: 30, marginBottom: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--color-text-muted)' }}>GitHub Repository URL</label>
              <div style={{ position: 'relative' }}>
                <GithubIcon size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="url" 
                  placeholder="https://github.com/username/repo" 
                  style={{ paddingLeft: 46, fontSize: '1.1rem', paddingBlock: 16 }} 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div 
                style={{ flex: 1, padding: 15, borderRadius: 8, border: mode === 'standard' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: mode === 'standard' ? '#E8F0FE' : '#fff', cursor: isAnalyzing ? 'default' : 'pointer' }}
                onClick={() => !isAnalyzing && setMode('standard')}
              >
                <h4 style={{ color: mode === 'standard' ? 'var(--color-primary)' : 'var(--color-text)', marginBottom: 5 }}>Standard Pitch</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Typical startup narrative deck.</p>
              </div>

              <div 
                style={{ flex: 1, padding: 15, borderRadius: 8, border: mode === 'red_team' ? '1px solid #D93025' : '1px solid var(--color-border)', background: mode === 'red_team' ? '#FCE8E6' : '#fff', cursor: isAnalyzing ? 'default' : 'pointer'}}
                onClick={() => !isAnalyzing && setMode('red_team')}
              >
                <h4 style={{ color: mode === 'red_team' ? '#D93025' : 'var(--color-text)', marginBottom: 5 }}>Red Team Challenge (PRO)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Aggressive investor questions.</p>
              </div>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: 16, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: isAnalyzing || !repoUrl ? 0.7 : 1 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !repoUrl}
            >
              <ArtificialIntelligence04Icon size={24} />
              {isAnalyzing ? 'Analyzing Repository...' : 'Generate Pitch Deck'}
            </button>
          </div>
        </div>

        {/* Streaming / Result Output */}
        {streamData && (
          <div className="glass-panel" style={{ padding: 30, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: '1.1rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: streamData.status === 'Completed' ? 'var(--color-success)' : 'var(--color-primary)' }} />
              {streamData.status}
            </h3>
            
            <div style={{ flex: 1, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, padding: 24, overflowY: 'auto', fontFamily: 'var(--font-body)', color: 'var(--color-text)', lineHeight: 1.8, fontSize: '1rem' }}>
              {streamData.text}
              {isAnalyzing && <span style={{ display: 'inline-block', width: 2, height: 16, background: 'var(--color-primary)', marginLeft: 5, animation: 'pulse 1s infinite' }} />}
            </div>

            {streamData.status === 'Completed' && streamData.result && (
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                {user?.plan !== 'hacker' && (
                  <button className="btn-primary" onClick={() => handleExport('pptx')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <FileDownloadIcon size={20} /> Export PPTX
                  </button>
                )}
                <button className="btn-secondary" onClick={() => handleExport('pdf')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <FileDownloadIcon size={20} /> Export PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Chat;
