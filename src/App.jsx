import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  Coffee,
  Truck,
  MapPin,
  Clock,
  RefreshCw,
  Navigation,
  User,
  LogOut,
  AlertTriangle,
  History,
  MessageCircle,
  LayoutGrid,
  Users,
  ClipboardList,
  ChevronRight,
  XCircle,
  Phone,
  CheckCircle,
  Package,
  Megaphone // Added here
} from 'lucide-react';

import { GOOGLE_SCRIPT_URL, ADMIN_SECRET } from './firebase';
import {
  normalizeStatus,
  formatTime,
  formatTargetTime,
  getModeColor,
} from './utils';

import { LoginScreen } from './components/LoginScreen';
import { ChatWindow } from './components/ChatWindow';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { LogoutModal } from './components/LogoutModal';
import { MenuManager } from './components/MenuManager';
import { StaffManager } from './components/StaffManager';
import { AnnouncementManager } from './components/AnnouncementManager'; 

// --- SKELETON COMPONENT ---
const SkeletonCard = () => (
  <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 animate-pulse flex flex-col h-full">
    <div className="flex justify-between mb-6">
      <div className="space-y-3">
        <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
        <div className="h-3 w-32 bg-gray-100 rounded-md"></div>
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="space-y-4 flex-1">
      <div className="h-4 w-full bg-gray-100 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
    </div>
    <div className="mt-6 h-12 w-full bg-gray-200 rounded-xl"></div>
  </div>
);

