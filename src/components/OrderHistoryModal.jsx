import React, { useState } from 'react';
import { X, Clock, Calendar, Search, ArrowUpRight, Coffee } from 'lucide-react';
import { normalizeStatus, formatTime } from '../utils';

export const OrderHistoryModal = ({ orders, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for delivered/cancelled orders only
  const historyOrders = orders.filter(o => 
    ['delivered', 'cancelled'].includes(normalizeStatus(o.status))
  ).reverse(); // Newest first

  const filteredOrders = historyOrders.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(o.orderId).includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#013E37]/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#F4F3F2] w-full max-w-4xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10">
        
        {/* HEADER */}
        <div className="bg-[#013E37] p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Order History</h2>
            <p className="text-[#C8A165] text-xs font-bold uppercase tracking-wider mt-1">
              Past Transactions
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-6 border-b border-[#013E37]/10 bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Customer Name or Order ID..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-[#013E37] focus:outline-none focus:border-[#013E37] transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <Clock size={32} className="text-gray-400" />
              </div>
              <p className="text-[#013E37] font-bold">No history found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.orderId} 
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow group"
              >
                {/* Left: Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${
                    normalizeStatus(order.status) === 'cancelled' 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-[#013E37]/5 text-[#013E37]'
                  }`}>
                    {normalizeStatus(order.status) === 'cancelled' ? '✕' : '✓'}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-[#013E37]">#{String(order.orderId).slice(-4)}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        normalizeStatus(order.status) === 'cancelled' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-600 flex items-center gap-2 mt-0.5">
                      {order.name}
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Calendar size={12} /> {new Date(order.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Details */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="block font-black text-xl text-[#013E37]">₱{order.total}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.payment}</span>
                  </div>
                  
                  {/* Items Preview (Tooltip style) */}
                  <div className="hidden md:block text-xs text-gray-400 w-32 truncate">
                    {order.items}
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-[#C8A165] group-hover:text-white transition-colors">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};