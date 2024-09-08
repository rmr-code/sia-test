import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/authContext';
import { useLocation, Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Header = () => {
  const { isAdminPasswordSet, isLoggedIn } = useAuth(); // Access the auth states
  const location = useLocation(); // Get the current location path
  const [menuOpen, setMenuOpen] = useState(false); // State to toggle the dropdown menu
  const menuRef = useRef(null); // Reference to the menu element

  return (
    <header className="bg-gray-50 p-4">
      <div className="container mx-auto flex justify-center items-center">
        <img src={logo} alt="Logo" width={64} height={64}  />
        </div>
    </header>
  );
}

export default Header;
