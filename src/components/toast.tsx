import { Check } from "lucide-react";
import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div
      className={`fixed top-5 right-5 transition-all duration-300 z-50 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 pointer-events-none"
      }`}
    >
      <div className="flex bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium align-center m-auto">
        <Check className="mr-2 m-auto" size={18}/> Process completed successfully
      </div>
    </div>
  );
};

export default Toast;
