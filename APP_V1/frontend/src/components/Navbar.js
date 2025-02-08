import { Link } from "react-router-dom";
import "./Navbar.css"; // Import custom styles

const Navbar = () => {
  return (
    <nav className="navbar">
      <h1 className="logo">Transport Query</h1>
      <div className="nav-links">
        <Link to="/home" className="nav-link">Home</Link>
        <Link to="/" onClick={() => localStorage.removeItem("user")} className="nav-link">Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;
