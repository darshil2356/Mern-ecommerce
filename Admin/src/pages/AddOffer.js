import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import { createOffer, getAnOffer, updateAnOffer, resetOfferState } from "../features/offer/offerSlice";
import { getProducts } from "../features/product/productSlice";
import { Select } from "antd";

const OFFER_TYPES = [
  { value: "BUY_X_FOR_PRICE", label: "Buy X for Fixed Price (e.g. Buy 2 for ₹1800)" },
  { value: "BUY_X_GET_Y_FREE", label: "Buy X Get Y Free (e.g. Buy 2 Get 1 Free)" },
  { value: "FLAT_OFF", label: "Flat Amount Off (e.g. ₹100 off)" },
  { value: "PERCENT_OFF", label: "Percentage Off (e.g. 10% off)" },
  { value: "MIN_QTY_DISCOUNT", label: "Min Qty Discount (e.g. Buy 3+, get 15% off)" },
];

const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  offerType: yup.string().required("Offer type is required"),
  endDate: yup.date().required("End date is required"),
});

const AddOffer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const offerId = location.pathname.split("/")[3];

  const { isSuccess, isError, createdOffer, updatedOffer, singleOffer } = useSelector((s) => s.offer);
  const products = useSelector((s) => s.product?.products || []);

  useEffect(() => {
    dispatch(getProducts());
    if (offerId) dispatch(getAnOffer(offerId));
    else dispatch(resetOfferState());
  }, [offerId]);

  useEffect(() => {
    if (isSuccess && createdOffer) { toast.success("Offer created!"); navigate("/admin/offer-list"); }
    if (isSuccess && updatedOffer) { toast.success("Offer updated!"); navigate("/admin/offer-list"); }
    if (isError) toast.error("Something went wrong!");
  }, [isSuccess, isError, createdOffer, updatedOffer]);

  const toDateInput = (d) => d ? new Date(d).toISOString().split("T")[0] : "";

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: singleOffer?.title || "",
      description: singleOffer?.description || "",
      offerType: singleOffer?.offerType || "BUY_X_FOR_PRICE",
      applicableProducts: singleOffer?.applicableProducts?.map((p) => p._id || p) || [],
      applicableCategories: singleOffer?.applicableCategories?.join(", ") || "",
      buyQty: singleOffer?.buyQty || 1,
      getFreeQty: singleOffer?.getFreeQty || 1,
      fixedPrice: singleOffer?.fixedPrice || "",
      discountAmount: singleOffer?.discountAmount || "",
      discountPercent: singleOffer?.discountPercent || "",
      minQty: singleOffer?.minQty || 1,
      startDate: toDateInput(singleOffer?.startDate) || toDateInput(new Date()),
      endDate: toDateInput(singleOffer?.endDate) || "",
      isActive: singleOffer?.isActive ?? true,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        applicableCategories: values.applicableCategories
          ? values.applicableCategories.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };
      if (offerId) dispatch(updateAnOffer({ id: offerId, data: payload }));
      else dispatch(createOffer(payload));
    },
  });

  const t = formik.values.offerType;

  return (
    <div>
      <h3 className="mb-4 title">{offerId ? "Edit" : "Add"} Offer</h3>
      <form onSubmit={formik.handleSubmit}>
        <div className="row g-3">

          {/* Title */}
          <div className="col-12">
            <label className="form-label fw-semibold">Offer Title *</label>
            <input className="form-control" name="title" placeholder="e.g. Buy 2 Shirts for ₹1800"
              value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.title && <div className="text-danger small">{formik.errors.title}</div>}
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label fw-semibold">Description (shown to customer)</label>
            <input className="form-control" name="description" placeholder="e.g. Buy any 2 shirts and pay only ₹1800"
              value={formik.values.description} onChange={formik.handleChange} />
          </div>

          {/* Offer Type */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Offer Type *</label>
            <select className="form-select" name="offerType"
              value={formik.values.offerType} onChange={formik.handleChange}>
              {OFFER_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Active toggle */}
          <div className="col-md-6 d-flex align-items-end">
            <div className="form-check form-switch mb-2">
              <input className="form-check-input" type="checkbox" id="isActive"
                checked={formik.values.isActive}
                onChange={(e) => formik.setFieldValue("isActive", e.target.checked)} />
              <label className="form-check-label fw-semibold" htmlFor="isActive">Active</label>
            </div>
          </div>

          {/* Offer type specific fields */}
          {(t === "BUY_X_FOR_PRICE" || t === "BUY_X_GET_Y_FREE" || t === "MIN_QTY_DISCOUNT") && (
            <div className="col-md-4">
              <label className="form-label fw-semibold">
                {t === "MIN_QTY_DISCOUNT" ? "Min Qty to Qualify" : "Buy Qty (X)"}
              </label>
              <input type="number" className="form-control" name={t === "MIN_QTY_DISCOUNT" ? "minQty" : "buyQty"}
                min={1} value={t === "MIN_QTY_DISCOUNT" ? formik.values.minQty : formik.values.buyQty}
                onChange={formik.handleChange} />
            </div>
          )}

          {t === "BUY_X_FOR_PRICE" && (
            <div className="col-md-4">
              <label className="form-label fw-semibold">Fixed Price for {formik.values.buyQty} items (₹)</label>
              <input type="number" className="form-control" name="fixedPrice" min={0}
                placeholder="e.g. 1800" value={formik.values.fixedPrice} onChange={formik.handleChange} />
            </div>
          )}

          {t === "BUY_X_GET_Y_FREE" && (
            <div className="col-md-4">
              <label className="form-label fw-semibold">Free Qty (Y)</label>
              <input type="number" className="form-control" name="getFreeQty" min={1}
                value={formik.values.getFreeQty} onChange={formik.handleChange} />
            </div>
          )}

          {t === "FLAT_OFF" && (
            <div className="col-md-4">
              <label className="form-label fw-semibold">Flat Discount Amount (₹)</label>
              <input type="number" className="form-control" name="discountAmount" min={0}
                placeholder="e.g. 100" value={formik.values.discountAmount} onChange={formik.handleChange} />
            </div>
          )}

          {(t === "PERCENT_OFF" || t === "MIN_QTY_DISCOUNT") && (
            <div className="col-md-4">
              <label className="form-label fw-semibold">Discount %</label>
              <input type="number" className="form-control" name="discountPercent" min={0} max={100}
                placeholder="e.g. 10" value={formik.values.discountPercent} onChange={formik.handleChange} />
            </div>
          )}

          {/* Applicable Products */}
          <div className="col-12">
            <label className="form-label fw-semibold">Apply to Specific Products (leave empty = all products)</label>
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="Select products..."
              value={formik.values.applicableProducts}
              onChange={(val) => formik.setFieldValue("applicableProducts", val)}
              options={products.map((p) => ({ value: p._id, label: p.title }))}
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            />
          </div>

          {/* Applicable Categories */}
          <div className="col-12">
            <label className="form-label fw-semibold">Apply to Categories (comma separated, leave empty = all)</label>
            <input className="form-control" name="applicableCategories"
              placeholder="e.g. Shirts, T-Shirts, Jeans"
              value={formik.values.applicableCategories} onChange={formik.handleChange} />
          </div>

          {/* Dates */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Start Date</label>
            <input type="date" className="form-control" name="startDate"
              value={formik.values.startDate} onChange={formik.handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">End Date *</label>
            <input type="date" className="form-control" name="endDate"
              value={formik.values.endDate} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.endDate && <div className="text-danger small">{formik.errors.endDate}</div>}
          </div>

          {/* Preview */}
          <div className="col-12">
            <div className="alert alert-info py-2">
              <strong>Preview label on product:</strong>{" "}
              <span className="badge ms-2" style={{ background: "#ff6b35", fontSize: 13 }}>
                {formik.values.title || "Offer label here"}
              </span>
            </div>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-success px-4">
              {offerId ? "Update" : "Create"} Offer
            </button>
            <button type="button" className="btn btn-secondary ms-2 px-4" onClick={() => navigate("/admin/offer-list")}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddOffer;
