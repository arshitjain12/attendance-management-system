import { useState }             from 'react';
import { Link, useNavigate }    from 'react-router-dom';
import { useDispatch }          from 'react-redux';
import { Eye, EyeOff, LogIn }   from 'lucide-react';
import toast                    from 'react-hot-toast';

import { useLoginMutation }     from '../store/apiSlice';
import { setCredentials }       from '../store/authSlice';

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPass, setShow] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Welcome back, ${res.user.name}!`);

     
      const routes = { admin: '/admin', manager: '/manager', employee: '/employee' };
      navigate(routes[res.user.role] || '/employee', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[400px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-600 items-center
                          justify-center mb-4 shadow-lg shadow-brand-600/25">
            <span className="text-white font-display font-bold text-2xl">A</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to your AttendPro account</p>
        </div>

    
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
         
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="input-field"
                autoComplete="email"
                required
              />
            </div>

          
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

           
            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30
                                 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
