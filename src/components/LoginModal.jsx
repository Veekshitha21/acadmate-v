import React, { useState } from "react";
import { X } from "lucide-react";
import "./Register.css";
import ApiService from "../services/api";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    usn: "",
    branch: "",
    section: "",
    email: "",
    phone: "",
  });

  const [error, setError] = useState({ message: "", field: "" });

  const branches = [
    "Biotechnology",
    "Civil Engineering",
    "Construction Technology and Management",
    "Computer Science and Engineering",
    "Computer Science and Engineering(AI & ML)",
    "Computer Science and Business System",
    "Electronics and Communication Engineering",
    "Information Science and Engineering",
    "Mechanical Engineering",
    "Bachelor of Computer Applications",
    "Bachelor of Business Administration",
    "other",
  ];

  // Password Validation
  const validatePassword = (password) => {
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter.";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter.";
    if (!/[!@#$%^&*]/.test(password))
      return "Password must contain a special character (e.g., !@#$%).";
    return null;
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError({ message: "", field: "" });

    try {
      if (isRegistering) {
        // --- Validation ---
        for (const key in formData) {
          if (
            Object.prototype.hasOwnProperty.call(formData, key) &&
            String(formData[key]).trim() === ""
          ) {
            setError({
              message: "Please fill in all required fields.",
              field: key,
            });
            setLoading(false);
            return;
          }
        }

        if (!formData.usn.toUpperCase().includes("JST")) {
          setError({
            message: 'Invalid USN. It must contain "JST".',
            field: "usn",
          });
          setLoading(false);
          return;
        }

        if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
          setError({
            message: "Please provide a valid @gmail.com email address.",
            field: "email",
          });
          setLoading(false);
          return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setError({ message: passwordError, field: "password" });
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError({
            message: "Passwords do not match.",
            field: "confirmPassword",
          });
          setLoading(false);
          return;
        }

        const phoneRegex = /^(91)?[0-9]{10}$/;
        if (!phoneRegex.test(formData.phone)) {
          setError({
            message: "Please enter a valid 10 or 12-digit phone number.",
            field: "phone",
          });
          setLoading(false);
          return;
        }

        // --- API Call: Register ---
        const { confirmPassword, ...submissionData } = formData;
        await ApiService.register(submissionData);

        // Success message + switch to login
        setError({
          message: "✅ Registration successful! Please login now.",
          field: "",
        });

        setIsRegistering(false);

        // Reset form
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          usn: "",
          branch: "",
          section: "",
          email: "",
          phone: "",
        });

        // Clear success message automatically
        setTimeout(() => setError({ message: "", field: "" }), 3000);
      } else {
        // --- API Call: Login ---
        const response = await ApiService.login({
          email: formData.email,
          password: formData.password,
        });

        // Store token + user in local storage
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));

        // Notify parent
        onLogin(response.user);
        onClose();
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError({
          message: err.response.data.errors[0].msg,
          field: err.response.data.errors[0].param,
        });
      } else if (err.response?.data?.message) {
        setError({ message: err.response.data.message, field: "" });
      } else {
        setError({ message: err.message || "Something went wrong.", field: "" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error.message) setError({ message: "", field: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold custom-brown">
              {isRegistering ? "Register" : "Login"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 custom-brown" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium custom-brown mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      error.field === "username"
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {error.field === "username" && (
                    <p className="text-red-500 text-sm mt-1">{error.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium custom-brown mb-2">
                    USN
                  </label>
                  <input
                    type="text"
                    name="usn"
                    value={formData.usn}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      error.field === "usn"
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {error.field === "usn" && (
                    <p className="text-red-500 text-sm mt-1">{error.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium custom-brown mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg ${
                  error.field === "email"
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {error.field === "email" && (
                <p className="text-red-500 text-sm mt-1">{error.message}</p>
              )}
            </div>

            {/* Password + Confirm Password */}
            <div
              className={isRegistering ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}
            >
              <div>
                <label className="block text-sm font-medium custom-brown mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    error.field === "password"
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {error.field === "password" && (
                  <p className="text-red-500 text-sm mt-1">{error.message}</p>
                )}
              </div>
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium custom-brown mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      error.field === "confirmPassword"
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {error.field === "confirmPassword" && (
                    <p className="text-red-500 text-sm mt-1">
                      {error.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {isRegistering && (
              <>
                {/* Branch + Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium custom-brown mb-2">
                      Branch
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        error.field === "branch"
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                    {error.field === "branch" && (
                      <p className="text-red-500 text-sm mt-1">
                        {error.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium custom-brown mb-2">
                      Section
                    </label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        error.field === "section"
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {error.field === "section" && (
                      <p className="text-red-500 text-sm mt-1">
                        {error.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium custom-brown mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    pattern="^(91)?[0-9]{10}$"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      error.field === "phone"
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {error.field === "phone" && (
                    <p className="text-red-500 text-sm mt-1">{error.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full custom-accent text-brown font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              {loading
                ? isRegistering
                  ? "Registering..."
                  : "Logging in..."
                : isRegistering
                ? "Register"
                : "Login"}
            </button>

            {/* Success/Error Message */}
            {error.message && !error.field && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  error.message.includes("✅")
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : "bg-red-100 border border-red-400 text-red-700"
                }`}
              >
                {error.message}
              </div>
            )}
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="custom-brown opacity-70">
              {isRegistering
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-accent font-semibold hover:underline"
              >
                {isRegistering ? "Login" : "Register"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
