import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Image as ImageIcon,
  Loader2,
  CheckSquare,
  Square,
  Flame,
  Snowflake,
  Camera,
  CheckCircle2,
} from 'lucide-react';
// --- FIRESTORE IMPORTS ---
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

// --- CONFIGURATION ---

// 1. PRE-DEFINED DIPS LIST (For "Included Choice" / Free)
const DIP_OPTIONS = [
  'Ketsup',
  'Classic Cheese',
  'Garlic Mayo',
  'Honey Sriracha',
  'Buffalo',
  'Salad Dressing',
  'Special Suka', // Added New Option
];

const MENU_STRUCTURE = {
  'Coffee & Drinks': {
    subcategories: [
      'Espresso Dreams',
      'Mocktail Moods',
      'Milky Vibes',
      'Frappe Havens',
    ],
    defaultAddons: [
      {
        name: 'Syrup',
        price: 20,
        options: ['Vanilla', 'Hazelnut', 'Caramel', 'Ceremonial Matcha'],
      },
      { name: 'Milk Upgrade', price: 50, options: ['Oat Milk', 'Almond Milk'] },
      {
        name: 'Cold Foam',
        price: 35,
        options: ['Sea Salt', 'Matcha', 'Strawberry', 'Chocolate'],
      },
      { name: 'Espresso Shot', price: 25 },
    ],
  },
  'Meals & Snacks': {
    subcategories: [
      'Morning Cravings',
      'Rice & Buff',
      'Salad Desires',
      'Carbs Lovers',
      'Teaser Pleaser',
      'Dessert Fantacies',
      'Platter',
    ],
    defaultAddons: [
      { name: 'Plain Rice', price: 20 },
      { name: 'Java Rice', price: 30 },
      // 2. RESTORED DIP ADD-ON (For "Paid Extra" / Add-on)
      {
        name: 'Dip',
        price: 15,
        options: [
          'Ketsup',
          'Classic Cheese',
          'Garlic Mayo',
          'Honey Sriracha',
          'Buffalo',
          'Salad Dressing',
          'Special Suka', // Added New Option here too
        ],
      },
    ],
  },
};

