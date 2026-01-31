import React from 'react';
import { LogOut } from 'lucide-react';

export const LogoutModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#013E37]/90 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#F4F3F2] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center animate-slide-up">
        
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <LogOut size={40} className="text-red-500 ml-1" />
        </div>
        
        <h3 className="text-2xl font-black text-[#013E37] mb-2">Log Out?</h3>
        <p className="text-gray-500 font-medium mb-8">
          Are you sure you want to end your session? You will need your PIN to log back in.
        </p>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onCancel} 
            className="flex-1 py-4 rounded-xl font-bold text-[#013E37] hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors active:scale-95"
          >
            Yes, Log Out
          </button>
        </div>

      </div>
    </div>
  );
};