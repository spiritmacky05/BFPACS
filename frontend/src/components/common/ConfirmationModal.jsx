import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${isDangerous ? "text-red-400" : "text-yellow-400"}`} />
            <h2 className="text-white font-semibold">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
        <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${isDangerous ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}