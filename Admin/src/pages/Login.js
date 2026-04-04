import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../features/auth/authSlice";
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { MdAdminPanelSettings } from "react-icons/md";

const schema = yup.object().shape({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: schema,
    onSubmit: (values) => dispatch(login(values)),
  });

  const { user, isError, isSuccess, isLoading, message } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isSuccess) window.location.href = "/admin";
    else navigate("");
  }, [user, isError, isSuccess, isLoading]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-yellow-400 opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-yellow-500 opacity-10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-xl mx-auto px-4 py-8">
        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500" />

          <div className="px-5 py-8 sm:px-8 sm:py-10">
            {/* Logo / Icon */}
            <div className="flex flex-col items-center mb-7">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg mb-3">
                <MdAdminPanelSettings className="text-gray-900 text-3xl sm:text-4xl" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 text-center">Sign in to manage your store</p>
            </div>

            {/* Error message */}
            {message?.message === "Rejected" && (
              <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                <span className="text-base">⚠️</span>
                You are not authorized as an Admin.
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <AiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
                  <input
                    type="email"
                    name="email"
                    placeholder="admin@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange("email")}
                    onBlur={formik.handleBlur("email")}
                    className={`w-full bg-gray-700/60 border ${
                      formik.touched.email && formik.errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-yellow-400"
                    } text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:border-transparent transition`}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-xs text-red-400">{formik.errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <AiOutlineLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formik.values.password}
                    onChange={formik.handleChange("password")}
                    onBlur={formik.handleBlur("password")}
                    className={`w-full bg-gray-700/60 border ${
                      formik.touched.password && formik.errors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-yellow-400"
                    } text-white placeholder-gray-500 rounded-xl pl-9 pr-11 py-3 text-sm outline-none focus:ring-2 focus:border-transparent transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition p-1"
                  >
                    {showPassword ? <AiOutlineEyeInvisible className="text-base sm:text-lg" /> : <AiOutlineEye className="text-base sm:text-lg" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-xs text-red-400">{formik.errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-bold py-3.5 rounded-xl text-sm tracking-wide transition-all duration-200 shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-gray-900/50 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Admin Panel · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
