import React, { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllOffers, deleteAnOffer, resetOfferState } from "../features/offer/offerSlice";
import CustomModal from "../components/CustomModal";

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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="title mb-0">Offers</h3>
        <Link to="/admin/add-offer" className="btn btn-success">+ Add Offer</Link>
      </div>
      <Table columns={columns} dataSource={data} rowKey="key" />
      <CustomModal hideModal={() => setOpen(false)} open={open}
        performAction={handleDelete} title="Are you sure you want to delete this offer?" />
    </div>
  );
};

export default Offerlist;
