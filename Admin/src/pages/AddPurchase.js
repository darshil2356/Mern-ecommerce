import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createPurchase, fetchPurchase, updatePurchase, fetchVendors, createVendor, clearCurrentPurchase } from "../features/purchase/purchaseSlice";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const UNITS = ["Pcs", "Meters", "Kg", "Dozen", "Set", "Pair", "Box", "Roll", "Yard", "Litre"];

const EMPTY_ITEM = {
  description: "", hsnCode: "", qty: 1, unit: "Pcs", rate: "",
  discountPercent: 0, discountAmount: 0,
  cgstPercent: 0, sgstPercent: 0, igstPercent: 0,
};

function calcItem(item, gstType, taxIncluded) {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const discPct = parseFloat(item.discountPercent) || 0;
  const gross = qty * rate;
  const discAmt = (gross * discPct) / 100;
  let taxable = gross - discAmt;
  let cgst = 0, sgst = 0, igst = 0, tax = 0;

  if (gstType === "CGST_SGST") {
    const cgstP = parseFloat(item.cgstPercent) || 0;
    const sgstP = parseFloat(item.sgstPercent) || 0;
    if (taxIncluded) taxable = taxable / (1 + (cgstP + sgstP) / 100);
    cgst = (taxable * cgstP) / 100;
    sgst = (taxable * sgstP) / 100;
    tax = cgst + sgst;
  } else if (gstType === "IGST") {
    const igstP = parseFloat(item.igstPercent) || 0;
    if (taxIncluded) taxable = taxable / (1 + igstP / 100);
    igst = (taxable * igstP) / 100;
    tax = igst;
  }

  return {
    ...item,
    discountAmount: +discAmt.toFixed(2),
    taxableAmount: +taxable.toFixed(2),
    cgstAmount: +cgst.toFixed(2),
    sgstAmount: +sgst.toFixed(2),
    igstAmount: +igst.toFixed(2),
    taxAmount: +tax.toFixed(2),
    total: +(taxable + tax).toFixed(2),
  };
}

