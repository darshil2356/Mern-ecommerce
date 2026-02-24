import React, { useEffect, useState } from "react";
import { Table, Modal, Form, Input, Avatar, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../features/customers/customerSlice";
import { FaSearch, FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserPlus } from "react-icons/fa";
import CustomModal from "../components/CustomModal";

const Customers = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    dispatch(getCustomers());
  }, [dispatch]);

  const customerState = useSelector((state) => state.customer.customers);

  // Filter customers based on search
  const filteredCustomers = customerState?.filter((customer) =>
    customer.firstname?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.lastname?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.mobile?.includes(searchText)
  );

  const showDeleteModal = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (customerToDelete) {
      dispatch(deleteCustomer(customerToDelete._id)).then(() => {
        dispatch(getCustomers());
        setDeleteModalOpen(false);
        setCustomerToDelete(null);
      });
    }
  };

  const handleSubmit = (values) => {
    if (editingCustomer) {
      dispatch(updateCustomer({ id: editingCustomer._id, customerData: values })).then(() => {
        dispatch(getCustomers());
        setOpen(false);
        form.resetFields();
        setEditingCustomer(null);
      });
    } else {
      dispatch(createCustomer(values)).then(() => {
        dispatch(getCustomers());
        setOpen(false);
        form.resetFields();
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
      address: customer.address,
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    setEditingCustomer(null);
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "key",
      key: "key",
      width: 70,
      render: (text, record, index) => (
        <span className="text-gray-500 font-medium">{index + 1}</span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.firstname.localeCompare(b.firstname),
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size={48}
            className="rounded-lg bg-blue-50 text-blue-600"
            icon={<FaUser />}
          />
          <div>
            <div className="font-semibold text-gray-900">
              {record.firstname} {record.lastname}
            </div>
            <div className="text-gray-500 text-sm">{record.email}</div>
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
          <FaPhone className="text-gray-400 text-xs" />
          <span className="font-mono text-sm">{mobile || '-'}</span>
        </div>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (address) => (
        <Tooltip title={address}>
          <div className="truncate max-w-[200px]">
            {address ? (
              <span className="text-gray-500">{address}</span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-gray-500">
          {date ? new Date(date).toLocaleDateString('en-IN') : '-'}
        </span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Edit Customer">
            <button
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border-none cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleEdit(record)}
            >
              <FaEdit size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Delete Customer">
            <button
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 border-none cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => showDeleteModal(record)}
            >
              <FaTrash size={14} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const data1 = filteredCustomers?.map((item, index) => ({
    key: index + 1,
    _id: item._id,
    firstname: item.firstname,
    lastname: item.lastname,
    email: item.email,
    mobile: item.mobile,
    address: item.address,
    createdAt: item.createdAt,
  })) || [];

  // Calculate stats
  const totalCustomers = customerState?.length || 0;
  const customersWithMobile = customerState?.filter(c => c.mobile).length || 0;
  const customersWithAddress = customerState?.filter(c => c.address).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                Customers
              </h2>
              <p className="text-gray-500 text-sm mb-0">
                Manage your customer database and information
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full sm:w-64 h-10 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button
                onClick={() => setOpen(true)}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <FaUserPlus />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Customers</p>
              <h3 className="text-2xl font-semibold text-gray-800">{totalCustomers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FaUser size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">With Mobile</p>
              <h3 className="text-2xl font-semibold text-gray-800">{customersWithMobile}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <FaPhone size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">With Address</p>
              <h3 className="text-2xl font-semibold text-gray-800">{customersWithAddress}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FaMapMarkerAlt size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={data1}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          className="customers-table"
        />
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        title={
          <span className="text-lg font-semibold">
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </span>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={500}
        className="customer-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="firstname"
              label="First Name"
              rules={[
                { required: true, message: "First name is required" },
                { min: 2, message: "Minimum 2 characters" },
              ]}
              className="mb-4"
            >
              <Input 
                prefix={<FaUser className="text-gray-400" />}
                placeholder="Enter first name"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="lastname"
              label="Last Name"
              rules={[
                { required: true, message: "Last name is required" },
                { min: 2, message: "Minimum 2 characters" },
              ]}
              className="mb-4"
            >
              <Input 
                prefix={<FaUser className="text-gray-400" />}
                placeholder="Enter last name"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter valid email" },
            ]}
            className="mb-4"
          >
            <Input 
              prefix={<FaEnvelope className="text-gray-400" />}
              placeholder="Enter email address"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Mobile Number"
            rules={[
              { required: true, message: "Mobile number is required" },
              { pattern: /^[0-9]{10}$/, message: "Must be 10 digits" },
            ]}
            className="mb-4"
          >
            <Input 
              prefix={<FaPhone className="text-gray-400" />}
              placeholder="Enter mobile number"
              size="large"
              maxLength={10}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            className="mb-4"
          >
            <Input.TextArea 
              placeholder="Enter address (optional)"
              rows={3}
              className="rounded-lg"
            />
          </Form.Item>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 h-11 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {editingCustomer ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        hideModal={() => setDeleteModalOpen(false)}
        open={deleteModalOpen}
        performAction={handleDelete}
        title="Are you sure you want to delete this customer?"
      />

      <style>{`
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
          color: #1a1a1a !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #f5f5f5 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0 !important;
          padding: 16px !important;
        }
        .ant-pagination {
          padding: 16px 24px !important;
          margin: 0 !important;
          background: #fafafa;
          border-top: 1px solid #f0f0f0;
        }
        .ant-pagination-item-active {
          border-color: #1890ff !important;
        }
        .ant-pagination-item-active a {
          color: #1890ff !important;
        }
        .ant-modal-content {
          border-radius: 12px !important;
        }
        .ant-modal-header {
          border-radius: 12px 12px 0 0 !important;
        }
      `}</style>
    </div>
  );
};

export default Customers;