export const MenuManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Coffee & Drinks',
    subcategory: 'Espresso Dreams',
    name: '',
    description: '',
    price: '',
    image: '',
    isAvailable: true,
    variants: [],
    addons: [],
    choiceTitle: 'Choose 1 Dip',
    choiceOptions: [],
  });

  // --- LOGIC: TOGGLE PRE-DEFINED DIPS ---
  const toggleDipOption = (dipName) => {
    const currentOptions = formData.choiceOptions || [];
    if (currentOptions.includes(dipName)) {
      setFormData({
        ...formData,
        choiceOptions: currentOptions.filter((opt) => opt !== dipName),
      });
    } else {
      setFormData({
        ...formData,
        choiceOptions: [...currentOptions, dipName],
      });
    }
  };

  // --- 1. FETCH FROM FIREBASE ---
  const fetchMenu = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'menu'));
      const menuData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(menuData);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- 2. IMAGE UPLOAD HELPERS ---
  const processImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.5);
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
        const base64String = reader.result;
        if (base64String.length > 900000) {
          alert('Image is too complex. Please choose a simpler photo.');
          setUploadingImg(false);
          return;
        }
        setFormData((prev) => ({ ...prev, image: base64String }));
        setUploadingImg(false);
      };
    } catch (error) {
      alert('Error processing image.');
      setUploadingImg(false);
    }
  };

  // --- 3. CRUD ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'menu', editingItem.id), formData);
      } else {
        await addDoc(collection(db, 'menu'), formData);
      }
      fetchMenu();
      closeModal();
    } catch (error) {
      alert('Failed to save item.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete item?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'menu', id));
      fetchMenu();
    } catch (error) {
      alert('Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (item) => {
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
    );
    setItems(updatedItems);
    try {
      await updateDoc(doc(db, 'menu', item.id), {
        isAvailable: !item.isAvailable,
      });
    } catch (error) {
      fetchMenu();
    }
  };

  // --- HELPERS ---
  const toggleStandardAddon = (addon) => {
    const exists = formData.addons.find((a) => a.name === addon.name);
    if (exists) {
      setFormData((prev) => ({
        ...prev,
        addons: prev.addons.filter((a) => a.name !== addon.name),
      }));
    } else {
      setFormData((prev) => ({ ...prev, addons: [...prev.addons, addon] }));
    }
  };

  const applyVariantPreset = (type) => {
    if (type === 'hot_cold') {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { name: 'Hot', price: Number(prev.price) },
          { name: 'Iced', price: Number(prev.price) + 5 },
        ],
      }));
    }
  };

  const clearVariants = () =>
    setFormData((prev) => ({ ...prev, variants: [] }));

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        choiceTitle: item.choiceTitle || 'Choose 1 Dip',
        choiceOptions: item.choiceOptions || [],
      });
    } else {
      setEditingItem(null);
      setFormData({
        category: 'Coffee & Drinks',
        subcategory: MENU_STRUCTURE['Coffee & Drinks'].subcategories[0],
        name: '',
        description: '',
        price: '',
        image: '',
        isAvailable: true,
        variants: [],
        addons: [],
        choiceTitle: 'Choose 1 Dip',
        choiceOptions: [],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // --- DYNAMIC VISIBILITY ---
  const currentSubcategories =
    MENU_STRUCTURE[formData.category]?.subcategories || [];
  const currentDefaultAddons =
    MENU_STRUCTURE[formData.category]?.defaultAddons || [];

  const showVariants = formData.category === 'Coffee & Drinks';
  const showChoices = formData.category === 'Meals & Snacks';

  return (
    <div className="max-w-[1600px] mx-auto pb-20 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-[#013E37]">Menu Manager</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#013E37] text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-[#022c27] transition shadow-lg shadow-[#013E37]/20 font-bold"
        >
          <Plus size={20} /> Add Item
        </button>
      </div>

      {loading && (
        <div className="text-center py-10">
          <Loader2 className="animate-spin mx-auto text-[#013E37]" size={40} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {!loading &&
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all flex gap-4 items-center"
            >
              <div
                className={`w-24 h-24 bg-[#F4F3F2] rounded-xl overflow-hidden shrink-0 border border-gray-100 ${
                  !item.isAvailable ? 'grayscale opacity-60' : ''
                }`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-full h-full p-6 text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#013E37] truncate text-lg">
                  {item.name}
                </h3>
                <p className="text-xs font-bold text-[#C8A165] mb-1 truncate uppercase tracking-wider">
                  {item.subcategory}
                </p>
                <p className="text-sm font-bold text-gray-900">₱{item.price}</p>

                <div className="flex flex-wrap gap-1 mb-2 mt-2">
                  {item.variants && item.variants.length > 0 && (
                    <span className="text-[10px] bg-[#013E37]/10 text-[#013E37] px-2 py-0.5 rounded font-bold">
                      {item.variants.length} Variants
                    </span>
                  )}
                  {item.choiceOptions && item.choiceOptions.length > 0 && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">
                      {item.choiceOptions.length} Choices
                    </span>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold">
                      {item.addons.length} Addons
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAvailability(item);
                    }}
                    className={`p-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1 ${
                      item.isAvailable
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        In Stock
                      </>
                    ) : (
                      'Sold Out'
                    )}
                  </button>

                  <button
                    onClick={() => openModal(item)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-[#F4F3F2]">
              <h3 className="font-black text-xl text-[#013E37]">
                {editingItem ? 'Edit Item' : 'New Item'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-black/5 rounded-full text-[#013E37]"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto"
            >
              {/* IMAGE UPLOAD SECTION */}
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="w-full h-40 bg-[#F4F3F2] border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                  {formData.image ? (
                    <>
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-transform active:scale-95"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <ImageIcon size={40} />
                      <span className="text-xs font-medium mt-2">
                        No Image Selected
                      </span>
                    </div>
                  )}
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
                      <Loader2 className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <label
                  className={`cursor-pointer bg-[#013E37] hover:bg-[#022c27] text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-[#013E37]/20 ${
                    uploadingImg ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Camera size={16} />
                  {uploadingImg
                    ? 'Processing...'
                    : formData.image
                    ? 'Change Photo'
                    : 'Upload Photo'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImg}
                  />
                </label>
              </div>

              {/* INPUTS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#013E37] uppercase mb-1.5 ml-1">
                    Category
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-700 focus:outline-none focus:border-[#013E37]"
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const newSubs =
                        MENU_STRUCTURE[newCat]?.subcategories || [];
                      setFormData({
                        ...formData,
                        category: newCat,
                        subcategory: newSubs[0] || '',
                        variants: [],
                        addons: [],
                        choiceOptions: [],
                        choiceTitle: 'Choose 1 Dip',
                      });
                    }}
                  >
                    {Object.keys(MENU_STRUCTURE).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#013E37] uppercase mb-1.5 ml-1">
                    Subcategory
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-700 focus:outline-none focus:border-[#013E37]"
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subcategory: e.target.value })
                    }
                  >
                    {currentSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#013E37] uppercase mb-1.5 ml-1">
                    Item Name
                  </label>
                  <input
                    required
                    className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#013E37]"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Spanish Latte"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#013E37] uppercase mb-1.5 ml-1">
                    Price (₱)
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full p-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#013E37]"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#013E37] uppercase mb-1.5 ml-1">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#013E37]"
                  rows="2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Short description..."
                />
              </div>

              {/* VARIANTS (Drinks Only) */}
              {showVariants && (
                <div className="bg-[#C8A165]/10 p-4 rounded-xl border border-[#C8A165]/20">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black text-[#C8A165] uppercase tracking-wider">
                      Variants
                    </label>
                    {formData.variants.length > 0 && (
                      <button
                        type="button"
                        onClick={clearVariants}
                        className="text-[10px] text-red-500 font-bold underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {formData.variants.length === 0 ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => applyVariantPreset('hot_cold')}
                        className="w-full bg-white border border-[#C8A165]/30 text-[#013E37] py-2.5 rounded-lg text-xs font-bold hover:bg-[#C8A165]/20 transition flex items-center justify-center gap-1"
                      >
                        <Flame size={12} className="text-orange-500" /> Hot /{' '}
                        <Snowflake size={12} className="text-blue-500" /> Iced
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.variants.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#C8A165]/20 text-xs shadow-sm"
                        >
                          <span className="font-bold text-[#013E37]">
                            {v.name}
                          </span>
                          <span className="text-gray-500 font-bold">
                            ₱{v.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- INCLUDED CHOICES (Meals Only) --- */}
              {showChoices && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <CheckCircle2 size={16} />
                    </span>
                    <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                      Included Choice (Free)
                    </label>
                  </div>

                  <p className="text-[10px] text-gray-500 mb-3">
                    Select which Dips are available for this meal (Included in
                    Price).
                  </p>

                  <div className="mb-3">
                    <input
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-medium focus:border-indigo-500 outline-none"
                      placeholder="Title: e.g. Choose 1 Dip"
                      value={formData.choiceTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          choiceTitle: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* PRE-DEFINED DIPS SELECTION */}
                  <div className="grid grid-cols-2 gap-2">
                    {DIP_OPTIONS.map((dip) => {
                      const isSelected = formData.choiceOptions.includes(dip);
                      return (
                        <button
                          key={dip}
                          type="button"
                          onClick={() => toggleDipOption(dip)}
                          className={`text-xs p-2.5 rounded-lg transition-colors text-left border font-medium ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare size={14} />
                            ) : (
                              <Square size={14} />
                            )}
                            {dip}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ADD-ONS SECTION */}
              <div className="bg-[#013E37]/5 p-4 rounded-xl border border-[#013E37]/10">
                <label className="block text-xs font-black text-[#013E37] uppercase tracking-wider mb-3">
                  Include Add-ons (
                  {formData.category === 'Coffee & Drinks' ? 'Drinks' : 'Meals'}
                  ):
                </label>
                {currentDefaultAddons.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {currentDefaultAddons.map((addon) => {
                      const isSelected = formData.addons.some(
                        (a) => a.name === addon.name
                      );
                      return (
                        <button
                          key={addon.name}
                          type="button"
                          onClick={() => toggleStandardAddon(addon)}
                          className={`flex items-center gap-2 text-xs p-2.5 rounded-lg transition-colors text-left border ${
                            isSelected
                              ? 'bg-[#013E37] text-white border-[#013E37] font-bold shadow-md'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="shrink-0" />
                          ) : (
                            <Square size={16} className="shrink-0" />
                          )}
                          <div className="leading-tight">
                            <div>{addon.name}</div>
                            <div
                              className={`text-[10px] ${
                                isSelected ? 'text-white/70' : 'text-gray-400'
                              }`}
                            >
                              +₱{addon.price}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No standard add-ons for this category.
                  </p>
                )}
              </div>

              {/* AVAILABILITY & BUTTONS */}
              <div className="flex items-center gap-3 mt-1 select-none cursor-pointer bg-gray-50 p-4 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-[#013E37] rounded focus:ring-[#013E37] cursor-pointer"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                />
                <span className="text-sm font-bold text-[#013E37]">
                  Available for ordering
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-200 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImg}
                  className="flex-[2] bg-[#013E37] text-white py-4 rounded-xl font-bold hover:bg-[#022c27] transition flex justify-center items-center gap-2 shadow-xl shadow-[#013E37]/20 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Save size={18} /> Save Item
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
