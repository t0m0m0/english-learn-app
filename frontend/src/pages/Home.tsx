import { Link } from 'react-router-dom';
import { Container, Card, Button } from '../components/ui';

export function Home() {
  return (
    <Container size="lg" className="py-10">
      {/* Hero Section */}
      <header className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
          Learn English the Natural Way
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Based on Chris Lonsdale's proven principles for language acquisition
        </p>
      </header>

      {/* Principles Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Key Principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: 1,
              title: 'Focus on the Core',
              desc: 'Master the 3,000 most common words. This covers 98% of daily conversation.',
            },
            {
              num: 2,
              title: 'Direct Connection',
              desc: 'Connect images and feelings directly to English words. No translation needed.',
            },
            {
              num: 3,
              title: 'Brain Soaking',
              desc: 'Immerse yourself in the language. Listen to rhythm and patterns repeatedly.',
            },
            {
              num: 4,
              title: 'Start Mixing',
              desc: 'Combine words creatively. 10 verbs + 10 nouns + 10 adjectives = 1,000 expressions.',
            },
          ].map((principle) => (
            <Card key={principle.num} className="hover:shadow-elevated transition-shadow">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full font-semibold text-sm mb-4">
                {principle.num}
              </span>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {principle.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {principle.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Learning Modes Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Learning Modes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/learn" className="block group">
            <Card className="border-t-4 border-t-primary h-full hover:shadow-elevated hover:-translate-y-1 transition-all">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Image Connect
              </h3>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                Learn words by connecting them directly to images. No Japanese translation.
              </p>
              <span className="text-primary font-medium text-sm group-hover:underline">
                Start Learning →
              </span>
            </Card>
          </Link>

          <Link to="/listening" className="block group">
            <Card className="border-t-4 border-t-success h-full hover:shadow-elevated hover:-translate-y-1 transition-all">
              <div className="text-4xl mb-4">🎧</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Brain Soaking
              </h3>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                Listen to words continuously. Train your ear to recognize patterns.
              </p>
              <span className="text-primary font-medium text-sm group-hover:underline">
                Start Listening →
              </span>
            </Card>
          </Link>

          <Link to="/mixing" className="block group">
            <Card className="border-t-4 border-t-warning h-full hover:shadow-elevated hover:-translate-y-1 transition-all">
              <div className="text-4xl mb-4">🔀</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Word Mixing
              </h3>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                Combine verbs, nouns, and adjectives to create sentences.
              </p>
              <span className="text-primary font-medium text-sm group-hover:underline">
                Start Mixing →
              </span>
            </Card>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 py-10 mb-12">
        {[
          { value: '3,000', label: 'Words to Master' },
          { value: '98%', label: 'Daily Conversation Coverage' },
          { value: '6', label: 'Months to Fluency' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <span className="block text-4xl md:text-5xl font-bold text-primary mb-2">
              {stat.value}
            </span>
            <span className="text-sm text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="text-center bg-gradient-to-br from-primary to-purple-600 text-white p-10 md:p-16 rounded-3xl">
        <h2 className="text-3xl font-bold mb-4">Start Your Journey Today</h2>
        <p className="text-lg opacity-90 mb-8">
          Begin learning with the 3,000 most common English words.
        </p>
        <Link to="/learn">
          <Button
            variant="secondary"
            size="lg"
            className="bg-white text-primary hover:bg-gray-100"
          >
            Get Started
          </Button>
        </Link>
      </section>
    </Container>
  );
}

export default Home;
