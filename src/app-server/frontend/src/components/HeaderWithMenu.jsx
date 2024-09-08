import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/authContext';
import { useLocation, Link } from 'react-router-dom';
import { HiMenu } from 'react-icons/hi'; 
import logo from '../assets/logo.png';


const Header = () => {
  const { isAdminPasswordSet, isLoggedIn } = useAuth(); // Access the auth states
  const location = useLocation(); // Get the current location path
  const [menuOpen, setMenuOpen] = useState(false); // State to toggle the dropdown menu
  const menuRef = useRef(null); // Reference to the menu element

  // Handle clicks outside of the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false); // Close the dropdown if clicked outside
      }
    };

    // Add event listener for clicks
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  return (
    <header className="bg-gray-50 text-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
      <img src={logo} alt="Logo" width={48} height={48}  />

        {/* Menu Icon */}
        <div className="relative" ref={menuRef}>
          <button
            className="text-gray-800 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <HiMenu className="w-6 h-6 cursor-pointer" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 min-w-48 bg-white rounded-lg shadow-lg">
              <nav className="space-y-2">
                {!isAdminPasswordSet && (
                  <>
                    {location.pathname !== '/welcome' && location.pathname != '/' && (
                      <Link to="/" className="block px-4 py-2 font-thin text-sm text-gray-900 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Welcome</Link>
                    )}
                    {location.pathname !== '/set-admin-password' && (
                      <Link to="/set-admin-password" className="block px-4 py-2 font-thin text-sm text-gray-900 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Set Admin Password</Link>
                    )}
                  </>
                )}

                {isAdminPasswordSet && !isLoggedIn && (
                  location.pathname !== '/login' && (
                    <Link to="/login" className="block px-4 py-2 font-thin text-sm text-gray-900 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Login</Link>
                  )
                )}

                {isAdminPasswordSet && isLoggedIn && (
                  <>
                    {location.pathname !== '/agents' && (
                      <Link to="/agents" className="block px-4 py-2 font-thin text-sm text-gray-900 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Agents</Link>
                    )}
                    {location.pathname !== '/update-admin-password' && (
                      <Link to="/update-admin-password" className="block px-4 py-2 font-thin text-sm text-gray-900 hover:bg-gray-100 whitespace-nowrap" onClick={() => setMenuOpen(false)}>Update Admin Password</Link>
                    )}
                    {location.pathname !== '/logout' && (
                      <Link to="/logout" className="block px-4 py-2 font-thin text-sm text-gray-900 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>Logout</Link>
                    )}
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
