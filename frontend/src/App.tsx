import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Listening from "./pages/Listening";
import Mixing from "./pages/Mixing";
import Progress from "./pages/Progress";
import CallanHome from "./pages/CallanHome";
import CallanLessons from "./pages/CallanLessons";
import CallanLessonForm from "./pages/CallanLessonForm";
import CallanPractice from "./pages/CallanPractice";
import CallanShadowingPage from "./pages/CallanShadowingPage";
import CallanDictationPage from "./pages/CallanDictationPage";
import ListeningPractice from "./pages/ListeningPractice";
import ListeningPracticeSession from "./pages/ListeningPracticeSession";
import SoundChangeHome from "./pages/SoundChangeHome";
import SoundChangeCategoryDetail from "./pages/SoundChangeCategoryDetail";
import SoundChangePracticeSession from "./pages/SoundChangePracticeSession";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 pb-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/listening" element={<Listening />} />
              <Route path="/mixing" element={<Mixing />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/callan" element={<CallanHome />} />
              <Route path="/callan/lessons" element={<CallanLessons />} />
              <Route
                path="/callan/lessons/new"
                element={<CallanLessonForm />}
              />
              <Route
                path="/callan/lessons/:id/edit"
                element={<CallanLessonForm />}
              />
              <Route
                path="/callan/practice/:lessonId"
                element={<CallanPractice />}
              />
              <Route
                path="/callan/shadowing/:lessonId"
                element={<CallanShadowingPage />}
              />
              <Route
                path="/callan/dictation/:lessonId"
                element={<CallanDictationPage />}
              />
              <Route
                path="/listening-practice"
                element={<ListeningPractice />}
              />
              <Route
                path="/listening-practice/:passageId"
                element={<ListeningPracticeSession />}
              />
              <Route path="/sound-changes" element={<SoundChangeHome />} />
              <Route
                path="/sound-changes/:slug"
                element={<SoundChangeCategoryDetail />}
              />
              <Route
                path="/sound-changes/practice/:exerciseId"
                element={<SoundChangePracticeSession />}
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
