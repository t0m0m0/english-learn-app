import { Link } from "react-router-dom";
import { Container, Card, Button } from "../components/ui";

export function CallanHome() {
  return (
    <Container size="lg" className="py-10">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Callan Method
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Practice English through rapid-fire Q&A repetition, shadowing, and
          dictation. Based on Chris Lonsdale's language learning principles.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Q&A Practice
          </h3>
          <p className="text-text-secondary text-sm">
            Rapid question and answer repetition to build automatic responses
          </p>
          <p className="text-text-muted text-xs mt-2">(Coming in #8)</p>
        </Card>

        <Card className="text-center">
          <div className="text-4xl mb-4">🎧</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Shadowing
          </h3>
          <p className="text-text-secondary text-sm">
            Listen and immediately repeat to improve pronunciation and fluency
          </p>
          <p className="text-success text-xs mt-2 font-medium">
            Available Now!
          </p>
        </Card>

        <Card className="text-center">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Dictation
          </h3>
          <p className="text-text-secondary text-sm">
            Write what you hear to improve listening comprehension and spelling
          </p>
          <p className="text-text-muted text-xs mt-2">(Coming in #10)</p>
        </Card>
      </div>

      <Card className="text-center">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Manage Your Lessons
        </h2>
        <p className="text-text-secondary mb-6">
          Create and organize your Q&A content for practice sessions.
        </p>
        <Link to="/callan/lessons">
          <Button variant="primary" size="lg">
            Go to Lessons
          </Button>
        </Link>
      </Card>

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4 text-center">
          Lonsdale's Principles Applied
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-primary/5">
            <h4 className="font-medium text-text-primary mb-2">
              🔄 Use Language as a Tool
            </h4>
            <p className="text-text-secondary text-sm">
              Practice speaking immediately through Q&A repetition
            </p>
          </Card>
          <Card className="bg-primary/5">
            <h4 className="font-medium text-text-primary mb-2">
              💪 Physiological Training
            </h4>
            <p className="text-text-secondary text-sm">
              Exercise facial muscles through shadowing practice
            </p>
          </Card>
          <Card className="bg-primary/5">
            <h4 className="font-medium text-text-primary mb-2">
              🎯 Focus on the Core
            </h4>
            <p className="text-text-secondary text-sm">
              High-frequency phrases and essential patterns
            </p>
          </Card>
          <Card className="bg-primary/5">
            <h4 className="font-medium text-text-primary mb-2">
              🔁 Massive Repetition
            </h4>
            <p className="text-text-secondary text-sm">
              Build automaticity through repeated practice
            </p>
          </Card>
        </div>
      </div>
    </Container>
  );
}

export default CallanHome;
