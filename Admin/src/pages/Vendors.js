import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  fetchVendorLedger,
  clearVendorLedger,
  recordPurchasePayment,
} from "../features/purchase/purchaseSlice";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const STATES = [
  "Gujarat","Maharashtra","Rajasthan","Madhya Pradesh","Uttar Pradesh","Delhi","Karnataka",
  "Tamil Nadu","West Bengal","Punjab","Haryana","Bihar","Odisha","Telangana","Andhra Pradesh","Other",
];

const EMPTY_FORM = {
  name: "", firmName: "", phone: "", altPhone: "", email: "",
  address: "", city: "", state: "Gujarat", pincode: "",
  gstin: "", isGSTVendor: false,
  bankName: "", accountNo: "", ifsc: "", upiId: "",
  openingBalance: 0, note: "", status: "ACTIVE",
};

export default function Vendors() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { vendors, vendorLedger, loading } = useSelector((s) => s.purchase);

  // All vendors shown — GST/Non-GST distinction is at bill level, not vendor level
  const displayedVendors = vendors;

  const displayedGrandTotal = {
    totalPurchases: vendors.reduce((a, v) => a + (v.totalPurchases || 0), 0),
    totalPaid:      vendors.reduce((a, v) => a + (v.totalPaid || 0), 0),
    totalDue:       vendors.reduce((a, v) => a + (v.totalDue || 0), 0),
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("info");
  const [ledgerModal, setLedgerModal] = useState(null);
  const [ledgerDates, setLedgerDates] = useState({ startDate: "", endDate: "" });
  const [ledgerPayModal, setLedgerPayModal] = useState(null); // { purchaseId, billNo }
  const [ledgerPayForm, setLedgerPayForm] = useState({ amount: "", mode: "Cash", referenceNo: "", note: "", date: new Date().toISOString().split("T")[0] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchVendors({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleFormChange = (field, value) => {
    if (field === "isGSTVendor") {
      setForm(f => ({ ...f, isGSTVendor: value, gstin: value ? f.gstin : "" }));
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setActiveTab("info");
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditId(v._id);
    setForm({
      name: v.name || "", firmName: v.firmName || "", phone: v.phone || "",
      altPhone: v.altPhone || "", email: v.email || "", address: v.address || "",
      city: v.city || "", state: v.state || "Gujarat", pincode: v.pincode || "",
      gstin: v.gstin || "", isGSTVendor: v.isGSTVendor || false,
      bankName: v.bankName || "", accountNo: v.accountNo || "",
      ifsc: v.ifsc || "", upiId: v.upiId || "",
      openingBalance: v.openingBalance || 0, note: v.note || "", status: v.status || "ACTIVE",
    });
    setActiveTab("info");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Vendor name is required");
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) {
      return toast.error("Phone must be 10 digits");
    }
    const action = editId
      ? dispatch(updateVendor({ id: editId, ...form }))
      : dispatch(createVendor(form));
    const res = await action;
    if (res.meta.requestStatus === "fulfilled") {
      toast.success(editId ? "Vendor updated!" : "Vendor added!");
      setShowForm(false);
      load();
    } else {
      toast.error(res.payload || "Failed to save vendor");
    }
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteVendor(id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Vendor deleted");
      setDeleteConfirm(null);
      load();
    } else {
      toast.error(res.payload || "Delete failed");
    }
  };

  const openLedger = (vendorId) => {
    setLedgerModal(vendorId);
    setLedgerDates({ startDate: "", endDate: "" });
    dispatch(fetchVendorLedger({ id: vendorId }));
  };

  const applyLedgerDates = () => {
    if (ledgerModal) dispatch(fetchVendorLedger({ id: ledgerModal, ...ledgerDates }));
  };

  const closeLedger = () => {
    setLedgerModal(null);
    dispatch(clearVendorLedger());
  };

  const handleLedgerPay = async (e) => {
    e.preventDefault();
    if (!ledgerPayForm.amount || parseFloat(ledgerPayForm.amount) <= 0) return toast.error("Enter valid amount");
    const res = await dispatch(recordPurchasePayment({ id: ledgerPayModal.purchaseId, ...ledgerPayForm }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Payment recorded!");
      setLedgerPayModal(null);
      setLedgerPayForm({ amount: "", mode: "Cash", referenceNo: "", note: "", date: new Date().toISOString().split("T")[0] });
      dispatch(fetchVendorLedger({ id: ledgerModal, ...ledgerDates }));
    } else {
      toast.error(res.payload || "Payment failed");
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      PAID:     { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
      PARTIAL:  { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" },
      PENDING:  { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
      ACTIVE:   { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
      INACTIVE: { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
    };
    const c = colors[status] || colors.PENDING;
    return (
      <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            Vepari (Vendors)
          </h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            All vendors — GST & Non-GST bills tracked per bill
          </p>
        </div>
        <button onClick={openAdd} style={{
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14,
        }}>
          + Add Vepari
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Vendors", value: displayedVendors.length, color: "#6366f1", icon: "🏪" },
          { label: "Total Purchases", value: fmt(displayedGrandTotal.totalPurchases), color: "#3b82f6", icon: "📦" },
          { label: "Total Paid", value: fmt(displayedGrandTotal.totalPaid), color: "#22c55e", icon: "✅" },
          { label: "Total Due", value: fmt(displayedGrandTotal.totalDue), color: "#ef4444", icon: "⏳" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#fff", borderRadius: 12, padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 22 }}>{card.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: card.color, marginTop: 4 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, firm, phone..."
          style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button onClick={load} style={{
          padding: "8px 16px", background: "#f3f4f6", border: "1px solid #d1d5db",
          borderRadius: 8, cursor: "pointer", fontSize: 14,
        }}>
          Refresh
        </button>
      </div>

      {/* Vendor Table */}
      {loading && !displayedVendors.length ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading...</div>
      ) : displayedVendors.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 60, background: "#fff", borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p style={{ color: "#6b7280", fontSize: 16 }}>No vendors found.</p>
          <button onClick={openAdd} style={{
            background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, cursor: "pointer",
          }}>
            + Add Vepari
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Vendor", "Phone", "City", "GST", "Bills", "Total Purchase", "Total Paid", "Balance Due", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedVendors.map((v, i) => (
                  <tr key={v._id} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                      {v.firmName && <div style={{ fontSize: 12, color: "#6b7280" }}>{v.firmName}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>{v.phone || "-"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>{v.city || "-"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {v.gstin ? (
                        <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }} title={v.gstin}>GSTIN</span>
                      ) : (
                        <span style={{ background: "#f9fafb", color: "#9ca3af", padding: "2px 8px", borderRadius: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", textAlign: "center" }}>{v.billCount || 0}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", fontWeight: 500 }}>{fmt(v.totalPurchases)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#22c55e", fontWeight: 500 }}>{fmt(v.totalPaid)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 700, color: v.totalDue > 0 ? "#ef4444" : "#22c55e", fontSize: 14 }}>
                        {fmt(v.totalDue)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={v.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => openLedger(v._id)} style={{ padding: "4px 10px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Ledger</button>
                        <button onClick={() => navigate(`/admin/add-purchase?vendor=${v._id}`)} style={{ padding: "4px 10px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>+ Bill</button>
                        <button onClick={() => openEdit(v)} style={{ padding: "4px 10px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
                        <button onClick={() => setDeleteConfirm(v)} style={{ padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Vendor Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editId ? "Edit Vendor" : "Add New Vendor"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
              {[["info", "Basic Info"], ["bank", "Bank / Payment"]].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "12px 20px", border: "none", background: "none", cursor: "pointer",
                  fontWeight: activeTab === tab ? 700 : 400,
                  color: activeTab === tab ? "#6366f1" : "#6b7280",
                  borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                  fontSize: 14,
                }}>{label}</button>
              ))}
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {activeTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Vepari Name *</label>
                      <input value={form.name} onChange={e => handleFormChange("name", e.target.value)} placeholder="e.g. Ramesh Bhai" required style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Firm / Shop Name</label>
                      <input value={form.firmName} onChange={e => handleFormChange("firmName", e.target.value)} placeholder="e.g. Ramesh Textiles" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mobile Number</label>
                      <input value={form.phone} onChange={e => handleFormChange("phone", e.target.value)} placeholder="10 digit number" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Alt. Phone</label>
                      <input value={form.altPhone} onChange={e => handleFormChange("altPhone", e.target.value)} placeholder="Optional" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Address</label>
                    <textarea value={form.address} onChange={e => handleFormChange("address", e.target.value)} placeholder="Street address..." rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>City</label>
                      <input value={form.city} onChange={e => handleFormChange("city", e.target.value)} placeholder="e.g. Surat" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>State</label>
                      <select value={form.state} onChange={e => handleFormChange("state", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pincode</label>
                      <input value={form.pincode} onChange={e => handleFormChange("pincode", e.target.value)} placeholder="000000" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ background: "#f8f9ff", borderRadius: 10, padding: 16, border: "1px solid #e0e7ff" }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#6366f1" }}>GST Info</label>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>
                      Vendor can give both GST and Non-GST bills. Select type per bill when adding a purchase.
                    </p>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                      <input type="checkbox" checked={form.isGSTVendor} onChange={e => handleFormChange("isGSTVendor", e.target.checked)} style={{ width: 18, height: 18 }} />
                      Vendor has GSTIN (registered)
                    </label>
                    {form.isGSTVendor && (
                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Vendor GSTIN</label>
                        <input value={form.gstin} onChange={e => handleFormChange("gstin", e.target.value.toUpperCase())} placeholder="e.g. 24XXXXX0000X1ZX" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #c7d2fe", fontSize: 14, boxSizing: "border-box", background: "#fff" }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Opening Balance (₹)</label>
                      <input type="number" value={form.openingBalance} onChange={e => handleFormChange("openingBalance", parseFloat(e.target.value) || 0)} placeholder="0" min="0" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Amount already owed before using this system</div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Status</label>
                      <select value={form.status} onChange={e => handleFormChange("status", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Notes</label>
                    <textarea value={form.note} onChange={e => handleFormChange("note", e.target.value)} placeholder="Any notes about this vendor..." rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                  </div>
                </div>
              )}
              {activeTab === "bank" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Add vendor's bank details for easy payment reference. This is optional.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bank Name</label>
                      <input value={form.bankName} onChange={e => handleFormChange("bankName", e.target.value)} placeholder="e.g. SBI, HDFC" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Account Number</label>
                      <input value={form.accountNo} onChange={e => handleFormChange("accountNo", e.target.value)} placeholder="Account number" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>IFSC Code</label>
                      <input value={form.ifsc} onChange={e => handleFormChange("ifsc", e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>UPI ID</label>
                      <input value={form.upiId} onChange={e => handleFormChange("upiId", e.target.value)} placeholder="e.g. ramesh@paytm" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  {loading ? "Saving..." : editId ? "Update Vendor" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Modal */}
      {ledgerModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{vendorLedger?.vendor?.name} — Ledger</h3>
                  {vendorLedger?.vendor?.firmName && <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{vendorLedger.vendor.firmName}</p>}
                </div>
                <button onClick={closeLedger} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input type="date" value={ledgerDates.startDate} onChange={e => setLedgerDates(d => ({ ...d, startDate: e.target.value }))}
                  style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13 }} />
                <span style={{ color: "#9ca3af", fontSize: 13 }}>to</span>
                <input type="date" value={ledgerDates.endDate} onChange={e => setLedgerDates(d => ({ ...d, endDate: e.target.value }))}
                  style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13 }} />
                <button onClick={applyLedgerDates} style={{ padding: "6px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Filter</button>
                {(ledgerDates.startDate || ledgerDates.endDate) && (
                  <button onClick={() => { setLedgerDates({ startDate: "", endDate: "" }); dispatch(fetchVendorLedger({ id: ledgerModal })); }}
                    style={{ padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", fontSize: 13 }}>Clear</button>
                )}
              </div>
            </div>
            {loading && !vendorLedger ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading ledger...</div>
            ) : vendorLedger ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "16px 24px", background: "#f9fafb" }}>
                  {[
                    { label: "Total Purchases", value: fmt(vendorLedger.summary.totalPurchases), color: "#3b82f6" },
                    { label: "Total Paid", value: fmt(vendorLedger.summary.totalPaid), color: "#22c55e" },
                    { label: "Balance Due", value: fmt(vendorLedger.summary.balanceDue), color: vendorLedger.summary.balanceDue > 0 ? "#ef4444" : "#22c55e" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "0 24px 24px" }}>
                  {vendorLedger.entries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No transactions yet</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Date</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Particulars</th>
                          <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>Debit (Due)</th>
                          <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Credit (Paid)</th>
                          <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Balance</th>
                          <th style={{ width: 60 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorLedger.entries.map((e, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: e.type === "PAYMENT" ? "#f0fdf4" : e.type === "OPENING" ? "#fffbeb" : "#fff" }}>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{fmtDate(e.date)}</td>
                            <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>
                              {e.description}
                              {e.billNo && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>Bill: {e.billNo}</span>}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#ef4444", fontWeight: e.debit ? 600 : 400 }}>{e.debit ? fmt(e.debit) : "-"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#22c55e", fontWeight: e.credit ? 600 : 400 }}>{e.credit ? fmt(e.credit) : "-"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: e.balance > 0 ? "#ef4444" : "#22c55e" }}>{fmt(e.balance)}</td>
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              {e.type === "BILL" && e.status !== "PAID" && (
                                <button
                                  onClick={() => { setLedgerPayModal({ purchaseId: e.purchaseId, billNo: e.billNo }); setLedgerPayForm({ amount: "", mode: "Cash", referenceNo: "", note: "", date: new Date().toISOString().split("T")[0] }); }}
                                  style={{ padding: "3px 8px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                                >Pay</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button onClick={() => { closeLedger(); navigate(`/admin/add-purchase?vendor=${ledgerModal}`); }} style={{ padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Add Bill</button>
                  <button onClick={() => window.print()} style={{ padding: "10px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Print Ledger</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Ledger Pay Modal */}
      {ledgerPayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1003, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 400, width: "100%" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Record Payment</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280" }}>
              Bill {ledgerPayModal.billNo || "-"} · {vendorLedger?.vendor?.name}
            </p>
            <form onSubmit={handleLedgerPay} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Amount Paid *</label>
                <input type="number" value={ledgerPayForm.amount} onChange={e => setLedgerPayForm(f => ({ ...f, amount: e.target.value }))} required min={1}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, fontWeight: 700, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Payment Date</label>
                <input type="date" value={ledgerPayForm.date} onChange={e => setLedgerPayForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Payment Mode</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { value: "Cash", icon: "💵", label: "Cash" },
                    { value: "Online-Current", icon: "🏦", label: "Current" },
                    { value: "Online-Saving", icon: "📱", label: "Saving" },
                    { value: "Cheque", icon: "🧾", label: "Cheque" },
                  ].map(({ value, icon, label }) => (
                    <button key={value} type="button" onClick={() => setLedgerPayForm(f => ({ ...f, mode: value }))} style={{
                      padding: "8px 4px", borderRadius: 7, cursor: "pointer", fontWeight: 600, fontSize: 11,
                      border: ledgerPayForm.mode === value ? "2px solid #6366f1" : "2px solid #e5e7eb",
                      background: ledgerPayForm.mode === value ? "#f8f9ff" : "#fff",
                      color: ledgerPayForm.mode === value ? "#6366f1" : "#374151",
                    }}>{icon}<br />{label}</button>
                  ))}
                </div>
              </div>
              {(ledgerPayForm.mode === "Online-Current" || ledgerPayForm.mode === "Online-Saving" || ledgerPayForm.mode === "Cheque") && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {ledgerPayForm.mode === "Cheque" ? "Cheque No." : "UTR / Ref No."}
                  </label>
                  <input value={ledgerPayForm.referenceNo} onChange={e => setLedgerPayForm(f => ({ ...f, referenceNo: e.target.value }))} placeholder="Reference number"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setLedgerPayModal(null)} style={{ flex: 1, padding: "11px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: "11px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                  {loading ? "Saving..." : "✅ Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1002, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Delete Vendor?</h3>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? Purchase history will remain.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 24px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} style={{ padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
