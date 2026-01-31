import React, { useState, useEffect } from 'react';
import {
  User,
  Loader2,
  KeyRound,
  ArrowRight,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import morphoLogo from '../assets/morpho 120x120.png';

export const LoginScreen = ({ onLogin }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // 1. FETCH STAFF
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'staff'));
      const staffData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Raw Staff Data:', staffData); // Debugging log

      // Robust Filter: Handles 'isActive', 'isactive', boolean true, or string "TRUE"
      const activeStaff = staffData.filter((s) => {
        const status = s.isActive !== undefined ? s.isActive : s.isactive;
        if (status === false) return false;
        if (String(status).toUpperCase() === 'FALSE') return false;
        return true;
      });

      setStaffList(activeStaff);

      // Check Local Storage for "Remember Me"
      const lastUserId = localStorage.getItem('morpho_last_user_id');
      if (lastUserId) {
        const foundUser = activeStaff.find((u) => u.id === lastUserId);
        if (foundUser) setSelectedUser(foundUser);
      }
    } catch (err) {
      console.error('Login fetch error', err);
      setError('Failed to load staff. Check console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // 2. EMERGENCY: CREATE DEFAULT ADMIN
  const createDefaultAdmin = async () => {
    setCreatingAdmin(true);
    try {
      const newAdmin = {
        name: 'Admin Owner',
        role: 'owner',
        pin: '1234', // Default PIN
        image: '',
        isActive: true,
      };
      await addDoc(collection(db, 'staff'), newAdmin);
      alert('Admin created! PIN is 1234');
      fetchStaff(); // Refresh list
    } catch (e) {
      alert('Error creating admin: ' + e.message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  // 3. HANDLERS
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem('morpho_last_user_id', user.id);
  };

  const handleSwitchUser = () => {
    setSelectedUser(null);
    setPin('');
    setError('');
    localStorage.removeItem('morpho_last_user_id');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Loose comparison for PIN to handle numbers vs strings
    if (String(pin).trim() === String(selectedUser.pin).trim()) {
      onLogin(selectedUser);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3F2] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#013E37]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-[#C8A165]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[380px] relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={morphoLogo}
            alt="Morpho Logo"
            className="w-28 h-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-black text-[#013E37] tracking-tight">
            Morpho Admin
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Manage orders & staff
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#013E37] rounded-[2.5rem] p-8 shadow-2xl shadow-[#013E37]/30 text-white relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-[#C8A165]" size={40} />
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                Loading Team...
              </p>
            </div>
          ) : !selectedUser ? (
            /* USER SELECTION SCREEN */
            <div className="animate-fade-in relative z-10">
              <h2 className="text-lg font-bold mb-4 text-center">
                Who is logging in?
              </h2>

              {staffList.length === 0 ? (
                // EMPTY STATE & RECOVERY BUTTON
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-white/10 p-4 rounded-full mb-3 text-[#C8A165]">
                    <AlertTriangle size={32} />
                  </div>
                  <p className="text-sm font-medium mb-4">
                    No staff profiles found.
                  </p>
                  <button
                    onClick={createDefaultAdmin}
                    disabled={creatingAdmin}
                    className="bg-[#C8A165] text-[#013E37] px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white transition-colors"
                  >
                    {creatingAdmin ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserPlus size={16} />
                    )}
                    Create Owner (PIN: 1234)
                  </button>
                </div>
              ) : (
                // LIST OF USERS
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {staffList.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl transition-all active:scale-95 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#F4F3F2] mb-2 overflow-hidden border-2 border-transparent group-hover:border-[#C8A165] transition-colors">
                        {user.image ? (
                          <img
                            src={user.image}
                            className="w-full h-full object-cover"
                            alt={user.name}
                          />
                        ) : (
                          <User className="w-full h-full p-2.5 text-gray-400" />
                        )}
                      </div>
                      <span className="font-bold text-sm truncate w-full text-center">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-bold text-[#C8A165] uppercase tracking-wider">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* PIN ENTRY SCREEN */
            <form
              onSubmit={handleLogin}
              className="animate-fade-in relative z-10"
            >
              <button
                type="button"
                onClick={handleSwitchUser}
                className="mb-6 text-xs font-bold text-white/50 hover:text-white flex items-center gap-1 transition-colors"
              >
                ← Choose different user
              </button>

              <div className="flex items-center gap-4 mb-8 p-1">
                <div className="w-14 h-14 rounded-full bg-[#F4F3F2] border-2 border-[#C8A165] overflow-hidden shadow-lg">
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <User className="w-full h-full p-3 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-none">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs font-bold text-[#C8A165] uppercase tracking-widest mt-1">
                    {selectedUser.role}
                  </p>
                </div>
              </div>

              <div className="relative mb-2">
                <KeyRound
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#013E37]"
                />
                <input
                  type="password"
                  autoFocus
                  maxLength="4"
                  className="w-full bg-[#F4F3F2] text-[#013E37] rounded-xl py-4 pl-12 pr-4 text-center font-black text-2xl tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-[#C8A165]/50 transition-all placeholder:text-[#013E37]/20"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                />
              </div>

              <div className="h-6 mb-2 text-center">
                {error && (
                  <p className="text-[#ff6b6b] text-xs font-bold animate-bounce">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#C8A165] text-[#013E37] font-bold py-4 rounded-xl shadow-lg shadow-[#C8A165]/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-[#d4af76]"
              >
                Access Dashboard <ArrowRight size={18} strokeWidth={3} />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8 font-medium">
          Protected System • Built and Designed by Morpho Cafe & Studio
        </p>
      </div>
    </div>
  );
};
