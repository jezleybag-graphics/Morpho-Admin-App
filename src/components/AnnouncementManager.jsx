import React, { useState, useEffect } from 'react';
import { X, Save, Megaphone, Loader2, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const AnnouncementManager = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'announcement');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || '');
          setMessage(data.message || '');
          setActive(data.isActive || false);
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. Save changes to Firestore
  const handleSave = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please enter a title and message.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'announcement'), {
        title,
        message,
        isActive: active,
        updatedAt: serverTimestamp(),
        updatedBy: 'Admin'
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-[#013E37] p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-[#C8A165]" />
            <h2 className="font-bold text-lg">Announcement Modal</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#013E37]" size={30} />
            </div>
          ) : (
            <>
              {/* Toggle Switch */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-800">Show Popup</h3>
                  <p className="text-xs text-gray-500">Visible to all customers</p>
                </div>
                <button
                  onClick={() => setActive(!active)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    active ? 'bg-[#013E37]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-1 transition-all ${
                      active ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Popup Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., We are Closed Today!"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013E37] font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message Body</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your message here..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013E37] text-sm text-gray-700 resize-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  showSuccess
                    ? 'bg-green-600 text-white shadow-green-600/20'
                    : 'bg-[#C8A165] text-white hover:bg-[#b08d55] shadow-[#C8A165]/20'
                }`}
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : showSuccess ? (
                  <>
                    <CheckCircle size={20} /> Saved!
                  </>
                ) : (
                  <>
                    <Save size={20} /> Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};