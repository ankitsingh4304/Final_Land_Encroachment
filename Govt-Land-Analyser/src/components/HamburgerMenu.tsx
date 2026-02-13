"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/login", {
        method: "DELETE",
      });
      setUser(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Don't show menu if user is not logged in
  if (loading || !user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1.5 p-2 border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <span
          className={`block h-0.5 w-6 bg-gray-700 transition-all ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-gray-700 transition-all ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-gray-700 transition-all ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg z-50">
            <div className="py-2">
              {/* User Info */}
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {user.role === "user" ? "Citizen" : user.role.replace("_", " ")}
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
