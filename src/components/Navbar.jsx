import React, { useState } from "react";
import { Menu, X, User, BookOpen, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar({
  isLoggedIn,
  onLogin,
  onShowProfile,
  onLogout,
  activeSection,
  onSectionChange,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", protected: false },
    { name: "Seniors", protected: true },
    { name: "TaskManager", protected: true },
    { name: "EventBuddy", protected: true },
    { name: "Chatbot", protected: true },
    { name: "Study Materials", protected: true },
  ];

  const handleNavClick = (item) => {
    // If we're on a discussion route, navigate to home first
    if (location.pathname.startsWith('/discussions')) {
      navigate('/');
      // Use setTimeout to ensure navigation completes before section change
      setTimeout(() => {
        onSectionChange(item.name);
      }, 50);
    } else {
      onSectionChange(item.name);
    }
    setIsMobileMenuOpen(false);
  };

  const isDiscussionActive = location.pathname.startsWith("/discussions");

  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold custom-brown">
              AcadMate
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === item.name && !isDiscussionActive
                    ? "custom-accent text-brown"
                    : "custom-brown hover-accent hover:text-brown"
                }`}
              >
                {item.name}
              </button>
            ))}

            {/* 🔹 Discussion Button */}
            <Link
              to="/discussions"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isDiscussionActive
                  ? "custom-accent text-brown"
                  : "custom-brown hover-accent hover:text-brown"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Discussion</span>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // If on discussion route, navigate to home first
                    if (location.pathname.startsWith('/discussions')) {
                      navigate('/');
                      setTimeout(() => {
                        onShowProfile();
                      }, 50);
                    } else {
                      onShowProfile();
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-accent hover-accent transition-all"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Profile</span>
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    // Navigate to home if on discussions
                    if (location.pathname.startsWith('/discussions')) {
                      navigate('/');
                    }
                  }}
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
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
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
                    activeSection === item.name && !isDiscussionActive
                      ? "custom-accent text-brown"
                      : "custom-brown hover-accent hover:text-brown"
                  }`}
                >
                  {item.name}
                </button>
              ))}

              {/* 🔹 Discussion (Mobile) */}
              <Link
                to="/discussions"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isDiscussionActive
                    ? "custom-accent text-brown"
                    : "custom-brown hover-accent hover:text-brown"
                }`}
              >
                Discussion
              </Link>

              {isLoggedIn ? (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (location.pathname.startsWith('/discussions')) {
                        navigate('/');
                        setTimeout(() => {
                          onShowProfile();
                        }, 50);
                      } else {
                        onShowProfile();
                      }
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
                      if (location.pathname.startsWith('/discussions')) {
                        navigate('/');
                      }
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