import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Save,
  Crown,
  Medal,
  Award,
  Users,
  Star,
  TrendingUp,
  Calculator
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'sonner';

// Fetch loyalty config
const fetchLoyaltyConfig = async () => {
  const response = await api.get('/loyalty/config');
  return response.data;
};

// Tier config
const tierConfig = {
  Silver: {
    icon: Medal,
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    bgCard: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
    iconBg: 'bg-gray-200',
    label: 'Bạc'
  },
  Gold: {
    icon: Award,
    color: 'bg-yellow-100 text-yellow-600 border-yellow-300',
    bgCard: 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200',
    iconBg: 'bg-yellow-200',
    label: 'Vàng'
  },
  Platinum: {
    icon: Crown,
    color: 'bg-purple-100 text-purple-600 border-purple-300',
    bgCard: 'bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200',
    iconBg: 'bg-purple-200',
    label: 'Bạch kim'
  }
};

const LoyaltyPage = () => {
  const queryClient = useQueryClient();
  const [editingTiers, setEditingTiers] = useState({});
  const [testAmount, setTestAmount] = useState(100000);

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-config'],
    queryFn: fetchLoyaltyConfig,
  });

  // Initialize editing state when data loads
  useEffect(() => {
    if (data?.tiers) {
      const initial = {};
      data.tiers.forEach(t => {
        initial[t.tier] = {
          min_yearly_spent: t.min_yearly_spent,
          points_per_1000: t.points_per_1000
        };
      });
      setEditingTiers(initial);
    }
  }, [data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (tiers) => api.put('/loyalty/tiers', { tiers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
      toast.success('Đã cập nhật cấu hình loyalty');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  });

  const handleChange = (tier, field, value) => {
    setEditingTiers(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value
      }
    }));
  };

  const handleSaveAll = () => {
    const tiers = Object.entries(editingTiers).map(([tier, data]) => ({
      tier,
      min_yearly_spent: parseFloat(data.min_yearly_spent) || 0,
      points_per_1000: parseFloat(data.points_per_1000) || 1
    }));
    updateMutation.mutate(tiers);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Calculate points for test amount
  const calculatePoints = (tier) => {
    const rate = parseFloat(editingTiers[tier]?.points_per_1000) || 1;
    return Math.floor(testAmount / 1000 * rate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const stats = data?.stats || { membersByTier: {}, totalMembers: 0, totalPoints: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cấu hình Thành viên</h1>
          <p className="text-gray-500 mt-1">Quản lý yêu cầu hạng và tỷ lệ tích điểm</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu thay đổi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng thành viên</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalMembers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-200 rounded-lg">
              <Medal className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hạng Bạc</p>
              <p className="text-xl font-bold text-gray-600">{stats.membersByTier?.Silver || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hạng Vàng</p>
              <p className="text-xl font-bold text-yellow-600">{stats.membersByTier?.Gold || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hạng Kim cương</p>
              <p className="text-xl font-bold text-purple-600">{stats.membersByTier?.Platinum || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points Calculator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Máy tính điểm</h2>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">Số tiền thanh toán:</label>
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(parseInt(e.target.value) || 0)}
            className="px-4 py-2 border border-gray-200 rounded-lg w-48 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            step="10000"
          />
          <span className="text-gray-500">VNĐ</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['Silver', 'Gold', 'Platinum'].map(tier => {
            const config = tierConfig[tier];
            const points = calculatePoints(tier);
            return (
              <div key={tier} className={`p-4 rounded-lg border ${config.bgCard}`}>
                <div className="flex items-center gap-2 mb-2">
                  <config.icon className="w-4 h-4" />
                  <span className="font-medium">{config.label}</span>
                </div>
                <p className="text-2xl font-bold">+{formatCurrency(points)} điểm</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Silver', 'Gold', 'Platinum'].map(tier => {
          const config = tierConfig[tier];
          const Icon = config.icon;
          const tierData = editingTiers[tier] || {};
          
          return (
            <div key={tier} className={`rounded-xl border-2 overflow-hidden ${config.bgCard}`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${config.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Hạng {config.label}</h3>
                    <p className="text-sm text-gray-500">{tier}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Min Yearly Spent */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Chi tiêu tối thiểu/năm
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tierData.min_yearly_spent || ''}
                      onChange={(e) => handleChange(tier, 'min_yearly_spent', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      placeholder="0"
                      step="100000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">VNĐ</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    = {formatCurrency(tierData.min_yearly_spent || 0)} VNĐ
                  </p>
                </div>

                {/* Points per 1000 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Star className="w-4 h-4" />
                    Tỷ lệ tích điểm
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tierData.points_per_1000 || ''}
                      onChange={(e) => handleChange(tier, 'points_per_1000', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      placeholder="1"
                      step="0.1"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">điểm/1.000đ</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mua 100.000đ → +{formatCurrency(Math.floor(100 * (tierData.points_per_1000 || 1)))} điểm
                  </p>
                </div>

                {/* Member count */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Số thành viên:</span>
                    <span className="font-semibold text-gray-800">
                      {stats.membersByTier?.[tier] || 0} người
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Cách thức hoạt động</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Chi tiêu tối thiểu/năm:</strong> Số tiền khách hàng cần chi trong năm để đạt/duy trì hạng</li>
          <li>• <strong>Tỷ lệ tích điểm:</strong> Số điểm nhận được cho mỗi 1.000đ chi tiêu</li>
          <li>• <strong>Quy đổi:</strong> 1 điểm = 100 VNĐ giảm giá (tối đa 50% đơn hàng)</li>
          <li>• Chi tiêu trong năm sẽ được reset vào ngày 1/1 hàng năm</li>
        </ul>
      </div>
    </div>
  );
};

export default LoyaltyPage;
