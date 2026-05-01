import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteACoupon, getAllCoupon, resetState } from "../features/coupon/couponSlice";
import CustomModal from "../components/CustomModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable from "../components/AdminDataTable";
import ActionButtons from "../components/ActionButtons";
import { FaTicketAlt, FaPlus } from "react-icons/fa";

const Couponlist = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [couponId, setCouponId] = useState("");

  useEffect(() => {
    dispatch(resetState());
    dispatch(getAllCoupon());
  }, []);

  const couponState = useSelector((state) => state.coupon.coupons);

  const data = couponState.map((c, i) => ({
    key: c._id,
    sno: i + 1,
    name: c.name,
    discount: `${c.discount}%`,
    expiry: new Date(c.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    _id: c._id,
  }));

  const columns = [
    { title: "S.No", dataIndex: "sno", width: 80, align: "center" },
    { title: "Coupon Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    { title: "Discount", dataIndex: "discount", sorter: (a, b) => parseFloat(a.discount) - parseFloat(b.discount), render: (t) => <span className="text-green-600 font-semibold">{t}</span> },
    { title: "Expiry", dataIndex: "expiry", render: (t) => <span className="text-gray-500">{t}</span> },
    {
      title: "Actions", dataIndex: "_id", align: "center", width: 120,
      render: (id) => (
        <ActionButtons
          editTo={`/admin/coupon/${id}`}
          onDelete={() => { setCouponId(id); setOpen(true); }}
        />
      ),
    },
  ];

  const deleteCoupon = () => {
    dispatch(deleteACoupon(couponId));
    setOpen(false);
    setTimeout(() => dispatch(getAllCoupon()), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-6">
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons"
        icon={<FaTicketAlt />}
        gradient="from-pink-600 to-pink-700"
        actionButton={
          <Link to="/admin/coupon" className="flex items-center gap-2 px-5 py-2.5 bg-white text-pink-600 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-md">
            <FaPlus className="text-sm" /> Add Coupon
          </Link>
        }
      />
      <AdminDataTable columns={columns} dataSource={data} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} coupons` }} />
      <CustomModal hideModal={() => setOpen(false)} open={open} performAction={deleteCoupon} title="Are you sure you want to delete this coupon?" />
    </div>
  );
};

export default Couponlist;
