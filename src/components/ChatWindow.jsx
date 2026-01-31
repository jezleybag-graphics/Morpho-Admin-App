import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Loader2, MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export const ChatWindow = ({ orderId, currentUser, closeChat }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // --- SAFETY FIX: Force orderId to String to match Firestore keys ---
  const safeOrderId = String(orderId);
  const senderName = currentUser?.name || 'Admin';

  // 1. FETCH MESSAGES (Real-time)
  useEffect(() => {
    if (!safeOrderId) return;

    // Query chats where orderId matches our string ID
    const q = query(
      collection(db, 'chats'),
      where('orderId', '==', safeOrderId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [safeOrderId]);

  // 2. AUTO-SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. SEND MESSAGE
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'chats'), {
        orderId: safeOrderId, // Use the string ID
        text: inputText.trim(),
        sender: 'admin', // Always 'admin' in this app
        senderName: senderName,
        createdAt: serverTimestamp(),
      });
      setInputText('');
    } catch (error) {
      console.error('Send Error', error);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-[#F4F3F2] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-slide-up font-sans">
      {/* HEADER */}
      <div className="bg-[#013E37] p-4 flex justify-between items-center shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-none">
              Order Chat
            </h3>
            <p className="text-[#C8A165] text-xs font-bold uppercase tracking-wider mt-0.5">
              #{safeOrderId.slice(-4)} • Live Support
            </p>
          </div>
        </div>
        <button
          onClick={closeChat}
          className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F3F2]">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#013E37]" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10 text-sm font-medium">
            No messages yet.
            <br />
            Start the conversation!
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'admin';

          return (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] p-3.5 rounded-2xl text-sm font-medium shadow-sm ${
                  isMe
                    ? 'bg-[#013E37] text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}
              >
                {msg.text || msg.message}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1 font-bold">
                {isMe ? 'You' : 'Customer'} •{' '}
                {msg.createdAt?.toDate
                  ? msg.createdAt
                      .toDate()
                      .toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                  : 'Just now'}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#013E37] focus:bg-white transition-all text-[#013E37]"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="bg-[#013E37] text-white p-3 rounded-xl hover:bg-[#022c27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#013E37]/20"
        >
          {sending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
};