export default function AddPurchase() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { vendors, currentPurchase, loading } = useSelector(s => s.purchase);
  const printRef = useRef();
  const editId = searchParams.get("edit");

  const [vendor, setVendor] = useState(searchParams.get("vendor") || "");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [gstType, setGstType] = useState("NONE");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [note, setNote] = useState("");

  // Entry Mode: ITEMIZED or DIRECT
  const [entryMode, setEntryMode] = useState("ITEMIZED");
  const [directAmount, setDirectAmount] = useState("");
  const [directDescription, setDirectDescription] = useState("Direct Purchase Bill");
  const [directGstPercent, setDirectGstPercent] = useState("0");
  const [directHsnCode, setDirectHsnCode] = useState("");

  // Payment section
  const [payMode, setPayMode] = useState("CREDIT"); // CREDIT = pay later
  const [initialPaidAmount, setInitialPaidAmount] = useState("");
  const [initialPaymentMode, setInitialPaymentMode] = useState("Cash");
  const [initialPaymentRef, setInitialPaymentRef] = useState("");
  const [initialPaymentNote, setInitialPaymentNote] = useState("");

  // Quick add vendor
  const [showQuickVendor, setShowQuickVendor] = useState(false);
  const [quickVendorName, setQuickVendorName] = useState("");
  const [quickVendorPhone, setQuickVendorPhone] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchVendors({}));
  }, [dispatch]);

  useEffect(() => {
    if (editId) dispatch(fetchPurchase(editId));
    return () => { dispatch(clearCurrentPurchase()); };
  }, [editId, dispatch]);

  useEffect(() => {
    if (!editId || !currentPurchase || currentPurchase._id !== editId) return;
    setVendor(currentPurchase.vendor?._id || currentPurchase.vendor || "");
    setBillNo(currentPurchase.billNo || "");
    setBillDate(currentPurchase.billDate ? currentPurchase.billDate.split("T")[0] : new Date().toISOString().split("T")[0]);
    setGstType(currentPurchase.gstType || "NONE");
    setTaxIncluded(currentPurchase.taxIncluded || false);
    setNote(currentPurchase.note || "");
    setItems(currentPurchase.items?.length ? currentPurchase.items.map(it => ({
      description: it.description || "",
      hsnCode: it.hsnCode || "",
      qty: it.qty ?? 1,
      unit: it.unit || "Pcs",
      rate: it.rate ?? "",
      discountPercent: it.discountPercent ?? 0,
      discountAmount: it.discountAmount ?? 0,
      cgstPercent: it.cgstPercent ?? 0,
      sgstPercent: it.sgstPercent ?? 0,
      igstPercent: it.igstPercent ?? 0,
    })) : [{ ...EMPTY_ITEM }]);

    if (currentPurchase.items?.length === 1) {
      const firstItem = currentPurchase.items[0];
      if (firstItem.description?.toLowerCase().includes("direct") || firstItem.description?.toLowerCase().includes("bulk")) {
        setEntryMode("DIRECT");
        setDirectAmount(firstItem.rate ?? "");
        setDirectDescription(firstItem.description || "Direct Purchase Bill");
        setDirectHsnCode(firstItem.hsnCode || "");
        const totalGst = (firstItem.cgstPercent || 0) + (firstItem.sgstPercent || 0) + (firstItem.igstPercent || 0);
        setDirectGstPercent(String(totalGst));
      }
    }
  }, [editId, currentPurchase]);

  // Computed values
  const directGst = parseFloat(directGstPercent) || 0;
  const directRate = parseFloat(directAmount) || 0;
  const effectiveItems = entryMode === "DIRECT"
    ? [{
        description: directDescription.trim() || "Direct Purchase Bill",
        hsnCode: directHsnCode.trim().toUpperCase(),
        qty: 1,
        unit: "Pcs",
        rate: directRate,
        discountPercent: 0,
        discountAmount: 0,
        cgstPercent: gstType === "CGST_SGST" ? directGst / 2 : 0,
        sgstPercent: gstType === "CGST_SGST" ? directGst / 2 : 0,
        igstPercent: gstType === "IGST" ? directGst : 0,
      }]
    : items;

  const calcItems = effectiveItems.map(it => calcItem(it, gstType, taxIncluded));
  const subtotal = calcItems.reduce((a, i) => a + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const totalDiscount = calcItems.reduce((a, i) => a + i.discountAmount, 0);
  const taxableAmount = calcItems.reduce((a, i) => a + i.taxableAmount, 0);
  const totalCGST = calcItems.reduce((a, i) => a + i.cgstAmount, 0);
  const totalSGST = calcItems.reduce((a, i) => a + i.sgstAmount, 0);
  const totalIGST = calcItems.reduce((a, i) => a + i.igstAmount, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const rawTotal = taxableAmount + totalTax;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = Math.round(rawTotal);

  const paidNow = payMode === "CREDIT" ? 0 : parseFloat(initialPaidAmount) || 0;
  const balanceDue = totalAmount - paidNow;

  const selectedVendor = vendors.find(v => v._id === vendor);
  const filteredVendors = vendors.filter(v =>
    !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.firmName && v.firmName.toLowerCase().includes(vendorSearch.toLowerCase())) ||
    (v.phone && v.phone.includes(vendorSearch))
  );

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => {
    if (items.length === 1) return toast.warning("At least one item is required");
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuickAddVendor = async () => {
    if (!quickVendorName.trim()) return toast.error("Vendor name required");
    const res = await dispatch(createVendor({ name: quickVendorName, phone: quickVendorPhone }));
    if (res.meta.requestStatus === "fulfilled") {
      setVendor(res.payload._id);
      setShowQuickVendor(false);
      setQuickVendorName("");
      setQuickVendorPhone("");
      toast.success("Vendor added!");
      dispatch(fetchVendors({}));
    }
  };

  const handleSave = async (andPrint = false) => {
    if (!vendor) return toast.error("Please select a vendor");
    if (entryMode === "ITEMIZED") {
      if (items.some(i => !i.description.trim())) return toast.error("All items must have a description");
      if (items.some(i => !i.rate || parseFloat(i.rate) <= 0)) return toast.error("All items must have a rate");
    } else {
      if (!directAmount || parseFloat(directAmount) <= 0) return toast.error("Please enter a valid bill amount");
    }
    if (totalAmount <= 0) return toast.error("Total amount must be greater than 0");

    setSaving(true);
    let res;
    if (editId) {
      res = await dispatch(updatePurchase({
        id: editId, vendor, billNo: billNo.trim(), billDate, gstType,
        taxIncluded: gstType !== "NONE" ? taxIncluded : false,
        items: calcItems, note,
      }));
    } else {
      res = await dispatch(createPurchase({
        vendor, billNo: billNo.trim(), billDate, gstType,
        taxIncluded: gstType !== "NONE" ? taxIncluded : false,
        items: calcItems, note,
        initialPaidAmount: payMode !== "CREDIT" ? paidNow : 0,
        initialPaymentMode, initialPaymentRef, initialPaymentNote,
      }));
    }
    setSaving(false);

    if (res.meta.requestStatus === "fulfilled") {
      toast.success(editId ? "Bill updated!" : "Bill saved successfully!");
      if (andPrint) setTimeout(() => window.print(), 200);
      navigate("/admin/purchase-list");
    } else {
      toast.error(res.payload || "Failed to save bill");
    }
  };

  const gstOptions = [
    { value: "NONE", label: "No GST (Non-GST Bill)", desc: "Plain bill without any tax", icon: "📄" },
    { value: "CGST_SGST", label: "GST - CGST + SGST", desc: "Intra-state purchase (same state)", icon: "🏛️" },
    { value: "IGST", label: "GST - IGST", desc: "Inter-state purchase (different state)", icon: "🚛" },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <button onClick={() => navigate("/admin/purchase-list")} style={{
            background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 14, padding: 0, marginBottom: 4,
          }}>
            ← Back to Purchase List
          </button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{editId ? "Edit Purchase Bill" : "Add Purchase Bill"}</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>{editId ? "Update bill items, type or date. Payments stay unchanged." : "Enter bill details from your vendor's slip"}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* LEFT: Main Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Section 1: Vendor + Bill Info */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#111" }}>📋 Bill Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Vendor Select */}
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Vendor (Vepari) *</label>
                {selectedVendor ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "2px solid #6366f1", borderRadius: 8, background: "#f8f9ff" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedVendor.name}</div>
                      {selectedVendor.firmName && <div style={{ fontSize: 12, color: "#6b7280" }}>{selectedVendor.firmName}</div>}
                    </div>
                    <button onClick={() => { setVendor(""); setVendorSearch(""); }} style={{
                      background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, lineHeight: 1,
                    }}>✕</button>
                  </div>
                ) : (
                  <>
                    <input
                      value={vendorSearch}
                      onChange={e => { setVendorSearch(e.target.value); setShowVendorDropdown(true); }}
                      onFocus={() => setShowVendorDropdown(true)}
                      placeholder="Search vendor name..."
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                    />
                    {showVendorDropdown && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)", maxHeight: 220, overflow: "auto", marginTop: 2,
                      }}>
                        <button
                          onMouseDown={() => { setShowQuickVendor(true); setShowVendorDropdown(false); }}
                          style={{ width: "100%", padding: "10px 14px", textAlign: "left", border: "none", background: "#f0fdf4", cursor: "pointer", color: "#15803d", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #dcfce7" }}
                        >
                          + Add New Vendor
                        </button>
                        {filteredVendors.length === 0 ? (
                          <div style={{ padding: 12, color: "#9ca3af", fontSize: 13 }}>No vendors found</div>
                        ) : filteredVendors.map(v => (
                          <button
                            key={v._id}
                            onMouseDown={() => { setVendor(v._id); setVendorSearch(""); setShowVendorDropdown(false); }}
                            style={{ width: "100%", padding: "10px 14px", textAlign: "left", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: 14 }}
                          >
                            <div style={{ fontWeight: 600 }}>{v.name}</div>
                            {v.firmName && <div style={{ fontSize: 12, color: "#9ca3af" }}>{v.firmName} {v.city ? `· ${v.city}` : ""}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bill No */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bill No. (from vendor slip)</label>
                <input
                  value={billNo}
                  onChange={e => setBillNo(e.target.value)}
                  placeholder="e.g. 1245 or INV-001"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              {/* Bill Date */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bill Date *</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bill Type (GST / Non-GST) */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#111" }}>🧾 Bill Type</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {gstOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGstType(opt.value)}
                  style={{
                    padding: "14px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                    border: gstType === opt.value ? "2px solid #6366f1" : "2px solid #e5e7eb",
                    background: gstType === opt.value ? "#f8f9ff" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: gstType === opt.value ? "#6366f1" : "#111" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            {gstType !== "NONE" && (
              <div style={{ marginTop: 16, background: "#f8f9ff", borderRadius: 8, padding: 14, border: "1px solid #e0e7ff" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={taxIncluded}
                    onChange={e => setTaxIncluded(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  Prices on bill already INCLUDE GST (Tax Inclusive)
                </label>
                <p style={{ margin: "6px 0 0 26px", fontSize: 12, color: "#6b7280" }}>
                  {taxIncluded
                    ? "✅ GST will be extracted from the price (reverse calculation)"
                    : "📊 GST will be added ON TOP of item price"}
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Items */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>📦 Items Entry</h3>
              {entryMode === "ITEMIZED" && (
                <button onClick={addItem} style={{
                  background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
                  padding: "6px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13,
                }}>
                  + Add Item
                </button>
              )}
            </div>

            {/* Entry Mode Switcher */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#f3f4f6", padding: 4, borderRadius: 10 }}>
              <button
                type="button"
                onClick={() => setEntryMode("ITEMIZED")}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: entryMode === "ITEMIZED" ? "#fff" : "transparent",
                  color: entryMode === "ITEMIZED" ? "#6366f1" : "#6b7280",
                  boxShadow: entryMode === "ITEMIZED" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <span>📝</span> Itemized Breakdown (Enter All Items)
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("DIRECT")}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: entryMode === "DIRECT" ? "#fff" : "transparent",
                  color: entryMode === "DIRECT" ? "#6366f1" : "#6b7280",
                  boxShadow: entryMode === "DIRECT" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <span>⚡</span> Direct Bill Amount (Single Total Entry)
              </button>
            </div>

            {entryMode === "DIRECT" ? (
              /* Direct Bill Amount Mode UI */
              <div style={{ background: "#f8f9ff", borderRadius: 12, padding: 20, border: "1px solid #e0e7ff" }}>
                <div style={{ display: "grid", gridTemplateColumns: gstType !== "NONE" ? "1.5fr 1.5fr 1fr 1fr" : "2fr 2fr", gap: 14, alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                      Direct Bill Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={directAmount}
                      onChange={e => setDirectAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "2px solid #6366f1", fontSize: 16, fontWeight: 700, color: "#111", boxSizing: "border-box", background: "#fff" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                      Bill Description / Note
                    </label>
                    <input
                      type="text"
                      value={directDescription}
                      onChange={e => setDirectDescription(e.target.value)}
                      placeholder="e.g. 100 Misc Purchase Items"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", background: "#fff" }}
                    />
                  </div>

                  {gstType !== "NONE" && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                          HSN Code
                        </label>
                        <input
                          type="text"
                          value={directHsnCode}
                          onChange={e => setDirectHsnCode(e.target.value.toUpperCase())}
                          placeholder="e.g. 5208"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, textAlign: "center", boxSizing: "border-box", background: "#fff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                          GST Rate (%)
                        </label>
                        <select
                          value={directGstPercent}
                          onChange={e => setDirectGstPercent(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", background: "#fff" }}
                        >
                          <option value="0">0% (Nil / Exempt)</option>
                          <option value="5">5% GST</option>
                          <option value="12">12% GST</option>
                          <option value="18">18% GST</option>
                          <option value="28">28% GST</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginTop: 14, background: "#eef2ff", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4338ca", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚡</span>
                  <span>
                    <strong>Fast Entry Active:</strong> Saves total bill amount directly without needing to list individual items.
                  </span>
                </div>
              </div>
            ) : (
              /* Itemized Breakdown Table */
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: gstType !== "NONE" ? 800 : 600 }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>Description</th>
                        {gstType !== "NONE" && <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>HSN</th>}
                        <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 70 }}>Qty</th>
                        <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 80 }}>Unit</th>
                        <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 90 }}>Rate (₹)</th>
                        <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 70 }}>Disc%</th>
                        {gstType === "CGST_SGST" && <>
                          <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 70 }}>CGST%</th>
                          <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 70 }}>SGST%</th>
                        </>}
                        {gstType === "IGST" && <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 70 }}>IGST%</th>}
                        <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 12, color: "#6b7280", fontWeight: 600, width: 90 }}>Amount</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const calc = calcItem(item, gstType, taxIncluded);
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "8px 10px" }}>
                              <input
                                value={item.description}
                                onChange={e => updateItem(idx, "description", e.target.value)}
                                placeholder="Item description..."
                                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, minWidth: 150, boxSizing: "border-box" }}
                              />
                            </td>
                            {gstType !== "NONE" && (
                              <td style={{ padding: "8px 8px" }}>
                                <input
                                  value={item.hsnCode}
                                  onChange={e => updateItem(idx, "hsnCode", e.target.value.toUpperCase())}
                                  placeholder="HSN"
                                  style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, textAlign: "center", boxSizing: "border-box" }}
                                />
                              </td>
                            )}
                            <td style={{ padding: "8px 8px" }}>
                              <input
                                type="number"
                                value={item.qty}
                                min="0"
                                onChange={e => updateItem(idx, "qty", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                              />
                            </td>
                            <td style={{ padding: "8px 8px" }}>
                              <select
                                value={item.unit}
                                onChange={e => updateItem(idx, "unit", e.target.value)}
                                style={{ width: "100%", padding: "6px 4px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, boxSizing: "border-box" }}
                              >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "8px 8px" }}>
                              <input
                                type="number"
                                value={item.rate}
                                min="0"
                                onChange={e => updateItem(idx, "rate", e.target.value)}
                                placeholder="0.00"
                                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, textAlign: "right", boxSizing: "border-box" }}
                              />
                            </td>
                            <td style={{ padding: "8px 8px" }}>
                              <input
                                type="number"
                                value={item.discountPercent}
                                min="0"
                                max="100"
                                onChange={e => updateItem(idx, "discountPercent", e.target.value)}
                                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                              />
                            </td>
                            {gstType === "CGST_SGST" && <>
                              <td style={{ padding: "8px 8px" }}>
                                <input
                                  type="number"
                                  value={item.cgstPercent}
                                  min="0"
                                  onChange={e => updateItem(idx, "cgstPercent", e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                                />
                              </td>
                              <td style={{ padding: "8px 8px" }}>
                                <input
                                  type="number"
                                  value={item.sgstPercent}
                                  min="0"
                                  onChange={e => updateItem(idx, "sgstPercent", e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                                />
                              </td>
                            </>}
                            {gstType === "IGST" && (
                              <td style={{ padding: "8px 8px" }}>
                                <input
                                  type="number"
                                  value={item.igstPercent}
                                  min="0"
                                  onChange={e => updateItem(idx, "igstPercent", e.target.value)}
                                  style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13, textAlign: "center", boxSizing: "border-box" }}
                                />
                              </td>
                            )}
                            <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 600, fontSize: 13, color: "#111", whiteSpace: "nowrap" }}>
                              ₹{calc.total.toFixed(2)}
                            </td>
                            <td style={{ padding: "8px 4px" }}>
                              <button onClick={() => removeItem(idx)} style={{
                                background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
                                borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button onClick={addItem} style={{
                  marginTop: 12, padding: "8px 16px", background: "#f3f4f6", border: "1px dashed #d1d5db",
                  borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#6b7280", width: "100%",
                }}>
                  + Add Another Item
                </button>
              </>
            )}
          </div>

          {/* Note */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any notes about this purchase..."
              rows={2}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "vertical" }}
            />
          </div>
        </div>

        {/* RIGHT: Summary + Payment */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>
          {/* Bill Summary */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Bill Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#374151" }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#22c55e" }}>
                  <span>Discount</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {gstType !== "NONE" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                    <span>Taxable Amount</span>
                    <span>₹{taxableAmount.toFixed(2)}</span>
                  </div>
                  {gstType === "CGST_SGST" && <>
                    {totalCGST > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                        <span>CGST</span>
                        <span>₹{totalCGST.toFixed(2)}</span>
                      </div>
                    )}
                    {totalSGST > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                        <span>SGST</span>
                        <span>₹{totalSGST.toFixed(2)}</span>
                      </div>
                    )}
                  </>}
                  {gstType === "IGST" && totalIGST > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                      <span>IGST</span>
                      <span>₹{totalIGST.toFixed(2)}</span>
                    </div>
                  )}
                  {totalTax > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", paddingTop: 4, borderTop: "1px dashed #e5e7eb" }}>
                      <span>Total Tax</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {Math.abs(roundOff) > 0.001 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9ca3af" }}>
                  <span>Round Off</span>
                  <span>{roundOff > 0 ? "+" : ""}₹{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#111", borderTop: "2px solid #f3f4f6", paddingTop: 12, marginTop: 4 }}>
                <span>TOTAL</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {editId ? (
            currentPurchase ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>💰 Payment Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#6b7280" }}>Total</span>
                    <span style={{ fontWeight: 700 }}>₹{currentPurchase.totalAmount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#6b7280" }}>Paid</span>
                    <span style={{ fontWeight: 600, color: "#22c55e" }}>₹{currentPurchase.paidAmount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, borderTop: "1px solid #f3f4f6", paddingTop: 8, marginTop: 4 }}>
                    <span>Balance Due</span>
                    <span style={{ color: currentPurchase.balanceDue > 0 ? "#ef4444" : "#22c55e" }}>₹{currentPurchase.balanceDue}</span>
                  </div>
                </div>
                <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9ca3af" }}>To record a payment, use the Pay button in Purchase List.</p>
              </div>
            ) : null
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>💰 Payment</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { value: "CREDIT", label: "Credit", desc: "Pay later", icon: "📆" },
                  { value: "PAID", label: "Pay Now", desc: "Full / partial", icon: "💵" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPayMode(opt.value)}
                    style={{
                      padding: "12px 8px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                      border: payMode === opt.value ? "2px solid #6366f1" : "2px solid #e5e7eb",
                      background: payMode === opt.value ? "#f8f9ff" : "#fff",
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{opt.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: payMode === opt.value ? "#6366f1" : "#111" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
              {payMode === "PAID" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Amount Paid</label>
                    <input
                      type="number"
                      value={initialPaidAmount}
                      onChange={e => setInitialPaidAmount(e.target.value)}
                      placeholder={`Max: ₹${totalAmount}`}
                      max={totalAmount}
                      min={0}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Payment Mode</label>
                    <select
                      value={initialPaymentMode}
                      onChange={e => setInitialPaymentMode(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online-Current">Online – Current A/C</option>
                      <option value="Online-Saving">Online – Saving A/C</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  {(initialPaymentMode === "Online-Current" || initialPaymentMode === "Online-Saving" || initialPaymentMode === "Cheque") && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                        {initialPaymentMode === "Cheque" ? "Cheque No." : "UTR / Ref No."}
                      </label>
                      <input
                        value={initialPaymentRef}
                        onChange={e => setInitialPaymentRef(e.target.value)}
                        placeholder="Reference number"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop: 14, background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#6b7280" }}>Total Bill</span>
                  <span style={{ fontWeight: 600 }}>₹{totalAmount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: "#6b7280" }}>Paid Now</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>₹{paidNow}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                  <span>Balance Due</span>
                  <span style={{ color: balanceDue > 0 ? "#ef4444" : "#22c55e" }}>₹{balanceDue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              style={{
                padding: "14px", background: "#6366f1", color: "#fff", border: "none",
                borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : editId ? "✅ Update Bill" : "✅ Save Bill"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{
                padding: "12px", background: "#fff", color: "#6366f1", border: "2px solid #6366f1",
                borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14,
              }}
            >
              {editId ? "🖨️ Update & Print" : "🖨️ Save & Print"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Vendor Modal */}
      {showQuickVendor && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Quick Add Vendor</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name *</label>
                <input
                  value={quickVendorName}
                  onChange={e => setQuickVendorName(e.target.value)}
                  placeholder="Vendor name"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Phone</label>
                <input
                  value={quickVendorPhone}
                  onChange={e => setQuickVendorPhone(e.target.value)}
                  placeholder="Mobile number"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>You can add full details from the Vendors page later.</p>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowQuickVendor(false)} style={{
                flex: 1, padding: "10px", background: "#f3f4f6", border: "1px solid #d1d5db",
                borderRadius: 8, cursor: "pointer", fontWeight: 600,
              }}>Cancel</button>
              <button onClick={handleQuickAddVendor} style={{
                flex: 1, padding: "10px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
              }}>Add Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
