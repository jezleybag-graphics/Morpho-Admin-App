import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  User,
  Loader2,
  Shield,
  Bike,
  ChefHat,
  Camera,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export const StaffManager = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'Rider', // Admin, Rider, Kitchen
    phone: '',
    pin: '',
    image: '',
    status: 'Active', // Active, Inactive
  });

  // --- 1. FETCH STAFF ---
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'staff'));
      const staffData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // --- 2. IMAGE PROCESSING (Base64) ---
  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; // Smaller for avatars
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.7);
        };
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const processedBlob = await processImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(processedBlob);
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
        setUploadingImg(false);
      };
    } catch (error) {
      alert('Error processing image.');
      setUploadingImg(false);
    }
  };

  // --- 3. CRUD OPERATIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'staff', editingItem.id), formData);
      } else {
        await addDoc(collection(db, 'staff'), formData);
      }
      fetchStaff();
      closeModal();
    } catch (error) {
      alert('Failed to save staff member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'staff', id));
      fetchStaff();
    } catch (error) {
      alert('Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    // Optimistic Update
    setStaff(
      staff.map((s) => (s.id === item.id ? { ...s, status: newStatus } : s))
    );
    try {
      await updateDoc(doc(db, 'staff', item.id), { status: newStatus });
    } catch (error) {
      fetchStaff(); // Revert on error
    }
  };

  // --- UI HELPERS ---
  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        role: 'Rider',
        phone: '',
        pin: '',
        image: '',
        status: 'Active',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <Shield size={14} />;
      case 'Kitchen':
        return <ChefHat size={14} />;
      default:
        return <Bike size={14} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Kitchen':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-[#013E37]">Staff Team</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#013E37] text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#022c27] transition shadow-lg shadow-[#013E37]/20 font-bold"
        >
          <Plus size={20} /> Add Staff
        </button>
      </div>

      {loading && !staff.length && (
        <div className="text-center py-10">
          <Loader2 className="animate-spin mx-auto text-[#013E37]" size={40} />
        </div>
      )}

      {/* STAFF GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className={`bg-white border rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all flex gap-4 items-center ${
              member.status === 'Inactive'
                ? 'opacity-60 border-gray-200'
                : 'border-gray-100'
            }`}
          >
            {/* AVATAR */}
            <div className="w-20 h-20 rounded-full bg-gray-100 shrink-0 overflow-hidden border-2 border-white shadow-sm">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User size={32} />
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#013E37] truncate text-lg leading-tight">
                {member.name}
              </h3>

              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 border ${getRoleColor(
                  member.role
                )}`}
              >
                {getRoleIcon(member.role)} {member.role}
              </div>

              <div className="flex gap-2">
                {/* STATUS TOGGLE */}
                <button
                  onClick={() => toggleStatus(member)}
                  className={`p-2 rounded-lg transition-colors ${
                    member.status === 'Active'
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={
                    member.status === 'Active' ? 'Set Inactive' : 'Set Active'
                  }
                >
                  {member.status === 'Active' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Ban size={16} />
                  )}
                </button>

                <button
                  onClick={() => openModal(member)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-[#F4F3F2]">
              <h3 className="font-black text-xl text-[#013E37]">
                {editingItem ? 'Edit Staff' : 'New Staff'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-black/5 rounded-full text-[#013E37]"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* IMAGE UPLOAD */}
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-gray-300" />
                    )}
                  </div>
                  {/* Remove Photo Button */}
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <label className="absolute bottom-0 right-0 bg-[#013E37] text-white p-2 rounded-full cursor-pointer hover:bg-[#022c27] shadow-md">
                    <Camera size={14} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImg}
                    />
                  </label>
                </div>
              </div>

              {/* INPUTS */}
              <div>
                <label className="text-xs font-bold text-[#013E37] uppercase ml-1">
                  Full Name
                </label>
                <input
                  required
                  className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:border-[#013E37] outline-none"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Juan Cruz"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#013E37] uppercase ml-1">
                    Role
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:border-[#013E37] outline-none bg-white"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="Rider">Rider</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#013E37] uppercase ml-1">
                    4-Digit PIN
                  </label>
                  <input
                    required
                    type="tel"
                    maxLength="4"
                    className="w-full p-3 border border-gray-200 rounded-xl font-medium text-center tracking-widest focus:border-[#013E37] outline-none"
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pin: e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    placeholder="••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#013E37] uppercase ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:border-[#013E37] outline-none"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="0912 345 6789"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImg}
                  className="flex-[2] bg-[#013E37] text-white py-3 rounded-xl font-bold hover:bg-[#022c27] transition shadow-lg shadow-[#013E37]/20 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Save size={18} /> Save Staff
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
