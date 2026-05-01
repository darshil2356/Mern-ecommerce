import { React, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { FaTicketAlt, FaArrowLeft, FaPercent, FaCalendarAlt, FaTag } from "react-icons/fa";
import { createCoupon, getACoupon, resetState, updateACoupon } from "../features/coupon/couponSlice";

const schema = yup.object().shape({
  name: yup
    .string()
    .required("Coupon name is required")
    .min(3, "Minimum 3 characters")
    .matches(/^[A-Za-z0-9]+$/, "Only letters and numbers, no spaces"),
  expiry: yup.date().required("Expiry date is required").min(new Date(), "Expiry must be a future date"),
  discount: yup
    .number()
    .required("Discount is required")
    .min(1, "Minimum 1%")
    .max(100, "Maximum 100%"),
});

const AddCoupon = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const getCouponId = location.pathname.split("/")[3];
  const isEdit = getCouponId !== undefined;
  const { isSuccess, isError, isLoading, createdCoupon, couponName, couponDiscount, couponExpiry, updatedCoupon } =
    useSelector((state) => state.coupon);

  const changeDateFormat = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    const [month, day, year] = d.toLocaleDateString().split("/");
    return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
  };

  useEffect(() => {
    if (isEdit) dispatch(getACoupon(getCouponId));
    else dispatch(resetState());
  }, [getCouponId]);

  useEffect(() => {
    if (isSuccess && createdCoupon) {
      toast.success("Coupon created successfully!");
      formik.resetForm();
      dispatch(resetState());
    }
    if (isSuccess && updatedCoupon) {
      toast.success("Coupon updated successfully!");
      navigate("/admin/coupon-list");
    }
    if (isError) toast.error("Something went wrong!");
  }, [isSuccess, isError]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: couponName || "",
      expiry: changeDateFormat(couponExpiry) || "",
      discount: couponDiscount || "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (isEdit) {
        dispatch(updateACoupon({ id: getCouponId, couponData: values }));
      } else {
        dispatch(createCoupon(values));
      }
    },
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", padding: "clamp(8px, 2vw, 24px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <Link
          to="/admin/coupon-list"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", color: "#64748b", textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <FaArrowLeft size={14} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #ec4899, #db2777)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(236,72,153,0.3)" }}>
            <FaTicketAlt size={20} color="#fff" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 20 }}>
              {isEdit ? "Edit Coupon" : "Create New Coupon"}
            </h4>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              {isEdit ? "Update coupon details" : "Add a discount coupon for customers"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16, maxWidth: 900 }}>
        {/* Form Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <form onSubmit={formik.handleSubmit}>

            {/* Coupon Name */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>
                <FaTag size={12} style={{ marginRight: 6, color: "#ec4899" }} />
                Coupon Code
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. SAVE20, WELCOME10"
                  value={formik.values.name}
                  onChange={(e) => formik.setFieldValue("name", e.target.value.toUpperCase())}
                  onBlur={formik.handleBlur("name")}
                  style={{ ...inputStyle, borderColor: formik.touched.name && formik.errors.name ? "#ef4444" : "#e2e8f0", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, fontSize: 16 }}
                />
              </div>
              {formik.touched.name && formik.errors.name && (
                <p style={errStyle}>{formik.errors.name}</p>
              )}
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Only letters and numbers. Auto-converted to uppercase.
              </p>
            </div>

            {/* Discount */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>
                <FaPercent size={12} style={{ marginRight: 6, color: "#ec4899" }} />
                Discount Percentage
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="discount"
                  placeholder="e.g. 10"
                  min={1}
                  max={100}
                  value={formik.values.discount}
                  onChange={formik.handleChange("discount")}
                  onBlur={formik.handleBlur("discount")}
                  style={{ ...inputStyle, borderColor: formik.touched.discount && formik.errors.discount ? "#ef4444" : "#e2e8f0", paddingRight: 48 }}
                />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 700, fontSize: 16 }}>%</span>
              </div>
              {formik.touched.discount && formik.errors.discount && (
                <p style={errStyle}>{formik.errors.discount}</p>
              )}
              {/* Discount slider */}
              {formik.values.discount > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(formik.values.discount, 100)}%`, background: "linear-gradient(90deg, #ec4899, #db2777)", borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>0%</span>
                    <span style={{ fontSize: 11, color: "#ec4899", fontWeight: 700 }}>{formik.values.discount}% off</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Expiry Date */}
            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>
                <FaCalendarAlt size={12} style={{ marginRight: 6, color: "#ec4899" }} />
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry"
                min={today}
                value={formik.values.expiry}
                onChange={formik.handleChange("expiry")}
                onBlur={formik.handleBlur("expiry")}
                style={{ ...inputStyle, borderColor: formik.touched.expiry && formik.errors.expiry ? "#ef4444" : "#e2e8f0" }}
              />
              {formik.touched.expiry && formik.errors.expiry && (
                <p style={errStyle}>{formik.errors.expiry}</p>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{ flex: 1, padding: "14px 24px", background: "linear-gradient(135deg, #ec4899, #db2777)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, boxShadow: "0 4px 15px rgba(236,72,153,0.35)", transition: "all 0.2s" }}
              >
                {isLoading ? "Saving…" : isEdit ? "Update Coupon" : "Create Coupon"}
              </button>
              <Link
                to="/admin/coupon-list"
                style={{ padding: "14px 20px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center" }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        <div>
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: 16 }}>
            <p style={{ margin: "0 0 16px", fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Live Preview</p>
            {/* Coupon ticket design */}
            <div style={{ background: "linear-gradient(135deg, #fdf2f8, #fce7f3)", borderRadius: 16, padding: 20, border: "2px dashed #f9a8d4", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "rgba(236,72,153,0.08)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", bottom: -15, left: -15, width: 60, height: 60, background: "rgba(236,72,153,0.06)", borderRadius: "50%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <FaTicketAlt size={18} color="#ec4899" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ec4899", textTransform: "uppercase", letterSpacing: 1 }}>Discount Coupon</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#be185d", letterSpacing: 3, marginBottom: 8, fontFamily: "monospace" }}>
                {formik.values.name || "COUPONCODE"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ background: "#ec4899", color: "#fff", borderRadius: 20, padding: "4px 14px", fontWeight: 800, fontSize: 18 }}>
                  {formik.values.discount || "0"}% OFF
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Valid till</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                    {formik.values.expiry ? new Date(formik.values.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>💡 Tips</p>
            {[
              "Use short, memorable codes like SAVE20",
              "Higher discounts drive more conversions",
              "Set expiry to create urgency",
              "Share on WhatsApp & social media",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 18, height: 18, background: "#fdf2f8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: "#ec4899", fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "flex", alignItems: "center",
  fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8,
};
const inputStyle = {
  width: "100%", padding: "13px 16px",
  border: "1.5px solid #e2e8f0", borderRadius: 12,
  fontSize: 14, color: "#0f172a", outline: "none",
  background: "#fafafa", transition: "border-color 0.2s",
  boxSizing: "border-box",
};
const errStyle = { margin: "5px 0 0", fontSize: 12, color: "#ef4444", fontWeight: 500 };

export default AddCoupon;
