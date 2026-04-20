import { useState }           from 'react';
import { Link, useNavigate }  from 'react-router-dom';
import { useDispatch }        from 'react-redux';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast                  from 'react-hot-toast';

import { useSignupMutation }  from '../store/apiSlice';
import { setCredentials }     from '../store/authSlice';

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [signup, { isLoading }] = useSignupMutation();

  const [form, setForm]     = useState({
    name: '', email: '', password: '', department: '',
  });
  const [showPass, setShow] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await signup(form).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.token }));
      toast.success(`Account created! Welcome, ${res.user.name}!`);
      navigate('/employee', { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[400px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
      
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-600 items-center
                          justify-center mb-4 shadow-lg shadow-brand-600/25">
            <span className="text-white font-display font-bold text-2xl">A</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Create account</h1>
          <p className="text-slate-400 mt-2">Join AttendPro as an employee</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
         
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="D Table Analytics" 
                className="input-field"
                required
              />
            </div>

       
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="D Table Analytics@gmail.com"
                className="input-field"
                required
              />
            </div>

        
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Engineering, Sales, HR..."
                className="input-field"
              />
            </div>

       
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="input-field pr-12"
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
              <p className="text-xs text-slate-500 mt-1.5">
                Note: Accounts are created as <span className="text-brand-400">Employee</span>.
                Admin assigns Manager roles.
              </p>
            </div>

     
            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30
                                 border-t-white animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
