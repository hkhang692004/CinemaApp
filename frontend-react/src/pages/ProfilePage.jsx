import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Camera,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const fileInputRef = useRef(null);
  
  // Form states - will be synced by useEffect when user changes
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Helper function to format date to yyyy-MM-dd for input[type="date"]
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    
    // Trim whitespace
    const trimmed = String(dateStr).trim();
    
    // If already in yyyy-MM-dd format (from DATEONLY in MySQL)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // If has 'T' (datetime format), extract date part
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0];
    }
    
    // Try to parse and format (use UTC to avoid timezone issues)
    const parts = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (parts) {
      return `${parts[1]}-${parts[2]}-${parts[3]}`;
    }
    
    return '';
  };

  // Sync form state when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.full_name || '',
        phone: user.phone || '',
        dateOfBirth: formatDateForInput(user.date_of_birth)
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/profile', data);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Cập nhật thông tin thành công');
      await checkAuth(); // Refresh user info
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (imageBase64) => {
      const response = await api.put('/users/avatar', { imageBase64 });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Cập nhật avatar thành công');
      await checkAuth();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  // Handle profile form submit
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    // Validate fullName
    const trimmedName = profileForm.fullName.trim();
    if (!trimmedName) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (trimmedName.length < 2) {
      toast.error('Họ tên phải có ít nhất 2 ký tự');
      return;
    }
    if (trimmedName.length > 100) {
      toast.error('Họ tên không được quá 100 ký tự');
      return;
    }
    
    // Validate phone (optional)
    if (profileForm.phone) {
      const phoneStr = profileForm.phone.trim();
      if (!/^[0-9]{10,11}$/.test(phoneStr)) {
        toast.error('Số điện thoại phải có 10-11 chữ số');
        return;
      }
    }
    
    // Validate dateOfBirth (optional)
    if (profileForm.dateOfBirth) {
      const dob = new Date(profileForm.dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      if (age < 10 || age > 100) {
        toast.error('Tuổi phải từ 10 đến 100');
        return;
      }
    }
    
    updateProfileMutation.mutate({
      fullName: trimmedName,
      phone: profileForm.phone?.trim() || null,
      dateOfBirth: profileForm.dateOfBirth || null
    });
  };

  // Handle password form submit
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    // Validate current password
    if (!passwordForm.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    
    // Validate new password
    if (!passwordForm.newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    if (passwordForm.newPassword.length > 50) {
      toast.error('Mật khẩu không được quá 50 ký tự');
      return;
    }
    
    // Check password strength (uppercase, lowercase, number, special char)
    if (!/[a-z]/.test(passwordForm.newPassword)) {
      toast.error('Mật khẩu phải chứa ít nhất 1 chữ thường (a-z)');
      return;
    }
    
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      toast.error('Mật khẩu phải chứa ít nhất 1 chữ in hoa (A-Z)');
      return;
    }
    
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      toast.error('Mật khẩu phải chứa ít nhất 1 số (0-9)');
      return;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword)) {
      toast.error('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...)');
      return;
    }
    
    // Validate confirm password
    if (!passwordForm.confirmPassword) {
      toast.error('Vui lòng xác nhận mật khẩu mới');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    
    // Check if new password is same as current
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được quá 5MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      updateAvatarMutation.mutate(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Quản trị viên', color: 'bg-red-100 text-red-700' },
      manager: { text: 'Quản lý rạp', color: 'bg-blue-100 text-blue-700' }
    };
    return badges[role] || { text: role, color: 'bg-gray-100 text-gray-700' };
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover & Avatar */}
        <div className="h-32 bg-gradient-to-r from-red-500 to-red-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-3xl font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={updateAvatarMutation.isPending}
                className="absolute bottom-0 right-0 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
              >
                {updateAvatarMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-16 pb-6 px-8">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
              {roleBadge.text}
            </span>
          </div>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Thông tin cá nhân</h3>
            <p className="text-sm text-gray-500">Cập nhật thông tin cá nhân của bạn</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email - Readonly */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Đổi mật khẩu</h3>
            <p className="text-sm text-gray-500">Cập nhật mật khẩu để bảo mật tài khoản</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Shield size={18} />
              )}
              Đổi mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
