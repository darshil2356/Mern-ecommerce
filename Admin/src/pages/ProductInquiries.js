import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tag, Tooltip, Modal } from "antd";
import { toast } from "react-toastify";
import { FiBell, FiTrash2, FiPackage, FiUser, FiPhone, FiMail, FiChevronDown, FiChevronUp } from "react-icons/fi";
import {
  getAllInquiries,
  updateInquiryStatus,
  deleteInquiry,
  notifyRestocked,
  resetProductInquiryState,
} from "../features/productInquiry/productInquirySlice";
import AdminPageHeader from "../components/AdminPageHeader";
import CustomModal from "../components/CustomModal";

const STATUS_OPTIONS = ["Pending", "Notified", "Fulfilled"];
const STATUS_STYLE = {
  Pending:   { bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
  Notified:  { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  Fulfilled: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
};

const groupByProduct = (inquiries) => {
  const map = {};
  inquiries.forEach((inq) => {
    const pid = inq.product?._id || "unknown";
    if (!map[pid]) map[pid] = { product: inq.product, items: [] };
    map[pid].items.push(inq);
  });
  return Object.values(map);
};

const ProductInquiries = () => {
  const dispatch = useDispatch();
  const { inquiries, isLoading, notifyResult } = useSelector((s) => s.productInquiry);

  const [deleteId, setDeleteId]           = useState(null);
  const [notifyPid, setNotifyPid]         = useState(null);
  const [notifyName, setNotifyName]       = useState("");
  const [expandedPid, setExpandedPid]     = useState(null);

  useEffect(() => {
    dispatch(resetProductInquiryState());
    dispatch(getAllInquiries());
  }, []);

  useEffect(() => {
    if (notifyResult) {
      toast.success(`🔔 ${notifyResult.message}`);
      dispatch(getAllInquiries());
    }
  }, [notifyResult]);

  const grouped = groupByProduct(inquiries);

  const stats = [
    { label: "Total",    value: inquiries.length,                                          color: "#1d4ed8" },
    { label: "Pending",  value: inquiries.filter((i) => i.status === "Pending").length,   color: "#c2410c" },
    { label: "Notified", value: inquiries.filter((i) => i.status === "Notified").length,  color: "#0369a1" },
    { label: "Products", value: grouped.length,                                            color: "#7e22ce" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-6">
      <AdminPageHeader
        title="Stock Inquiries"
        description="Customers waiting for out-of-stock products — notify them when restocked"
        icon={<FiBell />}
        gradient="from-orange-500 to-orange-600"
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Product Groups */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading inquiries...</div>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#9ca3af" }}>
          <FiPackage size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 15 }}>No inquiries yet</p>
        </div>
      ) : (
        grouped.map((g) => {
          const pid      = g.product?._id;
          const isOpen   = expandedPid === pid;
          const pending  = g.items.filter((i) => i.status === "Pending").length;
          const notified = g.items.filter((i) => i.status === "Notified").length;

          return (
            <div key={pid} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16, overflow: "hidden" }}>

              {/* Product Row Header */}
              <div
                onClick={() => setExpandedPid(isOpen ? null : pid)}
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: isOpen ? "1px solid #f1f5f9" : "none" }}
              >
                {/* Image */}
                {g.product?.images?.[0]?.url ? (
                  <img src={g.product.images[0].url} alt={g.product.title}
                    style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid #eee", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FiPackage style={{ color: "#9ca3af" }} />
                  </div>
                )}

                {/* Product name — always visible */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {g.product?.title || "Unknown Product"}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, background: "#eff6ff", color: "#1d4ed8", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                      {g.items.length} inquir{g.items.length === 1 ? "y" : "ies"}
                    </span>
                    {pending > 0 && (
                      <span style={{ fontSize: 12, background: "#fff7ed", color: "#c2410c", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                        {pending} pending
                      </span>
                    )}
                    {notified > 0 && (
                      <span style={{ fontSize: 12, background: "#eff6ff", color: "#0369a1", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                        {notified} notified
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {pending > 0 && (
                    <Tooltip title="Send push notification to all pending inquirers">
                      <button
                        onClick={() => { setNotifyPid(pid); setNotifyName(g.product?.title || ""); }}
                        style={btn("#fef3c7", "#92400e")}
                      >
                        <FiBell size={13} /> Notify All
                      </button>
                    </Tooltip>
                  )}
                  <button style={btn("#f0f9ff", "#0369a1")}>
                    {isOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Inquiry Rows */}
              {isOpen && (
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 600 }}>
                  {/* Table Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 130px 40px", gap: 12, padding: "10px 20px", background: "#f8fafc", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <span>Customer</span>
                    <span>Preferences</span>
                    <span>Qty</span>
                    <span>Date</span>
                    <span>Status</span>
                    <span></span>
                  </div>

                  {g.items.map((inq) => (
                    <InquiryRow
                      key={inq._id}
                      inq={inq}
                      onDelete={() => setDeleteId(inq._id)}
                      onStatusChange={(val) => dispatch(updateInquiryStatus({ id: inq._id, status: val }))}
                    />
                  ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Delete Modal */}
      <CustomModal
        open={!!deleteId}
        hideModal={() => setDeleteId(null)}
        performAction={() => { dispatch(deleteInquiry(deleteId)); setDeleteId(null); }}
        title="Delete this inquiry?"
      />

      {/* Notify Modal */}
      <Modal
        open={!!notifyPid}
        onCancel={() => setNotifyPid(null)}
        onOk={() => { dispatch(notifyRestocked(notifyPid)); setNotifyPid(null); }}
        okText="Yes, Notify All"
        okButtonProps={{ style: { background: "#d97706", borderColor: "#d97706" } }}
        title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><FiBell style={{ color: "#d97706" }} /> Send Restock Notification</span>}
      >
        <p style={{ margin: 0, color: "#555" }}>
          Send push notification to all <strong>Pending</strong> inquirers for <strong>"{notifyName}"</strong>?
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#888" }}>
          Only users with notifications enabled will receive it.
        </p>
      </Modal>
    </div>
  );
};

// Separate component so status change only re-renders this row, not the whole page
const InquiryRow = ({ inq, onDelete, onStatusChange }) => {
  const [status, setStatus] = useState(inq.status);

  // Sync if parent data changes (e.g. after notify-all)
  useEffect(() => { setStatus(inq.status); }, [inq.status]);

  const handleChange = (val) => {
    setStatus(val);
    onStatusChange(val);
  };

  const st = STATUS_STYLE[status] || STATUS_STYLE.Pending;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 130px 40px", gap: 12, padding: "14px 20px", borderTop: "1px solid #f8fafc", alignItems: "center" }}>

      {/* Customer */}
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 5 }}>
          <FiUser size={12} style={{ color: "#9ca3af" }} />
          {inq.name}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <FiPhone size={11} /> {inq.mobile}
        </div>
        {inq.email && (
          <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            <FiMail size={11} /> {inq.email}
          </div>
        )}
        {inq.note && (
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, fontStyle: "italic" }}>"{inq.note}"</div>
        )}
      </div>

      {/* Preferences — color swatch + name, size tag */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {inq.color && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f5f5f5", padding: "3px 10px 3px 6px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#444" }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: inq.colorHex || inq.color || "#ccc", border: "1px solid rgba(0,0,0,0.1)", display: "inline-block", flexShrink: 0 }} />
            {inq.color}
          </span>
        )}
        {inq.size && (
          <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>Size: {inq.size}</Tag>
        )}
      </div>

      {/* Qty */}
      <div style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>{inq.quantity}</div>

      {/* Date */}
      <div style={{ fontSize: 12, color: "#9ca3af" }}>
        {new Date(inq.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </div>

      {/* Status — custom dropdown, no Ant Select to avoid disable bug */}
      <div style={{ position: "relative" }}>
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: "100%", padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: `1.5px solid ${st.color}`,
            background: st.bg, color: st.color,
            cursor: "pointer", outline: "none", appearance: "none",
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Delete */}
      <button onClick={onDelete} style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FiTrash2 size={14} />
      </button>
    </div>
  );
};

const btn = (bg, color) => ({
  background: bg, color, border: "none", borderRadius: 8,
  padding: "6px 12px", cursor: "pointer", fontWeight: 600,
  fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5,
});

export default ProductInquiries;
