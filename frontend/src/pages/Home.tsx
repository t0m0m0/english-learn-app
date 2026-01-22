import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Home.css';

export function Home() {
  const { user } = useUser();

  return (
    <div className="home">
      <header className="home-header">
        <h1>Learn English the Natural Way</h1>
        <p className="subtitle">
          Based on Chris Lonsdale's proven principles for language acquisition
        </p>
      </header>

      <section className="principles-section">
        <h2>Key Principles</h2>
        <div className="principles-grid">
          <div className="principle-card">
            <span className="principle-number">1</span>
            <h3>Focus on the Core</h3>
            <p>
              Master the 3,000 most common words. This covers 98% of daily
              conversation.
            </p>
          </div>
          <div className="principle-card">
            <span className="principle-number">2</span>
            <h3>Direct Connection</h3>
            <p>
              Connect images and feelings directly to English words. No
              translation needed.
            </p>
          </div>
          <div className="principle-card">
            <span className="principle-number">3</span>
            <h3>Brain Soaking</h3>
            <p>
              Immerse yourself in the language. Listen to rhythm and patterns
              repeatedly.
            </p>
          </div>
          <div className="principle-card">
            <span className="principle-number">4</span>
            <h3>Start Mixing</h3>
            <p>
              Combine words creatively. 10 verbs + 10 nouns + 10 adjectives =
              1,000 expressions.
            </p>
          </div>
        </div>
      </section>

      <section className="modes-section">
        <h2>Learning Modes</h2>
        <div className="modes-grid">
          <Link to="/learn" className="mode-card direct">
            <div className="mode-icon">🖼️</div>
            <h3>Image Connect</h3>
            <p>
              Learn words by connecting them directly to images. No Japanese
              translation.
            </p>
            <span className="mode-action">Start Learning →</span>
          </Link>

          <Link to="/listening" className="mode-card listening">
            <div className="mode-icon">🎧</div>
            <h3>Brain Soaking</h3>
            <p>
              Listen to words continuously. Train your ear to recognize
              patterns.
            </p>
            <span className="mode-action">Start Listening →</span>
          </Link>

          <Link to="/mixing" className="mode-card mixing">
            <div className="mode-icon">🔀</div>
            <h3>Word Mixing</h3>
            <p>
              Combine verbs, nouns, and adjectives to create sentences.
            </p>
            <span className="mode-action">Start Mixing →</span>
          </Link>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item">
          <span className="stat-number">3,000</span>
          <span className="stat-label">Words to Master</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">98%</span>
          <span className="stat-label">Daily Conversation Coverage</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">6</span>
          <span className="stat-label">Months to Fluency</span>
        </div>
      </section>

      {!user && (
        <section className="cta-section">
          <h2>Start Your Journey Today</h2>
          <p>Create an account to track your progress and unlock all features.</p>
          <Link to="/login" className="cta-button">
            Get Started Free
          </Link>
        </section>
      )}
    </div>
  );
}

export default Home;
