import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { deleteAEnquiry, getEnquiries, resetState, updateAEnquiry } from "../features/enquiry/enquirySlice";
import CustomModal from "../components/CustomModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable from "../components/AdminDataTable";
import ActionButtons from "../components/ActionButtons";
import { FaEnvelopeOpenText } from "react-icons/fa";

const STATUS_COLORS = {
  Submitted: "bg-yellow-50 text-yellow-700",
  Contacted: "bg-blue-50 text-blue-700",
  "In Progress": "bg-purple-50 text-purple-700",
  Resolved: "bg-green-50 text-green-700",
};

const Enquiries = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [enqId, setEnqId] = useState("");

  useEffect(() => {
    dispatch(resetState());
    dispatch(getEnquiries());
  }, []);

  const enqState = useSelector((state) => state.enquiry.enquiries);

  const setEnquiryStatus = (value, id) => {
    dispatch(updateAEnquiry({ id, enqData: value }));
  };

  const data = enqState.map((e, i) => ({
    key: e._id,
    sno: i + 1,
    name: e.name,
    email: e.email,
    mobile: e.mobile,
    status: e.status || "Submitted",
    _id: e._id,
  }));

  const columns = [
    { title: "S.No", dataIndex: "sno", width: 70, align: "center" },
    { title: "Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    { title: "Email", dataIndex: "email", render: (t) => <span className="text-gray-500 text-sm">{t}</span> },
    { title: "Mobile", dataIndex: "mobile", render: (t) => <span className="font-mono text-gray-600">{t}</span> },
    {
      title: "Status", dataIndex: "status", width: 170,
      render: (status, record) => (
        <Select
          defaultValue={status}
          size="small"
          style={{ width: 150 }}
          onChange={(val) => setEnquiryStatus(val, record._id)}
          options={["Submitted", "Contacted", "In Progress", "Resolved"].map((s) => ({ value: s, label: s }))}
        />
      ),
    },
    {
      title: "Actions", dataIndex: "_id", align: "center", width: 120,
      render: (id) => (
        <ActionButtons
          viewTo={`/admin/enquiries/${id}`}
          onDelete={() => { setEnqId(id); setOpen(true); }}
        />
      ),
    },
  ];

  const deleteEnq = () => {
    dispatch(deleteAEnquiry(enqId));
    setOpen(false);
    setTimeout(() => dispatch(getEnquiries()), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-6">
      <AdminPageHeader
        title="Enquiries"
        description="View and manage customer enquiries"
        icon={<FaEnvelopeOpenText />}
        gradient="from-blue-600 to-blue-700"
      />
      <AdminDataTable columns={columns} dataSource={data} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} enquiries` }} />
      <CustomModal hideModal={() => setOpen(false)} open={open} performAction={deleteEnq} title="Are you sure you want to delete this enquiry?" />
    </div>
  );
};

export default Enquiries;
