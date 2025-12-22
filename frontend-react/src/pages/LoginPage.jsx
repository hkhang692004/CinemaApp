import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Film, Eye, EyeOff, Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Zod schema để validate form login
const loginSchema = z.object({
  email: z.string({ error: 'Email không được để trống' }).email({ error: 'Email không hợp lệ' }),
  password: z.string({ error: 'Mật khẩu không được để trống' }).min(6, { error: 'Mật khẩu phải có ít nhất 6 ký tự' }),
});

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate với Zod
    const result = loginSchema.safeParse({ email, password });
    
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      console.log('Validation errors:', fieldErrors); // Debug
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: "url('/Absolutecinema.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Login Box */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10 relative overflow-hidden">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10 relative">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/30 transform hover:scale-105 transition-transform">
                <Film className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-3 h-3 text-yellow-800" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Absolute Cinema</h1>
            <p className="text-white/60 text-sm mt-1">Hệ thống quản trị</p>
          </div>

          {/* Welcome Text */}
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-white/90">Chào mừng trở lại! </h2>
            <p className="text-white/50 mt-1 text-sm">Đăng nhập để tiếp tục quản lý</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Email
              </label>
              <div className={`relative group transition-all duration-300 ${focused === 'email' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'email' ? 'text-red-400' : 'text-white/40'}`}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border-2 rounded-xl focus:border-red-500/50 focus:bg-white/10 outline-none transition-all text-white placeholder-white/30 hover:border-white/20 ${errors.email ? 'border-red-500/70' : 'border-white/10'}`}
                  placeholder="Nhập email của bạn"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Mật khẩu
              </label>
              <div className={`relative group transition-all duration-300 ${focused === 'password' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused === 'password' ? 'text-red-400' : 'text-white/40'}`}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border-2 rounded-xl focus:border-red-500/50 focus:bg-white/10 outline-none transition-all text-white placeholder-white/30 hover:border-white/20 ${errors.password ? 'border-red-500/70' : 'border-white/10'}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-xl font-semibold hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] mt-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>

            {/* Forgot password notice */}
            <p className="text-center text-white/50 text-sm mt-4">
              Quên mật khẩu? <span className="text-red-400">Vui lòng liên hệ Admin</span>
            </p>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-white/40 text-xs">
              © 2025 Absolute Cinema. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
