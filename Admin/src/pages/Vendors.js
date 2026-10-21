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
import VendorStockAnalyticsModal from "../components/VendorStockAnalyticsModal";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

/**
 * Build Client-side Vendor Payment Receipt WhatsApp message
 */
const buildClientVendorPaymentMessage = ({
  vendorName,
  firmName,
  billNo,
  billDate,
  paymentDate,
  amountPaid,
  paymentMode,
  referenceNo,
  discountAmount = 0,
  grAmount = 0,
  grNote = "",
  totalSettlement,
  billTotal,
  billBalanceDue,
  billStatus,
  overallVendorBalance,
  storeName = "Yashoda Fashion",
}) => {
  const nameStr = firmName ? `${firmName} (${vendorName || "Vendor"})` : (vendorName || "Vendor");
  const dateFormatted = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const purchaseDateFormatted = billDate
    ? new Date(billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const isCleared = billStatus === "PAID" || Number(billBalanceDue || 0) <= 0.01;
  const statusStr = isCleared ? "Fully Cleared & Settled 🎉" : "Partially Cleared ⏳";

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Vendor Payment Receipt / Voucher*`,
    ``,
    `Hello *${nameStr}*,`,
    `We have processed payment towards your purchase bill. Here are the payment settlement details:`,
    ``,
    `📋 *Bill Details:*`,
    `• *Bill No:* ${billNo ? `#${billNo}` : "Purchase Bill"}`,
  ];

  if (purchaseDateFormatted) {
    lines.push(`• *Purchase / Bill Date:* ${purchaseDateFormatted}`);
  }

  if (billTotal !== undefined && billTotal !== null && Number(billTotal) > 0) {
    lines.push(`• *Bill Total:* ₹${Number(billTotal || 0).toLocaleString("en-IN")}`);
  }

  lines.push(`• *Bill Status:* ${statusStr}`);
  lines.push(``);
  lines.push(`💵 *Payment & Settlement Details:*`);
  lines.push(`• *Payment Date:* ${dateFormatted}`);
  lines.push(`• *Payment Mode:* ${paymentMode || "Cash"}`);

  if (referenceNo) {
    lines.push(`• *Ref / UTR / Cheque No:* ${referenceNo}`);
  }

  lines.push(`• *Amount Paid:* ₹${Number(amountPaid || 0).toLocaleString("en-IN")}`);

  if (Number(discountAmount) > 0) {
    lines.push(`• *Discount / Kasur:* ₹${Number(discountAmount).toLocaleString("en-IN")}`);
  }

  if (Number(grAmount) > 0) {
    lines.push(`• *Goods Return (GR):* ₹${Number(grAmount).toLocaleString("en-IN")}${grNote ? ` (${grNote})` : ""}`);
  }

  if (Number(totalSettlement) > Number(amountPaid)) {
    lines.push(`• *Total Settlement Deduction:* ₹${Number(totalSettlement).toLocaleString("en-IN")}`);
  }

  lines.push(``);

  if (isCleared) {
    lines.push(`✅ *Purchase Bill #${billNo || ""}${purchaseDateFormatted ? ` (Dated: ${purchaseDateFormatted})` : ""} is now Fully Cleared & Settled!*`);
  } else {
    lines.push(`⚠️ *Remaining Due for this Bill:* ₹${Number(billBalanceDue || 0).toLocaleString("en-IN")}`);
  }

  if (overallVendorBalance !== undefined && overallVendorBalance !== null) {
    lines.push(`📊 *Total Ledger Balance Due:* ₹${Number(overallVendorBalance || 0).toLocaleString("en-IN")}`);
  }

  lines.push(``);
  lines.push(`Thank you for your business and partnership! 🙏`);
  lines.push(`📞 Contact: 9909895645`);

  return lines.join("\n");
};

/**
 * Build Client-side Consolidated Vendor Statement WhatsApp message
 */
