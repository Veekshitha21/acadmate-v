import React, { useState } from 'react';
import { Menu, X, User, BookOpen } from 'lucide-react';

export default function Navbar({ isLoggedIn, onLogin, onShowProfile, onLogout, activeSection, onSectionChange }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', protected: false },
    { name: 'Seniors', protected: true },
    { name: 'TaskManager', protected: true },
    { name: 'EventBuddy', protected: true },
    { name: 'Chatbot', protected: true },
    { name: 'Study Materials', protected: true },
    { name: 'About Us', protected: true }
  ];

  const handleNavClick = (item) => {
    onSectionChange(item.name);
    setIsMobileMenuOpen(false);
  };

  return (
    // CHANGE IS HERE: 'sticky' -> 'fixed w-full'
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold custom-brown">AcadMate</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === item.name
                    ? 'custom-accent text-brown'
                    : 'custom-brown hover-accent hover:text-brown'
                }`}
                title={item.protected && !isLoggedIn ? 'Login required to access this page' : ''}
              >
                {item.name}
              </button>
            ))}
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onShowProfile}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-accent hover-accent transition-all"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Profile</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 rounded-lg custom-accent text-brown font-medium hover:bg-yellow-500 transition-colors"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md custom-brown hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    activeSection === item.name
                      ? 'custom-accent text-brown'
                      : 'custom-brown hover-accent hover:text-brown'
                  }`}
                  title={item.protected && !isLoggedIn ? 'Login required to access this page' : ''}
                >
                  {item.name}
                </button>
              ))}
              
              {isLoggedIn ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onShowProfile();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md border-2 border-accent hover-accent transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-md text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-md custom-accent text-brown font-medium hover:bg-yellow-500 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}