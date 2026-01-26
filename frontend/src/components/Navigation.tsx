import { NavLink } from "react-router-dom";
import { ThemeToggle } from "./ui";

export function Navigation() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-button text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text-primary"
    }`;

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-surface shadow-nav sticky top-0 z-50 flex-wrap gap-3">
      <div>
        <NavLink
          to="/"
          className="text-xl font-bold text-primary hover:text-primary-dark"
        >
          English Learn
        </NavLink>
      </div>

      <div className="flex gap-2 flex-wrap justify-center order-3 w-full md:w-auto md:order-none">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/learn" className={linkClass}>
          Learn
        </NavLink>
        <NavLink to="/listening" className={linkClass}>
          Listening
        </NavLink>
        <NavLink to="/mixing" className={linkClass}>
          Mixing
        </NavLink>
        <NavLink to="/progress" className={linkClass}>
          Progress
        </NavLink>
        <NavLink to="/callan" className={linkClass}>
          Callan
        </NavLink>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </nav>
  );
}

export default Navigation;