const buildClientVendorStatementMessage = ({
  vendorName,
  firmName,
  summary,
  storeName = "Yashoda Fashion",
}) => {
  const nameStr = firmName ? `${firmName} (${vendorName || "Vendor"})` : (vendorName || "Vendor");
  const totPurchases = Number(summary?.totalPurchases || 0);
  const totPaid = Number(summary?.totalPaid || 0);
  const balDue = Number(summary?.balanceDue || 0);

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Vendor Ledger Account Statement*`,
    ``,
    `Hello *${nameStr}*,`,
    `Here is the latest financial ledger summary of your account with us:`,
    ``,
    `📊 *Ledger Summary:*`,
    `• *Total Purchases:* ₹${totPurchases.toLocaleString("en-IN")}`,
    `• *Total Paid / Settled:* ₹${totPaid.toLocaleString("en-IN")}`,
    `• *Current Balance Due:* ₹${balDue.toLocaleString("en-IN")} ${balDue > 0 ? "⚠️ (Due)" : "✅ (Fully Clear)"}`,
    ``,
    `Thank you for your continued business and partnership! 🙏`,
    `📞 Contact: 9909895645`,
  ];

  return lines.join("\n");
};


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
  const [showStockModal, setShowStockModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("info");
  const [ledgerModal, setLedgerModal] = useState(null);
  const [ledgerDates, setLedgerDates] = useState({ startDate: "", endDate: "" });
  const [ledgerPayModal, setLedgerPayModal] = useState(null); // { purchaseId, billNo, totalAmount, balanceDue, billDate }
  const EMPTY_LEDGER_PAY_FORM = {
    amount: "",
    discountType: "NONE",
    discountValue: "",
    discountAmount: "",
    grAmount: "",
    grNote: "",
    mode: "Cash",
    referenceNo: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  };

  const [ledgerPayForm, setLedgerPayForm] = useState(EMPTY_LEDGER_PAY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // WhatsApp Prompt State
  const [whatsappPrompt, setWhatsappPrompt] = useState({
    open: false,
    title: "",
    vendorName: "",
    vendorPhone: "",
    whatsappUrl: "",
    messageText: "",
    whatsappSent: false,
  });

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
    if (deleteConfirm?.totalDue > 0) {
      toast.error(`Cannot delete: Outstanding payment of ${fmt(deleteConfirm.totalDue)} is still remaining.`);
      return;
    }
    if (deleteConfirm?.billCount > 0) {
      toast.error(`Cannot delete: ${deleteConfirm.billCount} purchase bills are linked to this vendor. Mark as Inactive instead.`);
      return;
    }
    const res = await dispatch(deleteVendor(id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Vendor deleted successfully");
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
    const paidAmt = parseFloat(ledgerPayForm.amount) || 0;
    const discVal = parseFloat(ledgerPayForm.discountValue) || 0;
    let discAmt = parseFloat(ledgerPayForm.discountAmount) || 0;
    const grAmt = parseFloat(ledgerPayForm.grAmount) || 0;

    if (paidAmt <= 0 && discAmt <= 0 && grAmt <= 0) {
      return toast.error("Please enter a valid paid, discount, or GR amount");
    }

    const res = await dispatch(recordPurchasePayment({
      id: ledgerPayModal.purchaseId,
      amount: paidAmt,
      discountType: ledgerPayForm.discountType,
      discountValue: discVal,
      discountAmount: discAmt,
      grAmount: grAmt,
      grNote: ledgerPayForm.grNote,
      mode: ledgerPayForm.mode,
      referenceNo: ledgerPayForm.referenceNo,
      note: ledgerPayForm.note,
      date: ledgerPayForm.date,
    }));

    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Payment & settlement recorded!");
      const payload = res.payload;
      const vendor = vendorLedger?.vendor;

      const billNo = ledgerPayModal.billNo || payload?.billNo || "";
      const effectiveDiscAmt = discAmt || (ledgerPayForm.discountType === "PERCENTAGE" && ledgerPayModal.totalAmount ? (ledgerPayModal.totalAmount * discVal) / 100 : (ledgerPayForm.discountType === "FLAT" ? discVal : 0));
      const totalSettlement = paidAmt + effectiveDiscAmt + grAmt;
      const remBillDue = Math.max(0, (ledgerPayModal.balanceDue !== undefined ? ledgerPayModal.balanceDue : ledgerPayModal.totalAmount || 0) - totalSettlement);

      let msg = payload?.whatsappMessage;
      let url = payload?.whatsappUrl;
      const sent = payload?.whatsappSent || false;

      if (!msg) {
        msg = buildClientVendorPaymentMessage({
          vendorName: vendor?.name || "Vendor",
          firmName: vendor?.firmName || "",
          billNo: billNo,
          billDate: ledgerPayModal.billDate,
          paymentDate: ledgerPayForm.date,
          amountPaid: paidAmt,
          paymentMode: ledgerPayForm.mode,
          referenceNo: ledgerPayForm.referenceNo,
          discountAmount: effectiveDiscAmt,
          grAmount: grAmt,
          grNote: ledgerPayForm.grNote,
          totalSettlement: totalSettlement > 0 ? totalSettlement : paidAmt,
          billTotal: ledgerPayModal.totalAmount,
          billBalanceDue: remBillDue,
          billStatus: remBillDue <= 0.01 ? "PAID" : "PARTIAL",
          overallVendorBalance: vendorLedger?.summary?.balanceDue !== undefined ? Math.max(0, vendorLedger.summary.balanceDue - totalSettlement) : undefined,
        });
      }

      const targetPhone = payload?.vendorPhone || vendor?.phone || "";
      if (!url && targetPhone) {
        const clean = targetPhone.replace(/\D/g, "");
        const intlPhone = clean.length === 10 ? `91${clean}` : clean;
        url = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}`;
      }

      setLedgerPayModal(null);
      setLedgerPayForm(EMPTY_LEDGER_PAY_FORM);

      // Open WhatsApp Dispatch / Confirmation prompt
      setWhatsappPrompt({
        open: true,
        title: `Payment Receipt — Bill #${billNo || "Purchase"}`,
        vendorName: vendor?.name || "Vendor",
        vendorPhone: targetPhone,
        whatsappUrl: url || "",
        messageText: msg,
        whatsappSent: sent,
      });

      dispatch(fetchVendorLedger({ id: ledgerModal, ...ledgerDates }));
      load();
    } else {
      toast.error(res.payload || "Payment failed");
    }
  };

  /* ── Send WhatsApp for an individual ledger payment entry ── */
  const handleSendPaymentWhatsapp = (entry) => {
    const vendor = vendorLedger?.vendor;
    const phone = vendor?.phone || "";
    const clean = phone.replace(/\D/g, "");
    const intlPhone = clean.length === 10 ? `91${clean}` : clean;

    const amountPaid = entry.amount || entry.credit || 0;
    const effectiveDiscAmt = entry.discountAmount || 0;
    const grAmt = entry.grAmount || 0;
    const totalSettlement = amountPaid + effectiveDiscAmt + grAmt;
    const remDue = entry.billBalanceDue !== undefined ? entry.billBalanceDue : (entry.balance !== undefined ? entry.balance : 0);

    const msg = buildClientVendorPaymentMessage({
      vendorName: vendor?.name || "Vendor",
      firmName: vendor?.firmName || "",
      billNo: entry.billNo,
      billDate: entry.billDate,
      paymentDate: entry.date,
      amountPaid: amountPaid,
      paymentMode: entry.paymentMode || (entry.description?.includes("Cash") ? "Cash" : entry.description?.includes("Online") ? "Online" : "Payment"),
      referenceNo: entry.referenceNo || "",
      discountAmount: effectiveDiscAmt,
      grAmount: grAmt,
      grNote: entry.grNote || "",
      totalSettlement: totalSettlement > 0 ? totalSettlement : amountPaid,
      billTotal: entry.billTotal,
      billBalanceDue: remDue,
      billStatus: entry.billStatus || (remDue <= 0.01 ? "PAID" : "PARTIAL"),
      overallVendorBalance: vendorLedger?.summary?.balanceDue,
    });

    const url = intlPhone ? `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}` : "";

    setWhatsappPrompt({
      open: true,
      title: `Payment Receipt — Bill #${entry.billNo || "Purchase"}`,
      vendorName: vendor?.name || "Vendor",
      vendorPhone: phone,
      whatsappUrl: url,
      messageText: msg,
      whatsappSent: false,
    });
  };

  /* ── Send Complete Vendor Ledger Account Statement via WhatsApp ── */
  const handleSendStatementWhatsapp = () => {
    const vendor = vendorLedger?.vendor;
    const phone = vendor?.phone || "";
    const clean = phone.replace(/\D/g, "");
    const intlPhone = clean.length === 10 ? `91${clean}` : clean;

    const msg = buildClientVendorStatementMessage({
      vendorName: vendor?.name || "Vendor",
      firmName: vendor?.firmName || "",
      summary: vendorLedger?.summary || {},
    });

    const url = intlPhone ? `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}` : "";

    setWhatsappPrompt({
      open: true,
      title: `Ledger Statement — ${vendor?.name || "Vendor"}`,
      vendorName: vendor?.name || "Vendor",
      vendorPhone: phone,
      whatsappUrl: url,
      messageText: msg,
      whatsappSent: false,
    });
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
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowStockModal(true)} style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
          }}>
            🏬 Stock Analytics
          </button>
          <button onClick={() => navigate("/admin/vendor-dashboard")} style={{
            background: "#1e293b", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 18px", fontWeight: 600, cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            📊 Vendor Dashboard
          </button>
          <button onClick={openAdd} style={{
            background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>
            + Add Vepari
          </button>
        </div>
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
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={() => openLedger(v._id)} style={{ padding: "4px 10px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Ledger</button>
                        <button onClick={() => navigate(`/admin/add-purchase?vendor=${v._id}`)} style={{ padding: "4px 10px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>+ Bill</button>
                        <button onClick={() => openEdit(v)} style={{ padding: "4px 10px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
                        <button
                          disabled={v.totalDue > 0 || v.billCount > 0}
                          onClick={() => setDeleteConfirm(v)}
                          title={
                            v.totalDue > 0
                              ? `Cannot delete: Outstanding balance of ${fmt(v.totalDue)} is still remaining`
                              : v.billCount > 0
                              ? `Cannot delete: ${v.billCount} purchase bills are linked`
                              : "Delete Vendor"
                          }
                          style={{
                            padding: "4px 10px",
                            background: (v.totalDue > 0 || v.billCount > 0) ? "#f1f5f9" : "#fef2f2",
                            color: (v.totalDue > 0 || v.billCount > 0) ? "#94a3b8" : "#dc2626",
                            border: `1px solid ${(v.totalDue > 0 || v.billCount > 0) ? "#e2e8f0" : "#fecaca"}`,
                            borderRadius: 6,
                            cursor: (v.totalDue > 0 || v.billCount > 0) ? "not-allowed" : "pointer",
                            fontSize: 12,
                            opacity: (v.totalDue > 0 || v.billCount > 0) ? 0.65 : 1,
                          }}
                        >
                          Delete
                        </button>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                    {vendorLedger?.vendor?.firmName && <span style={{ fontSize: 13, color: "#6b7280" }}>{vendorLedger.vendor.firmName}</span>}
                    {vendorLedger?.vendor?.phone && (
                      <span style={{ fontSize: 12, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        📞 {vendorLedger.vendor.phone}
                      </span>
                    )}
                  </div>
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
                          <th style={{ width: 105, textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorLedger.entries.map((e, i) => {
                          const bg = e.type === "PAYMENT" ? "#f0fdf4" : e.type === "DISCOUNT" ? "#fffbeb" : e.type === "GR" ? "#ecfdf5" : e.type === "OPENING" ? "#fefce8" : "#fff";
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: bg }}>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>{fmtDate(e.date)}</td>
                              <td style={{ padding: "10px 12px", fontSize: 13, color: "#374151" }}>
                                {e.type === "DISCOUNT" ? "🏷️ " : e.type === "GR" ? "📦 " : e.type === "PAYMENT" ? "💵 " : ""}
                                <strong>{e.description}</strong>
                                {e.billNo && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6 }}>Bill #{e.billNo}</span>}
                              </td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: "#ef4444", fontWeight: e.debit ? 600 : 400 }}>{e.debit ? fmt(e.debit) : "-"}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, color: e.type === "DISCOUNT" ? "#b45309" : e.type === "GR" ? "#166534" : "#22c55e", fontWeight: e.credit ? 600 : 400 }}>
                                {e.credit ? fmt(e.credit) : "-"}
                              </td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 13, fontWeight: 700, color: e.balance > 0 ? "#ef4444" : "#22c55e" }}>{fmt(e.balance)}</td>
                              <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                {e.type === "BILL" && e.status !== "PAID" && (
                                  <button
                                    onClick={() => {
                                      setLedgerPayModal({
                                        purchaseId: e.purchaseId,
                                        billNo: e.billNo,
                                        totalAmount: e.debit,
                                        balanceDue: e.balanceDue !== undefined ? e.balanceDue : e.balance,
                                        billDate: e.date,
                                      });
                                      setLedgerPayForm(EMPTY_LEDGER_PAY_FORM);
                                    }}
                                    style={{ padding: "4px 10px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                                  >Pay</button>
                                )}
                                {e.type === "PAYMENT" && (
                                  <button
                                    onClick={() => handleSendPaymentWhatsapp(e)}
                                    title="Send WhatsApp payment receipt to vendor"
                                    style={{
                                      padding: "4px 8px",
                                      background: "#25D366",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: 6,
                                      cursor: "pointer",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                    }}
                                  >
                                    💬 WhatsApp
                                  </button>
                                )}
                                {(e.type === "DISCOUNT" || e.type === "GR") && (
                                  <button
                                    onClick={() => handleSendPaymentWhatsapp(e)}
                                    title="Share details on WhatsApp"
                                    style={{
                                      padding: "3px 6px",
                                      background: "#f0fdf4",
                                      color: "#166534",
                                      border: "1px solid #86efac",
                                      borderRadius: 5,
                                      cursor: "pointer",
                                      fontSize: 10,
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 2,
                                    }}
                                  >
                                    💬 Share
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    onClick={handleSendStatementWhatsapp}
                    style={{
                      padding: "10px 18px",
                      background: "#25D366",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 4px rgba(37,211,102,0.2)",
                    }}
                  >
                    💬 Send Statement via WhatsApp
                  </button>
                  <button onClick={() => { closeLedger(); navigate(`/admin/add-purchase?vendor=${ledgerModal}`); }} style={{ padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Add Bill</button>
                  <button onClick={() => window.print()} style={{ padding: "10px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Print Ledger</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Ledger Pay Modal */}
      {ledgerPayModal && (() => {
        const discVal = parseFloat(ledgerPayForm.discountValue) || 0;
        const calcDiscAmt = ledgerPayForm.discountType === "PERCENTAGE" && ledgerPayModal.totalAmount ? (ledgerPayModal.totalAmount * discVal) / 100 : (ledgerPayForm.discountType === "FLAT" ? discVal : 0);
        const effectiveDiscAmt = parseFloat(ledgerPayForm.discountAmount) || calcDiscAmt;
        const grAmt = parseFloat(ledgerPayForm.grAmount) || 0;
        const paidAmt = parseFloat(ledgerPayForm.amount) || 0;
        const totalSettlement = paidAmt + effectiveDiscAmt + grAmt;

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1003, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Record Payment & Settlement</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                    Bill #{ledgerPayModal.billNo || "-"} · {vendorLedger?.vendor?.name}
                  </p>
                </div>
                <button onClick={() => setLedgerPayModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>

              <form onSubmit={handleLedgerPay} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* 1. Cash / Online Paid */}
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, border: "1px solid #e5e7eb" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#111" }}>💵 Money Paid (Cash / Bank)</label>
                  <input
                    type="number"
                    value={ledgerPayForm.amount}
                    onChange={e => setLedgerPayForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    min={0}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, fontWeight: 700, boxSizing: "border-box" }}
                  />

                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#6b7280" }}>Payment Mode</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                      {[
                        { value: "Cash",           icon: "💵", label: "Cash" },
                        { value: "Online-Current", icon: "🏦", label: "Current" },
                        { value: "Online-Saving",  icon: "📱", label: "Saving" },
                        { value: "Cheque",         icon: "🧾", label: "Cheque" },
                      ].map(({ value, icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLedgerPayForm(f => ({ ...f, mode: value }))}
                          style={{
                            padding: "6px 4px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
                            border: ledgerPayForm.mode === value ? "2px solid #6366f1" : "2px solid #e5e7eb",
                            background: ledgerPayForm.mode === value ? "#f8f9ff" : "#fff",
                            color: ledgerPayForm.mode === value ? "#6366f1" : "#374151",
                          }}
                        >
                          {icon}<br />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(ledgerPayForm.mode === "Online-Current" || ledgerPayForm.mode === "Online-Saving" || ledgerPayForm.mode === "Cheque") && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        value={ledgerPayForm.referenceNo}
                        onChange={e => setLedgerPayForm(f => ({ ...f, referenceNo: e.target.value }))}
                        placeholder={ledgerPayForm.mode === "Cheque" ? "Cheque Number" : "UTR / Transaction ID"}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Vendor Discount (Kasur) */}
                <div style={{ background: "#fffbeb", borderRadius: 10, padding: 12, border: "1px solid #fde68a" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#92400e" }}>🏷️ Vendor Discount (Kasur Cut)</label>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {[
                      { value: "NONE", label: "No Disc" },
                      { value: "PERCENTAGE", label: "% Percentage" },
                      { value: "FLAT", label: "₹ Flat Disc" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLedgerPayForm(f => ({ ...f, discountType: opt.value, discountValue: "", discountAmount: "" }))}
                        style={{
                          flex: 1, padding: "5px 4px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
                          border: ledgerPayForm.discountType === opt.value ? "2px solid #d97706" : "1px solid #fcd34d",
                          background: ledgerPayForm.discountType === opt.value ? "#fff" : "#fffbeb",
                          color: ledgerPayForm.discountType === opt.value ? "#b45309" : "#78350f",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {ledgerPayForm.discountType !== "NONE" && (
                    <div>
                      <input
                        type="number"
                        value={ledgerPayForm.discountValue}
                        onChange={e => setLedgerPayForm(f => ({ ...f, discountValue: e.target.value }))}
                        placeholder={ledgerPayForm.discountType === "PERCENTAGE" ? "e.g. 5 (%)" : "e.g. 5000 (₹)"}
                        min={0}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #fcd34d", fontSize: 14, fontWeight: 700, boxSizing: "border-box", background: "#fff" }}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Goods Return (GR) */}
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 12, border: "1px solid #bbf7d0" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#166534" }}>📦 Goods Return (GR Cut)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8 }}>
                    <input
                      type="number"
                      value={ledgerPayForm.grAmount}
                      onChange={e => setLedgerPayForm(f => ({ ...f, grAmount: e.target.value }))}
                      placeholder="GR Amt (₹)"
                      min={0}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #86efac", fontSize: 14, fontWeight: 700, boxSizing: "border-box", background: "#fff" }}
                    />
                    <input
                      value={ledgerPayForm.grNote}
                      onChange={e => setLedgerPayForm(f => ({ ...f, grNote: e.target.value }))}
                      placeholder="GR Reason / Note"
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #86efac", fontSize: 12, boxSizing: "border-box", background: "#fff" }}
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Payment Date</label>
                  <input
                    type="date"
                    value={ledgerPayForm.date}
                    onChange={e => setLedgerPayForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                {/* Total Settlement Box */}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10, border: "1px solid #cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                    <span>Total Settlement Deduction:</span>
                    <span>{fmt(totalSettlement)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setLedgerPayModal(null)} style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: "10px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                    {loading ? "Saving..." : "✅ Confirm Settlement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1002, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 440, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {deleteConfirm.totalDue > 0 ? "🚫" : "⚠️"}
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: deleteConfirm.totalDue > 0 ? "#dc2626" : "#1e293b" }}>
              {deleteConfirm.totalDue > 0 ? "Deletion Blocked: Payment Due" : "Delete Vendor?"}
            </h3>
            <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
              Vendor: <strong>{deleteConfirm.firmName ? `${deleteConfirm.firmName} (${deleteConfirm.name})` : deleteConfirm.name}</strong>
            </p>

            {deleteConfirm.totalDue > 0 ? (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: 14, marginBottom: 20, textAlign: "left" }}>
                <div style={{ color: "#b91c1c", fontWeight: 700, fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️</span> Outstanding Payment Remaining
                </div>
                <div style={{ color: "#7f1d1d", fontSize: 13, lineHeight: 1.5 }}>
                  This vendor has an unpaid balance of <strong style={{ color: "#dc2626" }}>{fmt(deleteConfirm.totalDue)}</strong> across {deleteConfirm.billCount || 1} bill(s).
                  <br />
                  <strong>You cannot delete a vendor while payments are pending.</strong> Please clear and settle all bills first.
                </div>
              </div>
            ) : deleteConfirm.billCount > 0 ? (
              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: 14, marginBottom: 20, textAlign: "left" }}>
                <div style={{ color: "#b45309", fontWeight: 700, fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📋</span> Purchase Bills History Linked
                </div>
                <div style={{ color: "#92400e", fontSize: 13, lineHeight: 1.5 }}>
                  This vendor is linked to <strong>{deleteConfirm.billCount} purchase bill(s)</strong>. To keep financial accounting and ledger intact, change their status to <strong>INACTIVE</strong> instead of deleting.
                </div>
              </div>
            ) : (
              <p style={{ color: "#4b5563", marginBottom: 20, fontSize: 13 }}>
                Are you sure you want to permanently delete this vendor? This action cannot be undone.
              </p>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: "10px 24px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirm.totalDue > 0 || deleteConfirm.billCount > 0}
                onClick={() => handleDelete(deleteConfirm._id)}
                style={{
                  padding: "10px 24px",
                  background: (deleteConfirm.totalDue > 0 || deleteConfirm.billCount > 0) ? "#e2e8f0" : "#ef4444",
                  color: (deleteConfirm.totalDue > 0 || deleteConfirm.billCount > 0) ? "#94a3b8" : "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: (deleteConfirm.totalDue > 0 || deleteConfirm.billCount > 0) ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {deleteConfirm.totalDue > 0 ? "Cannot Delete (Due Pending)" : deleteConfirm.billCount > 0 ? "Cannot Delete (Bills Exist)" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp Receipt & Statement Modal ── */}
      {whatsappPrompt.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1004,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setWhatsappPrompt(p => ({ ...p, open: false }))}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#15803d", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>📱</span> {whatsappPrompt.title || "Vendor Payment Receipt"}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Vendor: <strong>{whatsappPrompt.vendorName}</strong>
                </p>
              </div>
              <button
                onClick={() => setWhatsappPrompt(p => ({ ...p, open: false }))}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>

            {/* Status indicator */}
            <div style={{ marginBottom: 14 }}>
              {whatsappPrompt.whatsappSent ? (
                <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, color: "#166534", fontWeight: 700, fontSize: 13 }}>
                  ✅ Automatically dispatched to vendor via WhatsApp Cloud API!
                </div>
              ) : (
                <div style={{ padding: "10px 14px", background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, color: "#854d0e", fontWeight: 600, fontSize: 13 }}>
                  💡 Send WhatsApp payment receipt to <strong>{whatsappPrompt.vendorName}</strong>
                </div>
              )}
            </div>

            {/* Vendor WhatsApp Phone Number Input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                Vendor WhatsApp Number
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={whatsappPrompt.vendorPhone}
                  onChange={(e) => {
                    const newPhone = e.target.value;
                    const clean = newPhone.replace(/\D/g, "");
                    const intlPhone = clean.length === 10 ? `91${clean}` : clean;
                    const newUrl = intlPhone ? `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(whatsappPrompt.messageText)}` : "";
                    setWhatsappPrompt(p => ({ ...p, vendorPhone: newPhone, whatsappUrl: newUrl }));
                  }}
                  placeholder="e.g. 9876543210 (10 digits)"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
              </div>
              {!whatsappPrompt.vendorPhone && (
                <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>
                  ⚠️ Enter vendor phone number to open WhatsApp
                </span>
              )}
            </div>

            {/* Message Preview Box */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Message Preview:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappPrompt.messageText);
                    toast.success("Receipt message copied to clipboard!");
                  }}
                  style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  📋 Copy Message
                </button>
              </div>
              <div
                style={{
                  background: "#f8fafc",
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 12,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  color: "#1e293b",
                  maxHeight: 180,
                  overflowY: "auto",
                  border: "1px solid #cbd5e1",
                  lineHeight: 1.55,
                }}
              >
                {whatsappPrompt.messageText}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  let targetUrl = whatsappPrompt.whatsappUrl;
                  if (!targetUrl && whatsappPrompt.vendorPhone) {
                    const clean = whatsappPrompt.vendorPhone.replace(/\D/g, "");
                    const intl = clean.length === 10 ? `91${clean}` : clean;
                    targetUrl = `https://api.whatsapp.com/send?phone=${intl}&text=${encodeURIComponent(whatsappPrompt.messageText)}`;
                  }
                  if (!targetUrl) {
                    toast.warn("Please enter a WhatsApp phone number first");
                    return;
                  }
                  window.open(targetUrl, "_blank");
                  setWhatsappPrompt(p => ({ ...p, open: false }));
                }}
                style={{
                  flex: 2,
                  padding: "12px",
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 2px 6px rgba(37,211,102,0.3)",
                }}
              >
                💬 Open WhatsApp Now
              </button>
              <button
                type="button"
                onClick={() => setWhatsappPrompt(p => ({ ...p, open: false }))}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Stock Wise Analytics Modal */}
      <VendorStockAnalyticsModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
      />
    </div>
  );
}
