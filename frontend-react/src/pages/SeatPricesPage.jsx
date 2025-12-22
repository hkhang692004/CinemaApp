import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Armchair, 
  Loader2, 
  Save,
  AlertCircle,
  Crown,
  Heart,
  Accessibility
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch seat type prices
const fetchSeatPrices = async () => {
  const response = await api.get('/theaters/seat-prices');
  return response.data.prices;
};

// Seat type icons and colors
const seatTypeConfig = {
  Standard: {
    icon: Armchair,
    color: 'bg-blue-100 text-blue-600',
    bgCard: 'bg-blue-50 border-blue-200',
    label: 'Ghế thường'
  },
  VIP: {
    icon: Crown,
    color: 'bg-amber-100 text-amber-600',
    bgCard: 'bg-amber-50 border-amber-200',
    label: 'Ghế VIP'
  },
  Couple: {
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    bgCard: 'bg-pink-50 border-pink-200',
    label: 'Ghế đôi'
  },
  Wheelchair: {
    icon: Accessibility,
    color: 'bg-green-100 text-green-600',
    bgCard: 'bg-green-50 border-green-200',
    label: 'Ghế khuyết tật'
  }
};

const SeatPricesPage = () => {
  const queryClient = useQueryClient();
  const [editingPrices, setEditingPrices] = useState({});
  const [basePrice, setBasePrice] = useState(75000); // Giá cơ bản để tính ví dụ

  // Query
  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['seat-prices'],
    queryFn: fetchSeatPrices,
  });

  // Initialize editing prices when data loads
  useEffect(() => {
    if (prices.length > 0) {
      const initial = {};
      prices.forEach(p => {
        initial[p.seat_type] = {
          price_multiplier: p.price_multiplier,
          extra_fee: p.extra_fee,
          description: p.description || ''
        };
      });
      setEditingPrices(initial);
    }
  }, [prices]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ seatType, data }) => 
      api.put(`/theaters/seat-prices/${seatType}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seat-prices'] });
      toast.success('Đã cập nhật giá ghế');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật giá');
    }
  });

  const handleChange = (seatType, field, value) => {
    setEditingPrices(prev => ({
      ...prev,
      [seatType]: {
        ...prev[seatType],
        [field]: value
      }
    }));
  };

  const handleSave = (seatType) => {
    const data = editingPrices[seatType];
    if (!data) {
      toast.error('Dữ liệu không hợp lệ');
      return;
    }
    updateMutation.mutate({ 
      seatType, 
      data: {
        price_multiplier: parseFloat(data.price_multiplier) || 1,
        extra_fee: parseFloat(data.extra_fee) || 0,
        description: data.description || ''
      }
    });
  };

  const calculateFinalPrice = (multiplier, extraFee) => {
    return basePrice * parseFloat(multiplier || 1) + parseFloat(extraFee || 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Giá Ghế</h1>
        <p className="text-gray-500 mt-1">Cấu hình hệ số giá và phụ thu cho từng loại ghế</p>
      </div>

      {/* Price Calculator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Công cụ tính giá</h2>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giá vé cơ bản (base_price)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                step="5000"
              />
              <span className="text-gray-500">VNĐ</span>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Công thức:</strong> Giá cuối = base_price × hệ số + phụ thu
            </p>
            <p className="text-xs text-gray-500">
              Ví dụ: {formatCurrency(basePrice)} × 1.5 + 0 = {formatCurrency(basePrice * 1.5)}
            </p>
          </div>
        </div>
      </div>

      {/* Seat Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prices.map((price) => {
          const config = seatTypeConfig[price.seat_type] || seatTypeConfig.Standard;
          const Icon = config.icon;
          const editing = editingPrices[price.seat_type] || {
            price_multiplier: price.price_multiplier,
            extra_fee: price.extra_fee,
            description: price.description || ''
          };
          const finalPrice = calculateFinalPrice(editing.price_multiplier, editing.extra_fee);

          return (
            <div
              key={price.seat_type}
              className={`rounded-xl border-2 overflow-hidden ${config.bgCard}`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{config.label}</h3>
                    <p className="text-sm text-gray-500">{price.seat_type}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-gray-500">Giá tính toán</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(finalPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4">
                {/* Multiplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hệ số giá (multiplier)
                  </label>
                  <input
                    type="number"
                    value={editing.price_multiplier}
                    onChange={(e) => handleChange(price.seat_type, 'price_multiplier', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    step="0.1"
                    min="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1.0 = giá gốc, 1.5 = tăng 50%, 2.0 = gấp đôi
                  </p>
                </div>

                {/* Extra Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phụ thu cố định (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={editing.extra_fee}
                    onChange={(e) => handleChange(price.seat_type, 'extra_fee', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    step="5000"
                    min="0"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    value={editing.description}
                    onChange={(e) => handleChange(price.seat_type, 'description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Mô tả loại ghế..."
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={() => handleSave(price.seat_type)}
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">Hướng dẫn</p>
          <ul className="text-blue-600 text-sm mt-1 space-y-1 list-disc list-inside">
            <li><strong>Hệ số giá:</strong> Nhân với giá cơ bản của suất chiếu</li>
            <li><strong>Phụ thu:</strong> Cộng thêm vào sau khi nhân hệ số</li>
            <li>Giá cuối cùng = base_price × hệ số + phụ thu</li>
            <li>Thay đổi sẽ áp dụng cho tất cả suất chiếu mới</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SeatPricesPage;
