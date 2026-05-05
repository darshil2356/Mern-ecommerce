import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Tooltip, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../features/customers/customerSlice";
import { FaSearch, FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserPlus, FaEye, FaUsers, FaTag } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CustomModal from "../components/CustomModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable from "../components/AdminDataTable";

const Customers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => { dispatch(getCustomers()); }, [dispatch]);

  const customerState = useSelector((state) => state.customer.customers);

  const filteredCustomers = customerState?.filter((c) =>
    c.firstname?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.lastname?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.mobile?.includes(searchText)
  );

  const showDeleteModal = (customer) => { setCustomerToDelete(customer); setDeleteModalOpen(true); };

  const handleDelete = () => {
    if (customerToDelete) {
      dispatch(deleteCustomer(customerToDelete._id)).then(() => {
        setDeleteModalOpen(false);
        setCustomerToDelete(null);
      });
    }
  };

  const handleSubmit = (values) => {
    if (editingCustomer) {
      dispatch(updateCustomer({ id: editingCustomer._id, customerData: values })).then((action) => {
        if (action.type.endsWith("/rejected")) {
          message.error(action.payload || "Failed to update customer");
          return;
        }
        setOpen(false); form.resetFields(); setEditingCustomer(null);
      });
    } else {
      dispatch(createCustomer(values)).then((action) => {
        if (action.type.endsWith("/rejected")) {
          message.error(action.payload || "Failed to create customer");
          return;
        }
        setOpen(false); form.resetFields();
      });
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      firstname: customer.firstname,
      lastname: customer.lastname,
      email: customer.email,
      mobile: customer.mobile,
      address: customer.address || "",
      referredByMobile: customer.referredByMobile || "",
    });
    setOpen(true);
  };

  const handleCancel = () => { setOpen(false); form.resetFields(); setEditingCustomer(null); };

  const getInitials = (first, last) => `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

  const avatarColors = ["#667eea", "#f093fb", "#4facfe", "#43e97b", "#fa709a", "#a18cd1", "#fda085", "#84fab0"];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const columns = [
    {
      title: "#",
      dataIndex: "key",
      key: "key",
      width: 60,
      render: (_, __, index) => (
        <span className="text-gray-400 font-medium text-sm">{index + 1}</span>
      ),
    },
    {
      title: "Customer",
      key: "name",
      sorter: (a, b) => a.firstname?.localeCompare(b.firstname),
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${getAvatarColor(record.firstname)}, ${getAvatarColor(record.lastname)})` }}
          >
            {getInitials(record.firstname, record.lastname) || <FaUser size={14} />}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 text-sm leading-tight">
              {record.firstname} {record.lastname}
            </div>
            <div className="text-gray-400 text-xs truncate">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
      render: (mobile) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
            <FaPhone className="text-green-500" size={10} />
          </div>
          <span className="font-mono text-sm text-gray-600">{mobile || <span className="text-gray-300">—</span>}</span>
        </div>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      responsive: ["md"],
      render: (address) => (
        <Tooltip title={address}>
          <div className="flex items-center gap-2 max-w-[180px]">
            <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
              <FaMapMarkerAlt className="text-purple-400" size={10} />
            </div>
            <span className="text-gray-500 text-sm truncate">{address || <span className="text-gray-300">—</span>}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Referral Code",
      dataIndex: "referralCode",
      key: "referralCode",
      responsive: ["lg"],
      render: (code) => code
        ? <span className="font-mono text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{code}</span>
        : <span className="text-gray-300 text-xs">—</span>,
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg"],
      render: (date) => (
        <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-md">
          {date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-1.5">
          <Tooltip title="View Details">
            <button
              onClick={() => navigate(`/admin/customer/${record._id}`)}
              className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all duration-200 border-0 cursor-pointer"
            >
              <FaEye size={12} />
            </button>
          </Tooltip>
          <Tooltip title="Edit">
            <button
              onClick={() => handleEdit(record)}
              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all duration-200 border-0 cursor-pointer"
            >
              <FaEdit size={12} />
            </button>
          </Tooltip>
          <Tooltip title="Delete">
            <button
              onClick={() => showDeleteModal(record)}
              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-200 border-0 cursor-pointer"
            >
              <FaTrash size={12} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const data1 = filteredCustomers?.map((item, index) => ({
    key: index + 1, _id: item._id, firstname: item.firstname, lastname: item.lastname,
    email: item.email, mobile: item.mobile, address: item.address || "", createdAt: item.createdAt,
    referralCode: item.referralCode,
    referredByMobile: item.referredBy?.mobile || item.referredBy || "",
  })) || [];

  const totalCustomers = customerState?.length || 0;
  const customersWithMobile = customerState?.filter((c) => c.mobile).length || 0;
  const customersWithAddress = customerState?.filter((c) => c.address).length || 0;

  const stats = [
    { label: "Total Customers", value: totalCustomers, icon: <FaUsers size={18} />, color: "blue", bg: "from-blue-500 to-blue-600" },
    { label: "With Mobile", value: customersWithMobile, icon: <FaPhone size={18} />, color: "emerald", bg: "from-emerald-500 to-emerald-600" },
    { label: "With Address", value: customersWithAddress, icon: <FaMapMarkerAlt size={18} />, color: "purple", bg: "from-purple-500 to-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/80 p-2 sm:p-4 lg:p-6">
      <AdminPageHeader
        title="Customers"
        description="Manage and track your customer base"
        actionButton={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 border-0 cursor-pointer"
          >
            <FaUserPlus size={14} />
            Add Customer
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-0.5">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold text-sm">All Customers</span>
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">{data1.length}</span>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, email, mobile..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-gray-50 transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          </div>
        </div>

        <AdminDataTable
          columns={columns}
          dataSource={data1}
          rowKey="_id"
          paginationOptions={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <FaUserPlus size={14} />
            </div>
            <span className="text-base font-semibold text-gray-800">
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </span>
          </div>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={540}
        className="customer-modal"
        centered
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="firstname" label={<span className="text-gray-600 text-sm font-medium">First Name</span>} rules={[{ required: true, message: "Required" }, { min: 2, message: "Min 2 chars" }]}>
              <Input prefix={<FaUser className="text-gray-300" size={12} />} placeholder="First name" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item name="lastname" label={<span className="text-gray-600 text-sm font-medium">Last Name</span>} rules={[{ required: true, message: "Required" }, { min: 2, message: "Min 2 chars" }]}>
              <Input prefix={<FaUser className="text-gray-300" size={12} />} placeholder="Last name" size="large" className="rounded-xl" />
            </Form.Item>
          </div>
          <Form.Item name="email" label={<span className="text-gray-600 text-sm font-medium">Email Address</span>} rules={[{ required: true, message: "Required" }, { type: "email", message: "Invalid email" }]}>
            <Input prefix={<FaEnvelope className="text-gray-300" size={12} />} placeholder="email@example.com" size="large" className="rounded-xl" />
          </Form.Item>
          <Form.Item name="mobile" label={<span className="text-gray-600 text-sm font-medium">Mobile Number</span>} rules={[{ required: true, message: "Required" }, { pattern: /^[0-9]{10}$/, message: "Must be 10 digits" }]}>
            <Input prefix={<FaPhone className="text-gray-300" size={12} />} placeholder="10-digit mobile" size="large" maxLength={10} className="rounded-xl" />
          </Form.Item>
          <Form.Item name="address" label={<span className="text-gray-600 text-sm font-medium">Address <span className="text-gray-400 font-normal">(optional)</span></span>}>
            <Input.TextArea placeholder="Enter address" rows={3} className="rounded-xl" />
          </Form.Item>
          {!editingCustomer && (
            <Form.Item
              name="referralCode"
              label={<span className="text-gray-600 text-sm font-medium">Referral Code <span className="text-gray-400 font-normal">(optional — auto-generated if blank)</span></span>}
              rules={[{ pattern: /^[A-Z0-9]{4,12}$/i, message: "4–12 alphanumeric chars" }]}
            >
              <Input
                prefix={<FaTag className="text-gray-300" size={12} />}
                placeholder="e.g. JOHN123"
                size="large"
                className="rounded-xl"
                onChange={(e) => form.setFieldValue("referralCode", e.target.value.toUpperCase())}
              />
            </Form.Item>
          )}
          <Form.Item
            name="referredByMobile"
            label={<span className="text-gray-600 text-sm font-medium">Referred By Mobile <span className="text-gray-400 font-normal">(optional)</span></span>}
            rules={[{ pattern: /^[0-9]{10}$/, message: "Must be 10 digits" }]}
          >
            <Input
              prefix={<FaPhone className="text-gray-300" size={12} />}
              placeholder="Referrer's 10-digit mobile"
              size="large"
              maxLength={10}
              className="rounded-xl"
            />
          </Form.Item>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 h-11 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-200 cursor-pointer border-0">
              {editingCustomer ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </Form>
      </Modal>

      <CustomModal
        hideModal={() => setDeleteModalOpen(false)}
        open={deleteModalOpen}
        performAction={handleDelete}
        title="Are you sure you want to delete this customer?"
      />


    </div>
  );
};

export default Customers;
