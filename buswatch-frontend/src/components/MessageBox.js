import React, { useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  // Dynamic styling based on message type
  const bgColor =
    type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";
  const Icon = type === "success" ? CheckCircle : XCircle;

  // Auto-hide message after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 7000); // Message disappears after 7 seconds
    return () => clearTimeout(timer);
  }, [message, onClose]); // Re-run effect if message or onClose changes

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border-l-4 ${bgColor} flex items-center space-x-3 transition-all duration-300 ease-out transform animate-fade-in-down max-w-sm sm:max-w-md w-11/12`}
    >
      {" "}
      {/* Responsive width */}
      <Icon className="w-6 h-6" />
      <p className="font-medium text-sm sm:text-base">{message}</p>{" "}
      {/* Responsive text size */}
      <button
        onClick={onClose}
        className="ml-auto text-current hover:text-opacity-75 focus:outline-none"
      >
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MessageBox;