// --- SAFE ORDER ITEM PARSER ---
const OrderItem = ({ line }) => {
  // CRASH-PROOF PARSING
  const parseLine = (str) => {
    try {
      if (!str || typeof str !== 'string') return { raw: str };
      if (!str.match(/^\d+x/)) return { raw: str };

      let cleanStr = str;
      let addons = [];
      let variant = null;
      let navAction = null;

      // 1. Extract N/A Action
      const naMatch = cleanStr.match(/\{If N\/A:\s+(.*?)\}/);
      if (naMatch) {
        navAction = naMatch[1];
        cleanStr = cleanStr.replace(naMatch[0], '').trim();
      }

      // 2. Extract Addons
      const addonMatch = cleanStr.match(/\(\+\s+(.*?)\)$/);
      if (addonMatch) {
        addons = addonMatch[1].split(',').map((s) => s.trim());
        cleanStr = cleanStr.replace(addonMatch[0], '').trim();
      }

      // 3. Extract Variant
      const variantMatch = cleanStr.match(/\[(.*?)\]/);
      if (variantMatch) {
        variant = variantMatch[1];
        cleanStr = cleanStr.replace(variantMatch[0], '').trim();
      }

      // 4. Extract Quantity & Name
      const parts = cleanStr.split(' ');
      const qty = parts[0].replace('x', '');
      const name = parts.slice(1).join(' ');

      return { qty, name, variant, addons, navAction, raw: null };
    } catch (e) {
      console.error('Parse Error', e);
      return { raw: str }; // Fallback to raw text if error
    }
  };

  // Helper to style the "If N/A" action
  const getNaStyle = (action) => {
    if (!action) return null;
    const act = action.toLowerCase();
    if (act.includes('remove') || act.includes('cancel'))
      return {
        icon: <XCircle size={10} />,
        text: 'Remove',
        color: 'text-red-600 bg-red-50 border-red-100',
      };
    if (act.includes('call'))
      return {
        icon: <Phone size={10} />,
        text: 'Call',
        color: 'text-blue-600 bg-blue-50 border-blue-100',
      };
    if (act.includes('replace'))
      return {
        icon: <RefreshCw size={10} />,
        text: 'Replace',
        color: 'text-orange-600 bg-orange-50 border-orange-100',
      };
    return {
      icon: <AlertTriangle size={10} />,
      text: action,
      color: 'text-gray-600 bg-gray-50 border-gray-100',
    };
  };

  // Helper to style HOT vs COLD
  const getVariantStyle = (variant) => {
    if (!variant) return null;
    const v = variant.toLowerCase();
    if (v === 'hot') return 'bg-red-100 text-red-700 border-red-200';
    if (v.includes('cold') || v.includes('iced'))
      return 'bg-blue-100 text-blue-700 border-blue-200'; // Safe Blue
    return 'bg-orange-50 text-orange-700 border-orange-100';
  };

  const item = parseLine(line);

  if (item.raw)
    return (
      <div className="text-gray-600 py-1 font-medium text-sm border-b border-dashed border-gray-100 last:border-0">
        {item.raw}
      </div>
    );

  const naStyle = item.navAction ? getNaStyle(item.navAction) : null;

  return (
    <div className="py-3 border-b border-dashed border-gray-100 last:border-0 group">
      <div className="flex items-start gap-3">
        {/* Quantity */}
        <div className="bg-[#013E37]/5 text-[#013E37] font-black text-sm w-6 h-6 flex items-center justify-center rounded-md shrink-0 mt-0.5 shadow-sm">
          {item.qty}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-800 text-sm leading-snug">
              {item.name}
            </span>

            {/* Variant Badge */}
            {item.variant && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${getVariantStyle(
                  item.variant
                )}`}
              >
                {item.variant}
              </span>
            )}
          </div>

          {/* Add-ons List */}
          {item.addons.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.addons.map((addon, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
                >
                  <span className="text-[#C8A165] font-bold">+</span> {addon}
                </span>
              ))}
            </div>
          )}

          {/* If N/A Action */}
          {naStyle && (
            <div
              className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide w-fit ${naStyle.color}`}
            >
              {naStyle.icon}
              <span>If N/A: {naStyle.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [currentView, setCurrentView] = useState('orders');
  
  // --- NEW: Announcement State ---
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // --- NEW: Tracks specific order being updated to show spinner ---
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const isUpdatingRef = useRef(false);

  // --- FETCHING ---
  const fetchOrders = async (isBackground = false) => {
    if (currentView !== 'orders' && !isBackground) return;
    if (isUpdatingRef.current) return;

    if (!isBackground && orders.length === 0) setLoading(true);
    if (!isBackground && orders.length > 0) setIsRefreshing(true);

    try {
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?action=getOrders&secret=${ADMIN_SECRET}&_=${Date.now()}`,
        { method: 'GET', redirect: 'follow', credentials: 'omit' }
      );
      if (!response.ok) throw new Error('Network Error');
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data && data.orders) {
        setOrders(Array.isArray(data.orders) ? data.orders.reverse() : []);
        setErrorMsg(null);
      }
    } catch (error) {
      console.error(error);
      if (orders.length > 0) setErrorMsg('Connection Issue. Retrying...');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- POLLING ---
  useEffect(() => {
    if (currentUser && currentView === 'orders') {
      fetchOrders(false);
      const interval = setInterval(() => {
        if (!document.hidden) fetchOrders(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, currentView]);

  // --- FIXED: UPDATE STATUS WITH SPINNER LOGIC ---
  const updateStatus = async (orderId, newStatus) => {
    // 1. Set loading state for specific button
    setUpdatingOrderId(orderId);
    isUpdatingRef.current = true;

    // 2. Optimistic UI Update
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'updateStatus',
          secret: ADMIN_SECRET,
          orderId,
          status: newStatus,
          user: currentUser.name,
        }),
      });

      // 3. Wait a bit, then refresh
      setTimeout(async () => {
        await fetchOrders(true);
        isUpdatingRef.current = false;
        setUpdatingOrderId(null); // Stop spinner
      }, 2000);
    } catch (e) {
      alert('Sync failed');
      isUpdatingRef.current = false;
      setUpdatingOrderId(null);
      fetchOrders(true);
    }
  };

  const activeOrders = orders.filter((o) => {
    const s = normalizeStatus(o.status);
    return s !== 'delivered' && s !== 'cancelled';
  });

  const getStatusBadge = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'placed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ontheway':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'arrived':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // --- PERMISSION HELPERS ---
  const role = (currentUser?.role || '').toLowerCase();

  // Now checks for 'admin' regardless of capitalization
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  
  const isKitchen = role === 'barista' || role === 'kitchen';
  const isRider = role === 'rider';

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-[#F4F3F2] font-sans text-[#013E37] pb-20">
      {/* HEADER */}
      <header className="bg-[#013E37] sticky top-0 z-30 shadow-xl shadow-[#013E37]/10 transition-all">
        <div className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentUser.image ? (
                <img
                  loading="lazy"
                  src={currentUser.image}
                  alt="Profile"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-[#C8A165]"
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-[#F4F3F2]">
                  <User size={20} />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#C8A165] border-2 border-[#013E37] rounded-full"></div>
            </div>
            <div>
              <h1 className="font-sans font-bold text-base md:text-lg text-[#F4F3F2] leading-none">
                {currentUser.name}
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-[#C8A165] uppercase tracking-widest mt-1 opacity-90">
                {currentUser.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {currentView === 'orders' && (
              <>
                <button
                  onClick={() => setShowHistory(true)}
                  className="p-2.5 rounded-xl bg-white/10 text-[#F4F3F2] hover:bg-white/20 transition-all border border-white/5 backdrop-blur-sm"
                >
                  <History size={18} />
                </button>
                <button
                  onClick={() => fetchOrders(false)}
                  disabled={isRefreshing}
                  className={`p-2.5 rounded-xl bg-white/10 text-[#F4F3F2] hover:bg-white/20 transition-all border border-white/5 backdrop-blur-sm ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw size={18} />
                </button>
              </>
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2.5 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/10 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        {isOwnerOrAdmin && (
          <div className="px-4 md:px-6 flex gap-2 overflow-x-auto no-scrollbar pt-2 pb-0">
            {['orders', 'menu', 'staff'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCurrentView(tab)}
                className={`py-2 px-4 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 capitalize ${
                  currentView === tab
                    ? 'bg-[#F4F3F2] text-[#013E37]'
                    : 'bg-[#013E37] text-[#F4F3F2]/60 hover:text-[#F4F3F2] hover:bg-white/5'
                }`}
              >
                {tab === 'orders' && <ClipboardList size={14} />}
                {tab === 'menu' && <LayoutGrid size={14} />}
                {tab === 'staff' && <Users size={14} />}
                {tab}
              </button>
            ))}
            
            {/* 👇 MAKE SURE THIS BUTTON IS HERE 👇 */}
            <button
              onClick={() => setShowAnnouncement(true)}
              className="py-2 px-4 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 capitalize bg-[#013E37] text-[#F4F3F2]/60 hover:text-[#C8A165] hover:bg-white/5"
            >
              <Megaphone size={14} /> Alerts
            </button>
          </div>
        )}
      </header>

      {errorMsg && currentView === 'orders' && (
        <div className="max-w-[1600px] mx-auto px-4 mt-4 animate-slideDown">
          <div className="p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold shadow-sm">
            <AlertTriangle size={18} /> {errorMsg}
          </div>
        </div>
      )}

      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        {currentView === 'menu' && <MenuManager />}
        {currentView === 'staff' && <StaffManager />}

        {currentView === 'orders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
            ) : activeOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-50">
                <div className="w-20 h-20 bg-[#013E37]/10 rounded-full flex items-center justify-center mb-4">
                  <Coffee size={40} className="text-[#013E37]" />
                </div>
                <p className="font-black text-xl text-[#013E37]">
                  All caught up!
                </p>
                <p className="text-sm font-medium text-[#013E37]/60">
                  Waiting for new orders...
                </p>
              </div>
            ) : (
              activeOrders
                .filter((o) =>
                  isRider
                    ? ['preparing', 'ontheway', 'arrived'].includes(
                        normalizeStatus(o.status)
                      )
                    : true
                )
                .map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(1,62,55,0.1)] transition-all duration-300 flex flex-col animate-fade-in overflow-hidden border border-gray-100"
                  >
                    <div className="p-5 border-b border-dashed border-gray-200 bg-gray-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-black text-xl text-[#013E37]">
                              #{String(order.orderId || '').slice(-4)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getModeColor(
                                order.mode
                              )}`}
                            >
                              {order.mode}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-2xl text-[#013E37]">
                            ₱{order.total}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {order.payment}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#013E37]">
                        <User size={14} className="text-[#C8A165]" />{' '}
                        {order.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-1 pl-0.5">
                        <Clock size={12} /> {formatTime(order.timestamp)}
                        {order.time && (
                          <span className="text-[#013E37] font-bold">
                            • {formatTargetTime(order.time)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isRider && (
                      <div className="px-5 pt-4">
                        <div className="bg-[#F4F3F2] rounded-xl p-3 border border-[#013E37]/10">
                          <div className="flex items-start gap-3">
                            <MapPin
                              size={16}
                              className="text-[#013E37] mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#013E37] leading-snug line-clamp-2">
                                {order.address}
                              </p>
                              {order.landmark && (
                                <p className="text-[10px] text-[#C8A165] font-bold mt-0.5">
                                  Note: {order.landmark}
                                </p>
                              )}
                            </div>
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(
                              order.address || ''
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 bg-white text-[#013E37] w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-gray-200 shadow-sm hover:bg-[#013E37] hover:text-white transition-colors"
                          >
                            <Navigation size={14} /> Open Maps
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="space-y-1">
                        {(order.items || '').split('\n').map((line, idx) => (
                          <OrderItem key={idx} line={line} />
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 mt-auto border-t border-gray-100 flex flex-col gap-3">
                      {(isRider ||
                        ['ontheway', 'arrived'].includes(
                          normalizeStatus(order.status)
                        )) && (
                        <button
                          onClick={() => setActiveChatOrder(order)}
                          className="w-full bg-white border border-blue-200 text-blue-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                        >
                          <MessageCircle size={14} /> Message Customer
                        </button>
                      )}

                      {/* --- KITCHEN ACTIONS (WITH SPINNERS) --- */}
                      {(isKitchen || isOwnerOrAdmin) && (
                        <>
                          {normalizeStatus(order.status) === 'placed' && (
                            <button
                              onClick={() =>
                                updateStatus(order.orderId, 'Preparing')
                              }
                              disabled={updatingOrderId === order.orderId}
                              className="w-full bg-[#013E37] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#013E37]/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                            >
                              {updatingOrderId === order.orderId ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <>
                                  <Coffee size={18} /> Start Preparing
                                </>
                              )}
                            </button>
                          )}
                          {normalizeStatus(order.status) === 'preparing' && (
                            <button
                              onClick={() =>
                                updateStatus(order.orderId, 'On the Way')
                              }
                              disabled={updatingOrderId === order.orderId}
                              className="w-full bg-[#C8A165] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#C8A165]/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                            >
                              {updatingOrderId === order.orderId ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <>
                                  <Truck size={18} /> Ready for Pickup
                                </>
                              )}
                            </button>
                          )}
                          {normalizeStatus(order.status) === 'ontheway' && (
                            <div className="w-full text-center text-gray-400 py-3 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-200 rounded-xl bg-gray-50">
                              <Truck size={14} /> With Rider
                            </div>
                          )}
                          {normalizeStatus(order.status) === 'arrived' && (
                            <div className="w-full text-center text-[#013E37] py-3 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 bg-[#013E37]/10 rounded-xl border border-[#013E37]/20">
                              <MapPin size={14} /> Rider Arrived
                            </div>
                          )}
                        </>
                      )}

                      {/* --- RIDER ACTIONS (WITH SPINNERS) --- */}
                      {(isRider || isOwnerOrAdmin) && (
                        <div className="grid grid-cols-1 gap-3">
                          {normalizeStatus(order.status) === 'preparing' && (
                            <button
                              onClick={() =>
                                updateStatus(order.orderId, 'On the Way')
                              }
                              disabled={updatingOrderId === order.orderId}
                              className="w-full bg-[#013E37] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#013E37]/20 active:scale-[0.98] flex justify-center items-center"
                            >
                              {updatingOrderId === order.orderId ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                'Confirm Pickup'
                              )}
                            </button>
                          )}
                          {(normalizeStatus(order.status) === 'ontheway' ||
                            normalizeStatus(order.status) === 'arrived') && (
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() =>
                                  updateStatus(order.orderId, 'Arrived')
                                }
                                disabled={
                                  normalizeStatus(order.status) === 'arrived' ||
                                  updatingOrderId === order.orderId
                                }
                                className={`py-3.5 rounded-xl font-bold border transition-all active:scale-[0.98] flex justify-center items-center ${
                                  normalizeStatus(order.status) === 'arrived'
                                    ? 'bg-gray-100 text-gray-400 border-transparent'
                                    : 'bg-white text-[#013E37] border-[#013E37] shadow-sm'
                                }`}
                              >
                                {updatingOrderId === order.orderId ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : normalizeStatus(order.status) ===
                                  'arrived' ? (
                                  'Notified'
                                ) : (
                                  "I'm Here"
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(order.orderId, 'Delivered')
                                }
                                disabled={updatingOrderId === order.orderId}
                                className="bg-[#013E37] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#013E37]/20 active:scale-[0.98] flex justify-center items-center"
                              >
                                {updatingOrderId === order.orderId ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  'Complete'
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </main>

      {showHistory && (
        <OrderHistoryModal
          orders={orders}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showLogoutConfirm && (
        <LogoutModal
          onConfirm={() => {
            setCurrentUser(null);
            setShowLogoutConfirm(false);
            setCurrentView('orders');
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      {activeChatOrder && (
        <ChatWindow
          orderId={activeChatOrder.orderId}
          currentUser={currentUser}
          closeChat={() => setActiveChatOrder(null)}
        />
      )}

      {/* --- NEW: Announcement Modal --- */}
      {showAnnouncement && (
        <AnnouncementManager onClose={() => setShowAnnouncement(false)} />
      )}
    </div>
  );
}