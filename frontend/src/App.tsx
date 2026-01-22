import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Listening from './pages/Listening';
import Mixing from './pages/Mixing';
import Progress from './pages/Progress';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="app">
          <Navigation />
          <main className="main-content">
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
  );
}

export default App;
