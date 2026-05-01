import React, { useEffect, useState } from "react";
import { Table, Tag, Pagination } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllOffers, deleteAnOffer, resetOfferState } from "../features/offer/offerSlice";
import CustomModal from "../components/CustomModal";

const useIsMobile = () => {
  const [m, setM] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const TYPE_COLORS = {
  BUY_X_FOR_PRICE: "orange",
  BUY_X_GET_Y_FREE: "green",
  FLAT_OFF: "blue",
  PERCENT_OFF: "purple",
  MIN_QTY_DISCOUNT: "cyan",
};

const TYPE_LABELS = {
  BUY_X_FOR_PRICE: "Buy X for Price",
  BUY_X_GET_Y_FREE: "Buy X Get Y Free",
  FLAT_OFF: "Flat Off",
  PERCENT_OFF: "% Off",
  MIN_QTY_DISCOUNT: "Min Qty Discount",
};

const Offerlist = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [offerId, setOfferId] = useState("");

  useEffect(() => {
    dispatch(resetOfferState());
    dispatch(getAllOffers());
  }, []);

  const offers = useSelector((s) => s.offer.offers);

  useEffect(() => { setMobilePage(1); }, [offers?.length]);

  const handleDelete = () => {
    dispatch(deleteAnOffer(offerId));
    setOpen(false);
    setTimeout(() => dispatch(getAllOffers()), 200);
  };

  const offerDetail = (o) => {
    if (o.offerType === "BUY_X_FOR_PRICE") return `Buy ${o.buyQty} for ₹${o.fixedPrice}`;
    if (o.offerType === "BUY_X_GET_Y_FREE") return `Buy ${o.buyQty} Get ${o.getFreeQty} Free`;
    if (o.offerType === "FLAT_OFF") return `₹${o.discountAmount} off`;
    if (o.offerType === "PERCENT_OFF") return `${o.discountPercent}% off`;
    if (o.offerType === "MIN_QTY_DISCOUNT") return `Buy ${o.minQty}+, get ${o.discountPercent}% off`;
    return "-";
  };

  const columns = [
    { title: "#", dataIndex: "key", width: 50 },
    { title: "Title", dataIndex: "title" },
    {
      title: "Type",
      dataIndex: "offerType",
      render: (t) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t]}</Tag>,
    },
    { title: "Offer Detail", dataIndex: "detail" },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>,
    },
    { title: "End Date", dataIndex: "endDate" },
    { title: "Action", dataIndex: "action" },
  ];

  const data = offers.map((o, i) => ({
    key: i + 1,
    title: o.title,
    offerType: o.offerType,
    detail: offerDetail(o),
    isActive: o.isActive,
    endDate: new Date(o.endDate).toLocaleDateString(),
    action: (
      <>
        <Link to={`/admin/offer/${o._id}`} className="fs-3 text-danger"><BiEdit /></Link>
        <button className="ms-3 fs-3 text-danger bg-transparent border-0"
          onClick={() => { setOfferId(o._id); setOpen(true); }}>
          <AiFillDelete />
        </button>
      </>
    ),
  }));

  const isMobile = useIsMobile();
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 10;

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="title mb-0">Offers</h3>
        <Link to="/admin/add-offer" className="btn btn-success">+ Add Offer</Link>
      </div>

      {isMobile ? (
        <div>
          {data.slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize).map((o) => (
            <div key={o.key} style={{ background: "#fff", borderRadius: 12, border: "1px solid #f0f0f0", marginBottom: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "10px 14px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{o.title}</span>
                <Tag color={TYPE_COLORS[o.offerType]}>{TYPE_LABELS[o.offerType]}</Tag>
              </div>
              <div style={{ padding: "8px 14px" }}>
                {[
                  { label: "Detail", value: o.detail },
                  { label: "Status", value: <Tag color={o.isActive ? "green" : "red"}>{o.isActive ? "Active" : "Inactive"}</Tag> },
                  { label: "End Date", value: o.endDate },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < arr.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", minWidth: 70 }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: "#374151" }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Link to={`/admin/offer/${offers.find((_, i) => i + 1 === o.key)?._id}`} style={{ flex: 1 }}>
                    <button style={{ width: "100%", padding: "7px", borderRadius: 8, background: "#eff6ff", color: "#3b82f6", border: "1.5px solid #bfdbfe", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>✏️ Edit</button>
                  </Link>
                  <button onClick={() => { setOfferId(offers.find((_, i) => i + 1 === o.key)?._id); setOpen(true); }} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
          {data.length > mobilePageSize && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <Pagination current={mobilePage} pageSize={mobilePageSize} total={data.length} onChange={setMobilePage} size="small" showSizeChanger={false} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Table columns={columns} dataSource={data} rowKey="key" scroll={{ x: 800 }} pagination={{ showSizeChanger: true, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t}` }} />
        </div>
      )}

      <CustomModal hideModal={() => setOpen(false)} open={open}
        performAction={handleDelete} title="Are you sure you want to delete this offer?" />
    </div>
  );
};

export default Offerlist;
