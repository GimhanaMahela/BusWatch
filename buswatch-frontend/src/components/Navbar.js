import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // For admin logout
import { LogOut, Home, LayoutDashboard } from "lucide-react"; // Icons from lucide-react

const Navbar = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login"); 
  };

  return (
    <nav className="bg-blue-800 p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Responsive padding */}
        {/* Logo/Brand - Always visible and centered */}
        <Link
          to="/"
          className="text-white text-2xl font-bold flex items-center space-x-2"
        >
          <Home className="w-6 h-6" />
          <span>BusWatch</span>
        </Link>
        {/* Navigation Links - Responsive arrangement */}
        <div className="flex items-center space-x-4">
          {isAdmin ? (
            <>
              {/* Admin Dashboard link */}
              <Link
                to="/admin"
                className="text-white hover:text-blue-200 transition duration-200 flex items-center space-x-1 text-sm sm:text-base"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>{" "}
                {/* Hide text on small screens */}
              </Link>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-200 transition duration-200 flex items-center space-x-1 focus:outline-none text-sm sm:text-base"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>{" "}
                {/* Hide text on small screens */}
              </button>
            </>
          ) : (
            // Admin Login link for non-admins
            <Link
              to="/admin/login"
              className="text-white hover:text-blue-200 transition duration-200 flex items-center space-x-1 text-sm sm:text-base"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden sm:inline">Admin Login</span>{" "}
              {/* Hide text on small screens */}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
