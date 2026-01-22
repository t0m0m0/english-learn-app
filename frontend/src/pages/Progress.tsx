import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { progressApi } from '../services/api';
import { Statistics, DailyStats } from '../types';
import ProgressBar from '../components/ProgressBar';
import './Progress.css';

export function Progress() {
  const { user } = useUser();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [progressData, statsData] = await Promise.all([
          progressApi.getUserProgress(user.id),
          progressApi.getStats(user.id),
        ]);

        setStatistics(progressData.statistics);
        setDailyStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <div className="progress-page">
        <div className="login-prompt">
          <h2>Track Your Progress</h2>
          <p>Login to see your learning statistics and track your journey.</p>
          <a href="/login" className="login-button">
            Login to Continue
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="progress-page">
        <div className="loading">Loading your progress...</div>
      </div>
    );
  }

  const getLevelLabel = (level: number): string => {
    const labels: { [key: number]: string } = {
      0: 'New',
      1: 'Learning',
      2: 'Familiar',
      3: 'Good',
      4: 'Strong',
      5: 'Mastered',
    };
    return labels[level] || 'Unknown';
  };

  return (
    <div className="progress-page">
      <header className="progress-header">
        <h1>Your Progress</h1>
        <p>Welcome back, {user.name}!</p>
      </header>

      <section className="overview-section">
        <div className="overview-cards">
          <div className="overview-card">
            <span className="card-value">{dailyStats?.todayReviews || 0}</span>
            <span className="card-label">Words Today</span>
          </div>
          <div className="overview-card">
            <span className="card-value">{statistics?.learnedWords || 0}</span>
            <span className="card-label">Words Learned</span>
          </div>
          <div className="overview-card">
            <span className="card-value">{statistics?.masteredWords || 0}</span>
            <span className="card-label">Words Mastered</span>
          </div>
          <div className="overview-card">
            <span className="card-value">
              {dailyStats?.averageLevel?.toFixed(1) || '0.0'}
            </span>
            <span className="card-label">Average Level</span>
          </div>
        </div>
      </section>

      <section className="progress-section">
        <h2>Overall Progress</h2>

        <div className="milestone-progress">
          <h3>Milestones</h3>

          <div className="milestone">
            <div className="milestone-header">
              <span className="milestone-title">First 1,000 Words</span>
              <span className="milestone-description">
                Covers 85% of daily conversation
              </span>
            </div>
            <ProgressBar
              current={Math.min(statistics?.learnedWords || 0, 1000)}
              total={1000}
              color="blue"
            />
          </div>

          <div className="milestone">
            <div className="milestone-header">
              <span className="milestone-title">Full 3,000 Words</span>
              <span className="milestone-description">
                Covers 98% of daily conversation
              </span>
            </div>
            <ProgressBar
              current={statistics?.learnedWords || 0}
              total={statistics?.totalWords || 3000}
              color="purple"
            />
          </div>

          <div className="milestone">
            <div className="milestone-header">
              <span className="milestone-title">Mastery</span>
              <span className="milestone-description">
                Words at level 4 or higher
              </span>
            </div>
            <ProgressBar
              current={statistics?.masteredWords || 0}
              total={statistics?.totalWords || 3000}
              color="green"
            />
          </div>
        </div>
      </section>

      <section className="distribution-section">
        <h2>Learning Distribution</h2>
        <div className="level-bars">
          {dailyStats?.levelDistribution?.map((item) => {
            const maxCount = Math.max(
              ...dailyStats.levelDistribution.map((d) => d._count)
            );
            const width = (item._count / maxCount) * 100;

            return (
              <div key={item.level} className="level-bar-item">
                <span className="level-label">{getLevelLabel(item.level)}</span>
                <div className="level-bar">
                  <div
                    className={`level-bar-fill level-${item.level}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="level-count">{item._count}</span>
              </div>
            );
          })}

          {(!dailyStats?.levelDistribution ||
            dailyStats.levelDistribution.length === 0) && (
            <p className="empty-distribution">
              Start learning to see your distribution!
            </p>
          )}
        </div>
      </section>

      <section className="tips-section">
        <h2>Tips for Success</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🎯</span>
            <h3>Focus on Core Words</h3>
            <p>Master the top 1,000 words first. They cover 85% of conversations.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔁</span>
            <h3>Review Regularly</h3>
            <p>Spaced repetition helps move words to long-term memory.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🖼️</span>
            <h3>Think in Images</h3>
            <p>Connect words directly to images, not translations.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🎧</span>
            <h3>Listen Often</h3>
            <p>Use Brain Soaking mode to immerse yourself in English sounds.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Progress;
