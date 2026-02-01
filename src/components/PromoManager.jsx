import React, { useState, useEffect } from 'react';
import { 
  X, Save, Ticket, Zap, Loader2, Trash2, Calendar, 
  AlertCircle, CheckCircle, Plus, Search 
} from 'lucide-react';
import { 
  collection, addDoc, getDocs, deleteDoc, 
  doc, updateDoc, serverTimestamp, query, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

// --- HELPER: Date Formatter ---
const formatDate = (dateString) => {
  if (!dateString) return 'No limit';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: '2-digit'
  });
};

export const PromoManager = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('conditional'); // 'conditional' or 'code'
  const [promos, setPromos] = useState([]);
  const [menuItems, setMenuItems] = useState([]); // Needed for Bundle selection
  const [loading, setLoading] = useState(true);
  
  // --- FORM STATE ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'conditional', // 'conditional' | 'code'
    title: '',
    isActive: true,
    startDate: '',
    endDate: '',
    
    // CONDITIONAL FIELDS
    subtype: 'free_delivery', // 'free_delivery' | 'bundle'
    minItemCount: 1,
    maxDistanceKm: 5,
    triggerItemId: '',
    targetItemId: '',
    discountPercent: 0,
    
    // CODE FIELDS
    code: '',
    minSpend: 0,
    maxCap: 0,
    limitGlobal: 0, // 0 = Unlimited
    limitUser: 0    // 0 = Unlimited
  });

  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Promos
        const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
        const promoSnap = await getDocs(q);
        setPromos(promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Menu (for Bundles)
        const menuSnap = await getDocs(collection(db, 'menu'));
        setMenuItems(menuSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. HANDLERS
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this promo?")) return;
    try {
      await deleteDoc(doc(db, 'promotions', id));
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert("Error deleting");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'promotions', id), { isActive: !currentStatus });
      setPromos(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
    } catch (e) {
      alert("Error updating status");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title) return alert("Title is required");
    if (formData.type === 'code' && !formData.code) return alert("Code is required");
    if (formData.type === 'conditional' && formData.subtype === 'bundle' && (!formData.triggerItemId || !formData.targetItemId)) {
      return alert("Please select both items for the bundle");
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().replace(/\s/g, ''), // Clean code
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'promotions'), payload);
      setPromos([{ id: docRef.id, ...payload }, ...promos]);
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Failed to save promo");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      title: '',
      isActive: true,
      startDate: '',
      endDate: '',
      subtype: 'free_delivery',
      minItemCount: 1,
      maxDistanceKm: 5,
      triggerItemId: '',
      targetItemId: '',
      discountPercent: 0,
      code: '',
      minSpend: 0,
      maxCap: 0,
      limitGlobal: 0,
      limitUser: 0
    });
  };

  // 3. RENDERERS
  const renderList = () => {
    const filtered = promos.filter(p => p.type === activeTab);
    
    if (filtered.length === 0) return (
      <div className="text-center py-20 text-gray-400">
        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
        <p>No active promotions here.</p>
      </div>
    );

    return (
      <div className="space-y-3 pb-20">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
                {p.subtype && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{p.subtype.replace('_', ' ')}</span>}
                {p.code && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider">{p.code}</span>}
              </div>
              <h4 className="font-bold text-gray-800">{p.title}</h4>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar size={12} /> 
                {p.startDate ? `${formatDate(p.startDate)} - ${formatDate(p.endDate)}` : 'Always active'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => handleToggleActive(p.id, p.isActive)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${p.isActive ? 'bg-[#013E37]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all ${p.isActive ? 'left-5' : 'left-1'}`} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-[#F4F3F2] w-full max-w-2xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="bg-[#013E37] p-5 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <Ticket className="text-[#C8A165]" />
            <div>
              <h2 className="font-bold text-xl leading-none">Promo Manager</h2>
              <p className="text-white/60 text-xs mt-1">Manage deals and coupons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* TABS */}
        {!isFormOpen && (
          <div className="p-4 bg-white border-b border-gray-200 flex gap-2 shrink-0">
            <button 
              onClick={() => setActiveTab('conditional')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'conditional' ? 'bg-[#013E37] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <Zap size={16} /> Auto / Bundles
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'code' ? 'bg-[#013E37] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <Ticket size={16} /> Promo Codes
            </button>
          </div>
        )}

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 relative">
          {loading ? (
             <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>
          ) : isFormOpen ? (
            
            // --- FORM VIEW ---
            <div className="space-y-6 animate-slideUp">
              {/* Common Fields */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-[#013E37] uppercase tracking-wide text-xs">Basic Info</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Promo Title</label>
                  <input 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Rainy Day Special"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Date</label>
                    <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm" 
                      value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Date</label>
                    <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                      value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Conditional Specifics */}
              {activeTab === 'conditional' && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <h3 className="font-bold text-[#013E37] uppercase tracking-wide text-xs">Rules</h3>
                  
                  {/* Subtype Switch */}
                  <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                    <button 
                      onClick={() => setFormData({...formData, subtype: 'free_delivery'})}
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData.subtype === 'free_delivery' ? 'bg-white shadow text-[#013E37]' : 'text-gray-500'}`}
                    >
                      Free Delivery
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, subtype: 'bundle'})}
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${formData.subtype === 'bundle' ? 'bg-white shadow text-[#013E37]' : 'text-gray-500'}`}
                    >
                      Bundle Deal
                    </button>
                  </div>

                  {formData.subtype === 'free_delivery' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Min. Items</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          value={formData.minItemCount} onChange={e => setFormData({...formData, minItemCount: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Max Distance (km)</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          value={formData.maxDistanceKm} onChange={e => setFormData({...formData, maxDistanceKm: Number(e.target.value)})} />
                      </div>
                    </div>
                  ) : (
                    // BUNDLE FORM
                    <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Buy 1 of this...</label>
                         <select 
                           className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                           value={formData.triggerItemId}
                           onChange={e => setFormData({...formData, triggerItemId: e.target.value})}
                         >
                           <option value="">Select Item</option>
                           {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase mb-1">To Get Discount on...</label>
                         <select 
                           className="w-full p-3 bg-gray-50 rounded-xl text-sm"
                           value={formData.targetItemId}
                           onChange={e => setFormData({...formData, targetItemId: e.target.value})}
                         >
                           <option value="">Select Item</option>
                           {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                         </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Discount %</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          placeholder="35"
                          value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Code Specifics */}
              {activeTab === 'code' && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                   <h3 className="font-bold text-[#013E37] uppercase tracking-wide text-xs">Code Settings</h3>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Code String</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 rounded-xl font-black text-lg tracking-widest uppercase border-2 border-dashed border-gray-300 focus:border-[#013E37] outline-none"
                        placeholder="SUMMER25"
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value})} 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Discount %</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Min Spend (₱)</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          value={formData.minSpend} onChange={e => setFormData({...formData, minSpend: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Usage Limit (Global)</label>
                        <input type="number" placeholder="0 = Unlimited" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          value={formData.limitGlobal} onChange={e => setFormData({...formData, limitGlobal: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Max Cap (₱)</label>
                        <input type="number" placeholder="0 = None" className="w-full p-3 bg-gray-50 rounded-xl font-bold"
                          value={formData.maxCap} onChange={e => setFormData({...formData, maxCap: Number(e.target.value)})} />
                      </div>
                   </div>
                </div>
              )}

              <div className="h-10"></div> {/* Spacer */}
            </div>

          ) : renderList()}
        </div>

        {/* FOOTER ACTION */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
          {isFormOpen ? (
            <div className="flex gap-3">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#013E37] hover:bg-[#022c27] flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Promo</>}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="w-full py-4 rounded-2xl font-bold text-white bg-[#013E37] shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Create New {activeTab === 'conditional' ? 'Auto Promo' : 'Code'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};