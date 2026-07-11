import React from 'react';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-tarot-velvet-2 border-2 border-tarot-gold rounded-lg shadow-2xl p-8 max-w-lg text-center">
        <p className="text-xl text-gray-200 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} className="py-2 px-6 text-lg font-bold rounded-lg transition-colors duration-300 text-white border-2 border-gray-500 bg-transparent hover:bg-white/10">
            Cancel
          </button>
          <button onClick={onConfirm} className="py-2 px-6 text-lg font-bold rounded-lg transition-colors duration-300 bg-red-600 text-white border-2 border-red-500 hover:bg-red-500">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;