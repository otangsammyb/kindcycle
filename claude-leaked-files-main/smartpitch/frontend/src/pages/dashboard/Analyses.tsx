import React, { useState } from 'react';
import DashboardLayout from './Layout';
import { Presentation02Icon, FileDownloadIcon, Delete02Icon, GithubIcon } from 'hugeicons-react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const Analyses: React.FC = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await api.get('/analysis');
        setAnalyses(res.data.data.analyses);
      } catch (err) {
        console.error('Error fetching analyses', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalyses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pitch deck?')) return;
    try {
      await api.delete(`/analysis/${id}`);
      setAnalyses(analyses.filter(a => a._id !== id));
    } catch (err) {
      console.error('Error deleting analysis', err);
      alert('Failed to delete analysis.');
    }
  };

  const handleDownload = (id: string, type: string) => {
    window.open(`${import.meta.env.VITE_API_URL}/export/${type}?analysisId=${id}`, '_blank');
  };

  if (isLoading) return <div style={{ padding: 40 }}>Loading your pitch decks...</div>;

  return (
    <DashboardLayout>
      <div style={{ padding: 40, maxWidth: 1000, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>My Pitch Decks</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 40 }}>Your generated intelligence and investor reports.</p>

        <div style={{ display: 'grid', gap: 20 }}>
          {analyses.map(analysis => (
            <div key={analysis._id} className="glass-panel" style={{ padding: 25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)' }}>
                  <Presentation02Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                    {analysis.repoName}
                  </h3>
                  <div style={{ display: 'flex', gap: 15, fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><GithubIcon size={14}/> {analysis.projectType || 'Project'}</span>
                    <span>Mode: <strong style={{ color: analysis.mode === 'red_team' ? '#EF4444' : 'inherit', textTransform: 'capitalize' }}>{analysis.mode.replace('_', ' ')}</strong></span>
                    <span>Created: {new Date(analysis.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
                {analysis.result?.score && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>{analysis.result.score.overall}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Score</div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: 5, alignItems: 'center' }} onClick={() => handleDownload(analysis._id, 'pdf')}>
                    <FileDownloadIcon size={16} /> PDF
                  </button>
                  <button className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: 5, alignItems: 'center' }} onClick={() => handleDownload(analysis._id, 'pptx')}>
                    <FileDownloadIcon size={16} /> PPTX
                  </button>
                  <button className="btn-secondary" style={{ padding: '8px', color: 'var(--color-error)' }} title="Delete" onClick={() => handleDelete(analysis._id)}>
                    <Delete02Icon size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analyses;
