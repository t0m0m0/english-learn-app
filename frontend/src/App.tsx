import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Listening from './pages/Listening';
import Mixing from './pages/Mixing';
import Progress from './pages/Progress';
import Login from './pages/Login';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
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
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
