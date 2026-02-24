import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteABrand,
  getBrands,
  resetState,
} from "../features/brand/brandSlice";
import CustomModal from "../components/CustomModal";
import { FaPlus, FaShieldAlt } from "react-icons/fa";

const Brandlist = () => {
  const [open, setOpen] = useState(false);
  const [brandId, setbrandId] = useState("");
  const showModal = (e) => {
    setOpen(true);
    setbrandId(e);
  };

  const hideModal = () => {
    setOpen(false);
  };
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(resetState());
    dispatch(getBrands());
  }, []);
  const brandState = useSelector((state) => state.brand.brands);
  const data1 = [];
  for (let i = 0; i < brandState.length; i++) {
    data1.push({
      key: i + 1,
      name: brandState[i].title,
      action: (
        <div className="flex gap-3">
          <Link
            to={`/admin/brand/${brandState[i]._id}`}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 transition-all duration-200"
          >
            <BiEdit className="text-lg" />
          </Link>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200 border-0 cursor-pointer"
            onClick={() => showModal(brandState[i]._id)}
          >
            <AiFillDelete className="text-lg" />
          </button>
        </div>
      ),
    });
  }
  const deleteBrand = (e) => {
    dispatch(deleteABrand(e));

    setOpen(false);
    setTimeout(() => {
      dispatch(getBrands());
    }, 100);
  };

  const columns = [
    {
      title: <span className="text-gray-600 font-semibold">S.No</span>,
      dataIndex: "key",
      width: 80,
      align: "center",
    },
    {
      title: <span className="text-gray-600 font-semibold">Brand Name</span>,
      dataIndex: "name",
      sorter: (a, b) => a.name.length - b.name.length,
      render: (text) => (
        <span className="font-medium text-gray-800">{text}</span>
      ),
    },
    {
      title: <span className="text-gray-600 font-semibold">Actions</span>,
      dataIndex: "action",
      align: "center",
      width: 120,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Brands</h2>
                <p className="text-indigo-200 text-sm">Manage your product brands</p>
              </div>
            </div>
            <Link
              to="/admin/brand"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-md"
            >
              <FaPlus className="text-sm" />
              Add Brand
            </Link>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table 
            columns={columns} 
            dataSource={data1} 
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} brands`,
            }}
            className="brand-table"
            rowClassName="hover:bg-gray-50 transition-colors"
          />
        </div>
      </div>

      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => {
          deleteBrand(brandId);
        }}
        title="Are you sure you want to delete this brand?"
      />

      <style>{`
        .brand-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f9fafb, #ffffff);
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #4b5563;
        }
        .brand-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f3f4f6;
          padding: 16px;
        }
        .brand-table .ant-table-tbody > tr:hover > td {
          background: #f9fafb;
        }
        .brand-table .ant-pagination {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default Brandlist;

