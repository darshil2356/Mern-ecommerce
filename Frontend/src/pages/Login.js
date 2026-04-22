import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Meta from "../components/Meta";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/user/userSlice";
import { AiOutlineMobile, AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const emailSchema = yup.object({
  email: yup.string().required("Email is required").email("Enter a valid email"),
  password: yup.string().required("Password is required"),
});

const mobileSchema = yup.object({
  mobile: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  password: yup.string().required("Password is required"),
});

const Login = () => {
  const [loginMode, setLoginMode] = useState("mobile");
  const [showPassword, setShowPassword] = useState(false);
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "", mobile: "", password: "" },
    validationSchema: loginMode === "email" ? emailSchema : mobileSchema,
    onSubmit: (values) => {
      const payload =
        loginMode === "email"
          ? { email: values.email, password: values.password }
          : { mobile: values.mobile, password: values.password };
      dispatch(loginUser(payload));
    },
  });

  const switchMode = (mode) => {
    setLoginMode(mode);
    formik.resetForm();
  };

  useEffect(() => {
    if (authState.isSuccess && authState.user !== null) {
      navigate("/", { replace: true });
    }
  }, [authState.isSuccess, authState.user, navigate]);

  return (
    <>
      <Meta title="Login" />

      <div style={styles.page}>
        <div style={styles.card}>

          {/* Brand */}
          <div style={styles.brand}>
            <div style={styles.brandIcon}>YF</div>
            <h2 style={styles.brandName}>Yashoda Fashion</h2>
            <p style={styles.brandSub}>Welcome back! Sign in to continue</p>
          </div>

          {/* Toggle */}
          <div style={styles.toggleWrap}>
            <button
              type="button"
              style={{ ...styles.toggleBtn, ...(loginMode === "mobile" ? styles.toggleActive : {}) }}
              onClick={() => switchMode("mobile")}
            >
              <AiOutlineMobile size={16} />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              style={{ ...styles.toggleBtn, ...(loginMode === "email" ? styles.toggleActive : {}) }}
              onClick={() => switchMode("email")}
            >
              <AiOutlineMail size={16} />
              <span>Email</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={formik.handleSubmit} style={styles.form}>

            {/* Mobile / Email field */}
            {loginMode === "mobile" ? (
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Mobile Number</label>
                <div style={styles.inputWrap}>
                  <AiOutlineMobile size={18} style={styles.inputIcon} />
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter 10-digit mobile number"
                    value={formik.values.mobile}
                    onChange={formik.handleChange("mobile")}
                    onBlur={formik.handleBlur("mobile")}
                    style={{
                      ...styles.input,
                      ...(formik.touched.mobile && formik.errors.mobile ? styles.inputError : {}),
                    }}
                    maxLength={10}
                  />
                </div>
                {formik.touched.mobile && formik.errors.mobile && (
                  <span style={styles.errorMsg}>{formik.errors.mobile}</span>
                )}
              </div>
            ) : (
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrap}>
                  <AiOutlineMail size={18} style={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formik.values.email}
                    onChange={formik.handleChange("email")}
                    onBlur={formik.handleBlur("email")}
                    style={{
                      ...styles.input,
                      ...(formik.touched.email && formik.errors.email ? styles.inputError : {}),
                    }}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <span style={styles.errorMsg}>{formik.errors.email}</span>
                )}
              </div>
            )}

            {/* Password field */}
            <div style={styles.fieldWrap}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div style={styles.inputWrap}>
                <AiOutlineLock size={18} style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formik.values.password}
                  onChange={formik.handleChange("password")}
                  onBlur={formik.handleBlur("password")}
                  style={{
                    ...styles.input,
                    paddingRight: "48px",
                    ...(formik.touched.password && formik.errors.password ? styles.inputError : {}),
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <span style={styles.errorMsg}>{formik.errors.password}</span>
              )}
            </div>

            {/* API error */}
            {authState.isError && (
              <div style={styles.apiError}>
                Invalid credentials. Please check and try again.
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={authState.isLoading}
              style={{
                ...styles.submitBtn,
                ...(authState.isLoading ? styles.submitBtnDisabled : {}),
              }}
            >
              {authState.isLoading ? (
                <span style={styles.loadingRow}>
                  <span style={styles.spinner} />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>New here?</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Sign up */}
            <Link to="/signup" style={styles.signupBtn}>
              Create an Account
            </Link>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #aaa; }
        input:focus { outline: none; border-color: #d4af37 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.12); }
      `}</style>
    </>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f5f5 0%, #ececec 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
  },
  brand: {
    textAlign: "center",
    marginBottom: "28px",
  },
  brandIcon: {
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg, #1a1a1a, #333)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d4af37",
    fontWeight: "700",
    fontSize: "18px",
    margin: "0 auto 12px",
    letterSpacing: "1px",
  },
  brandName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "22px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 4px",
  },
  brandSub: {
    fontSize: "13px",
    color: "#888",
    margin: 0,
  },
  toggleWrap: {
    display: "flex",
    background: "#f5f5f5",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "24px",
    gap: "4px",
  },
  toggleBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px",
    border: "none",
    borderRadius: "9px",
    background: "transparent",
    color: "#888",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  toggleActive: {
    background: "#fff",
    color: "#1a1a1a",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
    letterSpacing: "0.3px",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: "12px",
    color: "#d4af37",
    fontWeight: "500",
    textDecoration: "none",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "#aaa",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    fontSize: "14px",
    border: "2px solid #e8e8e8",
    borderRadius: "10px",
    background: "#fafafa",
    color: "#1a1a1a",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
  inputError: {
    borderColor: "#ef4444",
    background: "#fff5f5",
  },
  eyeBtn: {
    position: "absolute",
    right: "14px",
    background: "none",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    padding: "0",
    display: "flex",
    alignItems: "center",
  },
  errorMsg: {
    fontSize: "12px",
    color: "#ef4444",
    fontWeight: "500",
  },
  apiError: {
    background: "#fff5f5",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#dc2626",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #1a1a1a, #333)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "all 0.2s ease",
    marginTop: "4px",
  },
  submitBtnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#e8e8e8",
  },
  dividerText: {
    fontSize: "12px",
    color: "#aaa",
    whiteSpace: "nowrap",
  },
  signupBtn: {
    display: "block",
    width: "100%",
    padding: "13px",
    background: "transparent",
    border: "2px solid #e8e8e8",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
};

export default Login;
