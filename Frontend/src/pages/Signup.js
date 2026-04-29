import React, { useEffect, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Container from "../components/Container";
import CustomInput from "../components/CustomInput";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../features/user/userSlice";
import { authService } from "../features/user/userService";
import { toast } from "react-toastify";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";

let signUpSchema = yup.object({
  firstname: yup.string().required("First Name is Required"),
  lastname: yup.string().required("Last Name is Required"),
  email: yup.string().email("Email Should be valid"),
  mobile: yup
    .string()
    .required("Mobile Number is Required")
    .matches(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  password: yup.string().required("Password is Required"),
});

const Signup = () => {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState("");
  const [requireOtp, setRequireOtp] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) setReferralCode(refCode);
    // Fetch OTP setting from public-settings
    axios.get(`${base_url}user/public-settings`)
      .then(res => setRequireOtp(res.data?.requireOtpForSignup === true))
      .catch(() => {});
  }, [searchParams]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      email: "",
      mobile: "",
      password: "",
      referralCode: referralCode,
    },
    validationSchema: signUpSchema,
    onSubmit: (values) => {
      if (requireOtp && !otpVerified) {
        toast.error("Please verify your mobile number first");
        return;
      }
      dispatch(registerUser({ ...values, ...(requireOtp && { verifyToken }) }));
    },
  });

  useEffect(() => {
    if (referralCode && !formik.values.referralCode) {
      formik.setFieldValue("referralCode", referralCode);
    }
  }, [referralCode]);

  useEffect(() => {
    if (authState.isSuccess && authState.user) {
      navigate("/");
    }
  }, [authState.isSuccess, authState.user, navigate]);

  const handleSendOTP = async () => {
    const mobile = formik.values.mobile;
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit mobile number first");
      return;
    }
    setOtpLoading(true);
    try {
      await authService.sendOTP(mobile);
      setOtpSent(true);
      setCountdown(60);
      toast.success("OTP sent to your mobile number");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await authService.verifyOTP(formik.values.mobile, otp);
      setVerifyToken(res.verifyToken);
      setOtpVerified(true);
      toast.success("Mobile number verified!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <Meta title={"Sign Up"} />
      <BreadCrumb title="Sign Up" />
      <Container class1="login-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-12">
            <div className="auth-card">
              <h3 className="text-center mb-3">Sign Up</h3>
              <form
                className="d-flex flex-column gap-15"
                onSubmit={formik.handleSubmit}
              >
                <CustomInput
                  type="text"
                  name="firstname"
                  placeholder="FirstName"
                  value={formik.values.firstname}
                  onChange={formik.handleChange("firstname")}
                  onBlur={formik.handleBlur("firstname")}
                />
                <div className="error">
                  {formik.touched.firstname && formik.errors.firstname}
                </div>

                <CustomInput
                  type="text"
                  name="lastname"
                  placeholder="LastName"
                  value={formik.values.lastname}
                  onChange={formik.handleChange("lastname")}
                  onBlur={formik.handleBlur("lastname")}
                />
                <div className="error">
                  {formik.touched.lastname && formik.errors.lastname}
                </div>

                <CustomInput
                  type="email"
                  name="email"
                  placeholder="Email (Optional)"
                  value={formik.values.email}
                  onChange={formik.handleChange("email")}
                  onBlur={formik.handleBlur("email")}
                />
                <div className="error">
                  {formik.touched.email && formik.errors.email}
                </div>

                {/* Mobile + OTP Section */}
                <div className="d-flex gap-2 align-items-start">
                  <div style={{ flex: 1 }}>
                    <CustomInput
                      type="tel"
                      name="mobile"
                      placeholder="Mobile Number"
                      value={formik.values.mobile}
                      onChange={(e) => {
                        formik.handleChange("mobile")(e);
                        if (requireOtp) {
                          setOtpSent(false);
                          setOtpVerified(false);
                          setVerifyToken("");
                          setOtp("");
                        }
                      }}
                      onBlur={formik.handleBlur("mobile")}
                      disabled={requireOtp && otpVerified}
                    />
                    <div className="error">
                      {formik.touched.mobile && formik.errors.mobile}
                    </div>
                  </div>
                  {requireOtp && !otpVerified && (
                    <button
                      type="button"
                      className="button border-0"
                      style={{ whiteSpace: "nowrap", marginTop: "2px" }}
                      onClick={handleSendOTP}
                      disabled={otpLoading || countdown > 0}
                    >
                      {otpLoading ? "Sending..." : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                  {requireOtp && otpVerified && (
                    <span className="text-success fw-bold" style={{ marginTop: "8px" }}>✓ Verified</span>
                  )}
                </div>

                {/* OTP Input */}
                {requireOtp && otpSent && !otpVerified && (
                  <div className="d-flex gap-2 align-items-center">
                    <CustomInput
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className="button border-0"
                      style={{ whiteSpace: "nowrap" }}
                      onClick={handleVerifyOTP}
                      disabled={otpLoading}
                    >
                      {otpLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                )}

                <CustomInput
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange("password")}
                  onBlur={formik.handleBlur("password")}
                />
                <div className="error">
                  {formik.touched.password && formik.errors.password}
                </div>

                <div className="referral-input">
                  <CustomInput
                    type="text"
                    name="referralCode"
                    placeholder="Referral Code (Optional)"
                    value={formik.values.referralCode}
                    onChange={formik.handleChange("referralCode")}
                    onBlur={formik.handleBlur("referralCode")}
                  />
                  {referralCode && (
                    <small className="text-success mt-1 d-block">
                      Referral code detected: {referralCode}
                    </small>
                  )}
                </div>

                <div>
                  <div className="mt-3 d-flex justify-content-center gap-15 align-items-center">
                    <button
                      className="button border-0"
                      type="submit"
                      disabled={requireOtp && !otpVerified}
                      title={requireOtp && !otpVerified ? "Verify mobile number first" : ""}
                    >
                      Sign Up
                    </button>
                  </div>
                  {requireOtp && !otpVerified && (
                    <p className="text-center text-muted mt-2" style={{ fontSize: "13px" }}>
                      Please verify your mobile number to sign up
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Signup;
