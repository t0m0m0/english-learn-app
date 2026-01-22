import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Navigation.css';

export function Navigation() {
  const { user, logout } = useUser();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <NavLink to="/">English Learn</NavLink>
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          Home
        </NavLink>
        <NavLink to="/learn" className={({ isActive }) => isActive ? 'active' : ''}>
          Learn
        </NavLink>
        <NavLink to="/listening" className={({ isActive }) => isActive ? 'active' : ''}>
          Listening
        </NavLink>
        <NavLink to="/mixing" className={({ isActive }) => isActive ? 'active' : ''}>
          Mixing
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => isActive ? 'active' : ''}>
          Progress
        </NavLink>
      </div>

      <div className="nav-user">
        {user ? (
          <>
            <span className="user-name">{user.name}</span>
            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className="login-link">
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
