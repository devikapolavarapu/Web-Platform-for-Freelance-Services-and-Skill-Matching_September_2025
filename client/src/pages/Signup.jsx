import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/users', formData);
      toast.success('Account created successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 py-10 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10 transition-all duration-300 hover:scale-110 active:scale-95">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-slate-800 p-8 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:scale-105 sm:p-10 transition-all duration-300">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 transition-all duration-300 hover:rotate-12">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">Join the marketplace today</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors duration-300">Full Name</label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors duration-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 p-2.5 pl-10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-300 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-500 dark:focus:ring-offset-slate-900 sm:text-sm hover:border-blue-400"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors duration-300">Email Address</label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors duration-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 p-2.5 pl-10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-300 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-500 dark:focus:ring-offset-slate-900 sm:text-sm hover:border-blue-400"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors duration-300">Password</label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors duration-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 p-2.5 pl-10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-300 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-500 dark:focus:ring-offset-slate-900 sm:text-sm hover:border-blue-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <label 
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm ${
                  formData.role === 'student' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-white' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                  className="hidden"
                />
                Student
              </label>
              <label 
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm ${
                  formData.role === 'client' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-white' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleChange}
                  className="hidden"
                />
                Client
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:pointer-events-none disabled:opacity-70 shadow-md hover:shadow-lg mt-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
