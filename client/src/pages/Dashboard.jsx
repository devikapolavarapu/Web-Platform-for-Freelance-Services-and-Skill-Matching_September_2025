import { useTheme } from "../ThemeContext";
import { Sun, Moon, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function Dashboard({ user }) {
  const { theme, toggleTheme } = useTheme();

  const [profileImage, setProfileImage] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("profileImage");
    if (saved) setProfileImage(saved);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      localStorage.setItem("profileImage", imageUrl);
      setProfileImage(imageUrl);
    }
  };

  const [score, setScore] = useState(0);
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setResumeFile(null);
      setScore(0);
      return;
    }
    
    setResumeFile(file);
    setUploadingResume(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await api.post('/resume', formData);
      setScore(response.data.score);
    } catch (err) {
      console.error('Error uploading resume:', err);
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 via-blue-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white transition-all">

      {/* Sidebar */}
      <div className="w-64 p-5 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-lg">
        <h2 className="text-xl font-bold mb-6">Platform</h2>

        <nav className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            Dashboard
          </div>
          <div className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            Messages
          </div>
          <div className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            Payments
          </div>
          <div className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            Profile
          </div>
        </nav>

        <button className="mt-10 text-sm text-gray-500 hover:text-red-500">
          Sign out
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 p-8">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Here's a quick overview of your workspace.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-6">

          {/* Profile Card */}
          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg border border-white/20 dark:border-slate-700 shadow-xl rounded-2xl p-6 transition hover:scale-[1.02]">

            <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>

            <div className="flex items-center gap-4 mb-4">

              <label className="cursor-pointer">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="profile"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-md">
                    {user?.name?.[0]}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-slate-700 my-4" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Account Permissions
                </p>
                <p className="text-sm">Your registered platform role</p>
              </div>

              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                Student
              </span>
            </div>
          </div>

          {/* Resume Score */}
          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg border border-white/20 dark:border-slate-700 shadow-xl rounded-2xl p-6 transition hover:scale-[1.02]">

            <h2 className="text-lg font-semibold mb-4">Resume Score</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {score}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ATS Optimized
                </p>
              </div>

              <div className="w-20 h-20 rounded-full border-4 border-blue-500 flex items-center justify-center text-lg font-bold">
                {uploadingResume ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : score}
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Resume
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleResumeChange}
                disabled={uploadingResume}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-white dark:hover:file:bg-slate-600 cursor-pointer disabled:opacity-50"
              />
              {resumeFile && (
                <div className="mt-3 flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 shadow-sm transition">
                  <div className="flex-shrink-0 p-1.5 bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {resumeFile.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg border border-white/20 dark:border-slate-700 shadow-xl rounded-2xl p-6 flex flex-col items-center justify-center text-center">

            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700 mb-3">
              💬
            </div>

            <p className="text-gray-500 dark:text-gray-400">
              No new alerts for today
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}