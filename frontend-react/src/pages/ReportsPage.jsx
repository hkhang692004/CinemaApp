import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Building2,
  Film,
  Download,
  Loader2,
  DollarSign,
  Ticket,
  Users,
  ShoppingCart,
  CalendarDays,
  FileSpreadsheet,
  UsersRound,
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';
import { socket, connectSocket, disconnectSocket, SOCKET_EVENTS } from '../config/socket';

// Helper functions for date formatting
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Parse dd/mm/yyyy to yyyy-mm-dd
const parseVietnameseDate = (str) => {
  if (!str) return null;
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = parseInt(day), m = parseInt(month), y = parseInt(year);
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Tính ngày tối đa (startDate + 30 ngày)
const getMaxEndDate = (startDate) => {
  if (!startDate) return '';
  const date = new Date(startDate);
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

// Custom DateInput component với format dd/mm/yyyy
const DateInput = ({ value, onChange, min, max, label }) => {
  const [inputValue, setInputValue] = useState(formatDateDisplay(value));
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    setInputValue(formatDateDisplay(value));
  }, [value]);

  const handleTextChange = (e) => {
    let val = e.target.value;
    // Auto-add slashes
    val = val.replace(/[^\d/]/g, '');
    if (val.length === 2 && !val.includes('/')) val += '/';
    if (val.length === 5 && val.split('/').length === 2) val += '/';
    if (val.length > 10) val = val.slice(0, 10);
    setInputValue(val);
  };

  const handleBlur = () => {
    const parsed = parseVietnameseDate(inputValue);
    if (parsed) {
      if (min && parsed < min) {
        toast.error('Ngày không được nhỏ hơn ngày tối thiểu');
        setInputValue(formatDateDisplay(value));
        return;
      }
      if (max && parsed > max) {
        toast.error('Ngày không được lớn hơn ngày tối đa');
        setInputValue(formatDateDisplay(value));
        return;
      }
      onChange(parsed);
    } else if (inputValue) {
      toast.error('Định dạng ngày không hợp lệ (dd/mm/yyyy)');
      setInputValue(formatDateDisplay(value));
    }
  };

  const handleCalendarClick = () => {
    hiddenInputRef.current?.showPicker?.();
  };

  const handleHiddenChange = (e) => {
    const newVal = e.target.value;
    if (newVal) {
      if (min && newVal < min) {
        toast.error('Ngày không được nhỏ hơn ngày tối thiểu');
        return;
      }
      if (max && newVal > max) {
        toast.error('Ngày không được lớn hơn ngày tối đa');
        return;
      }
      onChange(newVal);
      setInputValue(formatDateDisplay(newVal));
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        placeholder="dd/mm/yyyy"
        className="px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 w-36"
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        className="absolute right-2 text-gray-400 hover:text-gray-600"
      >
        <CalendarDays size={18} />
      </button>
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={handleHiddenChange}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
};

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate()
  });
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [theaterData, setTheaterData] = useState([]);
  const [movieData, setMovieData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }

  const loadReportData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
          const overviewRes = await api.get('/reports/overview', {
            params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
          });
          setOverviewData(overviewRes.data);
          break;
        case 'theaters':
          const theaterRes = await api.get('/reports/theaters', {
            params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
          });
          setTheaterData(theaterRes.data.theaters || []);
          break;
        case 'movies':
          const movieRes = await api.get('/reports/movies', {
            params: { startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 20 }
          });
          setMovieData(movieRes.data.movies || []);
          break;
        case 'monthly':
          const monthlyRes = await api.get('/reports/monthly', { params: { year } });
          setMonthlyData(monthlyRes.data.months || []);
          break;
      }
    } catch (error) {
      console.error('Error loading report:', error);
      if (!silent) toast.error('Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, year]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Socket realtime updates
  useEffect(() => {
    connectSocket();

    const onStatsUpdated = (data) => {
      console.log('📊 Reports: Stats updated', data);
      // Reload report data silently
      loadReportData(true);
    };

    const onOrderPaid = (data) => {
      console.log('💰 Reports: Order paid', data);
      loadReportData(true);
    };

    socket.on(SOCKET_EVENTS.STATS_UPDATED, onStatsUpdated);
    socket.on(SOCKET_EVENTS.ORDER_PAID, onOrderPaid);

    return () => {
      socket.off(SOCKET_EVENTS.STATS_UPDATED, onStatsUpdated);
      socket.off(SOCKET_EVENTS.ORDER_PAID, onOrderPaid);
    };
  }, [loadReportData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleExport = async () => {
    try {
      toast.loading('Đang tạo PDF...', { id: 'export-pdf' });
      
      const params = new URLSearchParams();
      params.append('type', activeTab);
      params.append('format', 'pdf');
      
      if (activeTab === 'monthly') {
        params.append('year', year.toString());
      } else {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      const response = await api.get(`/reports/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao-cao-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Xuất báo cáo PDF thành công!', { id: 'export-pdf' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Không thể xuất báo cáo', { id: 'export-pdf' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'theaters', label: 'Theo rạp', icon: Building2 },
    { id: 'movies', label: 'Theo phim', icon: Film },
    { id: 'monthly', label: 'Theo tháng', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo</h1>
          <p className="text-gray-500">Phân tích doanh thu và hoạt động kinh doanh</p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet size={18} />
          Xuất báo cáo
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Date Filter */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {activeTab === 'monthly' ? (
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Năm:</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Từ:</label>
                <DateInput
                  value={dateRange.startDate}
                  max={dateRange.endDate}
                  onChange={(newStart) => {
                    // Nếu endDate quá xa (> 30 ngày), tự động điều chỉnh
                    const maxEnd = getMaxEndDate(newStart);
                    const today = new Date().toISOString().split('T')[0];
                    let newEnd = dateRange.endDate;
                    
                    if (dateRange.endDate > maxEnd) {
                      newEnd = maxEnd > today ? today : maxEnd;
                    }
                    if (newStart > newEnd) {
                      newEnd = newStart;
                    }
                    
                    setDateRange({ startDate: newStart, endDate: newEnd });
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Đến:</label>
                <DateInput
                  value={dateRange.endDate}
                  min={dateRange.startDate}
                  max={getMaxEndDate(dateRange.startDate)}
                  onChange={(newEnd) => {
                    setDateRange({ ...dateRange, endDate: newEnd });
                  }}
                />
              </div>
              <div className="text-xs text-gray-400">
                (Tối đa 30 ngày)
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => {
                    const today = new Date();
                    const last7 = new Date();
                    last7.setDate(today.getDate() - 7);
                    setDateRange({
                      startDate: last7.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  7 ngày
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const last30 = new Date();
                    last30.setDate(today.getDate() - 30);
                    setDateRange({
                      startDate: last30.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  30 ngày
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    setDateRange({
                      startDate: firstDayOfMonth.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    });
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Tháng này
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && overviewData && (
                <OverviewTab data={overviewData} formatCurrency={formatCurrency} />
              )}
              {activeTab === 'theaters' && (
                <TheatersTab data={theaterData} formatCurrency={formatCurrency} />
              )}
              {activeTab === 'movies' && (
                <MoviesTab data={movieData} formatCurrency={formatCurrency} />
              )}
              {activeTab === 'monthly' && (
                <MonthlyTab data={monthlyData} year={year} formatCurrency={formatCurrency} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ data, formatCurrency }) => {
  const maxRevenue = Math.max(...(data.dailyData?.map(d => d.revenue) || [1]), 1);
  
  // Format số tiền rút gọn cho trục Y
  const formatShortCurrency = (value) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-green-600">Tổng doanh thu</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(data.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <ShoppingCart className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-600">Doanh thu đặt vé</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(data.totalOrderRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <UsersRound className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-amber-600">Doanh thu đặt nhóm</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(data.totalGroupRevenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Ticket className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-purple-600">Tổng vé bán</p>
              <p className="text-xl font-bold text-purple-700">{data.totalTickets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <ShoppingCart className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-indigo-600">Tổng đơn hàng</p>
              <p className="text-xl font-bold text-indigo-700">{data.totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-rose-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100">
              <UsersRound className="text-rose-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-rose-600">Tổng đặt nhóm</p>
              <p className="text-xl font-bold text-rose-700">{data.totalGroupBookings || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Users className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-orange-600">Khách hàng</p>
              <p className="text-xl font-bold text-orange-700">{data.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Chart - Clean and Beautiful */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800 text-lg">Doanh thu theo ngày</h3>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Tổng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Đặt vé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-amber-500"></div>
              <span className="text-gray-600">Đặt nhóm</span>
            </div>
          </div>
        </div>
        
        {data.dailyData?.length > 0 ? (
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-14 flex flex-col justify-between text-right pr-2">
              <span className="text-xs text-gray-400">{formatShortCurrency(maxRevenue)}</span>
              <span className="text-xs text-gray-400">{formatShortCurrency(maxRevenue * 0.75)}</span>
              <span className="text-xs text-gray-400">{formatShortCurrency(maxRevenue * 0.5)}</span>
              <span className="text-xs text-gray-400">{formatShortCurrency(maxRevenue * 0.25)}</span>
              <span className="text-xs text-gray-400">0</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-14 relative h-[280px]">
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="border-t border-gray-100 w-full" />
                ))}
              </div>
              
              {/* Chart with fixed aspect ratio */}
              {(() => {
                const points = data.dailyData;
                const padding = 30; // Padding for edges
                const chartWidth = Math.max(points.length * 60, 500);
                const chartHeight = 250;
                const drawWidth = chartWidth - padding * 2;
                const xStep = points.length > 1 ? drawWidth / (points.length - 1) : 0;
                const yScale = (chartHeight - 20) / maxRevenue; // Leave some top padding
                
                const getX = (i) => padding + i * xStep;
                const getY = (value) => chartHeight - 10 - (value || 0) * yScale;
                
                const totalPath = points.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue)}`).join(' ');
                const orderPath = points.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.orderRevenue)}`).join(' ');
                const groupPath = points.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.groupRevenue)}`).join(' ');
                
                return (
                  <div className="overflow-x-auto h-full">
                    <div style={{ width: `${chartWidth}px`, height: `${chartHeight}px` }} className="relative">
                      <svg width={chartWidth} height={chartHeight} className="absolute inset-0">
                        {/* Lines */}
                        <path d={groupPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                        <path d={orderPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                        <path d={totalPath} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Data points */}
                        {points.map((d, i) => (
                          <g key={i}>
                            <circle cx={getX(i)} cy={getY(d.groupRevenue)} r="3" fill="#f59e0b" />
                            <circle cx={getX(i)} cy={getY(d.orderRevenue)} r="3" fill="#3b82f6" />
                            <circle cx={getX(i)} cy={getY(d.revenue)} r="5" fill="#ef4444" stroke="white" strokeWidth="2" />
                          </g>
                        ))}
                      </svg>
                      
                      {/* Hover areas with tooltips */}
                      {points.map((d, i) => {
                        const x = getX(i);
                        const date = new Date(d.date);
                        const isFirst = i < 2;
                        const isLast = i >= points.length - 2;
                        
                        // Tooltip positioning: left for first items, right for last items, center for middle
                        let tooltipStyle = {};
                        if (isFirst) {
                          tooltipStyle = { left: '0px', transform: 'none' };
                        } else if (isLast) {
                          tooltipStyle = { right: '0px', transform: 'none' };
                        } else {
                          tooltipStyle = { left: '50%', transform: 'translateX(-50%)' };
                        }
                        
                        return (
                          <div
                            key={i}
                            className="absolute top-0 h-full group"
                            style={{ left: `${x - 25}px`, width: '50px' }}
                          >
                            {/* Tooltip */}
                            <div 
                              className="absolute z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                              style={{ 
                                ...tooltipStyle,
                                top: `${Math.max(getY(d.revenue) - 100, 10)}px`,
                              }}
                            >
                              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">
                                {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                  <span className="text-gray-600">Tổng:</span>
                                  <span className="font-medium ml-auto">{formatCurrency(d.revenue)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                  <span className="text-gray-600">Vé:</span>
                                  <span className="font-medium ml-auto">{formatCurrency(d.orderRevenue || 0)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                                  <span className="text-gray-600">Nhóm:</span>
                                  <span className="font-medium ml-auto">{formatCurrency(d.groupRevenue || 0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* X-axis labels - sync with chart */}
            {(() => {
              const points = data.dailyData;
              const padding = 30;
              const chartWidth = Math.max(points.length * 60, 500);
              const drawWidth = chartWidth - padding * 2;
              const xStep = points.length > 1 ? drawWidth / (points.length - 1) : 0;
              const getX = (i) => padding + i * xStep;
              
              return (
                <div className="ml-14 mt-2 overflow-x-auto">
                  <div style={{ width: `${chartWidth}px` }} className="relative h-5">
                    {points.map((d, i) => {
                      const date = new Date(d.date);
                      const showLabel = points.length <= 15 || i % Math.ceil(points.length / 10) === 0 || i === 0 || i === points.length - 1;
                      return (
                        <span 
                          key={i} 
                          className={`absolute text-xs text-gray-400 ${showLabel ? '' : 'invisible'}`} 
                          style={{ 
                            left: `${getX(i)}px`, 
                            transform: 'translateX(-50%)'
                          }}
                        >
                          {date.getDate()}/{date.getMonth() + 1}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Không có dữ liệu trong khoảng thời gian này
          </div>
        )}
      </div>
    </div>
  );
};

// Theaters Tab Component
const TheatersTab = ({ data, formatCurrency }) => {
  const maxRevenue = Math.max(...data.map(t => t.revenue), 1);

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>
      ) : (
        data.map((theater, index) => (
          <div key={theater.theaterId} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{theater.theaterName}</h3>
                  <p className="text-sm text-gray-500">{theater.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{formatCurrency(theater.revenue)}</p>
                <div className="flex items-center gap-3 justify-end text-xs mt-1">
                  <span className="text-blue-600">
                    <span className="font-medium">Vé:</span> {formatCurrency(theater.orderRevenue || 0)}
                  </span>
                  <span className="text-amber-600">
                    <span className="font-medium">Nhóm:</span> {formatCurrency(theater.groupRevenue || 0)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {theater.tickets} vé • {theater.orders} đơn
                  {theater.groupBookings > 0 && ` • ${theater.groupBookings} nhóm`}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(theater.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Movies Tab Component
const MoviesTab = ({ data, formatCurrency }) => {
  return (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phim</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng DT</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">DT Vé</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">DT Nhóm</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vé</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nhóm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((movie, index) => (
              <tr key={movie.movieId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={movie.posterUrl || '/placeholder-movie.jpg'}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <span className="font-medium text-gray-800">{movie.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatCurrency(movie.revenue)}
                </td>
                <td className="px-4 py-3 text-right text-blue-600">
                  {formatCurrency(movie.orderRevenue || 0)}
                </td>
                <td className="px-4 py-3 text-right text-amber-600">
                  {formatCurrency(movie.groupRevenue || 0)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{movie.tickets}</td>
                <td className="px-4 py-3 text-right text-gray-600">{movie.groupBookings || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Monthly Tab Component
const MonthlyTab = ({ data, year, formatCurrency }) => {
  const maxRevenue = Math.max(...data.map(m => m.revenue), 1);
  const totalRevenue = data.reduce((sum, m) => sum + m.revenue, 0);
  const totalOrderRevenue = data.reduce((sum, m) => sum + (m.orderRevenue || 0), 0);
  const totalGroupRevenue = data.reduce((sum, m) => sum + (m.groupRevenue || 0), 0);
  const totalOrders = data.reduce((sum, m) => sum + m.orders, 0);
  const totalGroupBookings = data.reduce((sum, m) => sum + (m.groupBookings || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600">Tổng doanh thu năm {year}</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600">Doanh thu đặt vé</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalOrderRevenue)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-sm text-amber-600">Doanh thu đặt nhóm</p>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalGroupRevenue)}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-purple-600">Đơn hàng / Nhóm</p>
          <p className="text-2xl font-bold text-purple-700">{totalOrders} / {totalGroupBookings}</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo tháng</h3>
        <div className="h-64">
          <div className="flex items-end justify-between h-52 gap-2">
            {data.map((month) => {
              const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-44">
                    <span className="text-xs text-gray-600 mb-1">
                      {month.revenue > 0 ? (month.revenue / 1000000).toFixed(1) + 'M' : ''}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all duration-300 hover:from-red-600 hover:to-red-500 cursor-pointer min-h-[2px]"
                      style={{ height: `${Math.max(height, 1)}%` }}
                      title={`${month.monthName}: ${formatCurrency(month.revenue)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-500">T{month.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tháng</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng DT</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">DT Vé</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">DT Nhóm</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nhóm</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((month) => (
            <tr key={month.month} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{month.monthName}</td>
              <td className="px-4 py-3 text-right font-semibold text-green-600">
                {formatCurrency(month.revenue)}
              </td>
              <td className="px-4 py-3 text-right text-blue-600">
                {formatCurrency(month.orderRevenue || 0)}
              </td>
              <td className="px-4 py-3 text-right text-amber-600">
                {formatCurrency(month.groupRevenue || 0)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">{month.orders}</td>
              <td className="px-4 py-3 text-right text-gray-600">{month.groupBookings || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsPage;
