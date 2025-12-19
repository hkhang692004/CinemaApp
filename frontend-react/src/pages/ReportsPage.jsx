import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

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

  useEffect(() => {
    loadReportData();
  }, [activeTab, dateRange, year]);

  const loadReportData = async () => {
    setLoading(true);
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
      toast.error('Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
  const maxRevenue = Math.max(...(data.dailyData?.map(d => d.revenue) || [1]));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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
              <p className="text-sm text-blue-600">Tổng đơn hàng</p>
              <p className="text-xl font-bold text-blue-700">{data.totalOrders}</p>
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

      {/* Bar Chart */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo ngày</h3>
        {data.dailyData?.length > 0 ? (
          <div className="h-64">
            <div className="flex items-end justify-between h-52 gap-1">
              {data.dailyData.map((item, index) => {
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const date = new Date(item.date);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex flex-col items-center justify-end h-44">
                      <div
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all duration-300 hover:from-red-600 hover:to-red-500 cursor-pointer min-h-[2px]"
                        style={{ height: `${Math.max(height, 1)}%` }}
                        title={`${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}: ${formatCurrency(item.revenue)}`}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 truncate w-full text-center">
                      {date.getDate()}/{date.getMonth() + 1}
                    </div>
                  </div>
                );
              })}
            </div>
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
                <p className="text-sm text-gray-500">{theater.tickets} vé • {theater.orders} đơn</p>
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vé bán</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
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
                <td className="px-4 py-3 text-right text-gray-600">{movie.tickets}</td>
                <td className="px-4 py-3 text-right text-gray-600">{movie.orders}</td>
                <td className="px-4 py-3 text-right text-gray-600">{movie.customers}</td>
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
  const totalOrders = data.reduce((sum, m) => sum + m.orders, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600">Tổng doanh thu năm {year}</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600">Tổng đơn hàng năm {year}</p>
          <p className="text-2xl font-bold text-blue-700">{totalOrders}</p>
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
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((month) => (
            <tr key={month.month} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{month.monthName}</td>
              <td className="px-4 py-3 text-right font-semibold text-green-600">
                {formatCurrency(month.revenue)}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">{month.orders}</td>
              <td className="px-4 py-3 text-right text-gray-600">
                {totalRevenue > 0 ? ((month.revenue / totalRevenue) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsPage;
