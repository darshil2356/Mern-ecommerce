import React, { useEffect, useState } from "react";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { createCategory, deleteAProductCategory, getCategories, getAProductCategory, updateAProductCategory, resetState } from "../features/pcategory/pcategorySlice";
import CustomModal from "../components/CustomModal";
import { FaPlus, FaTags } from "react-icons/fa";
import { Modal, Input, Button, Table } from "antd";
import { toast } from "react-toastify";

const Categorylist = () => {
  const dispatch = useDispatch();
  const pCatStat = useSelector((state) => state.pCategory.pCategories);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pCatId, setPCatId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getCategories());
  }, []);

  const openAdd = () => { setEditId(null); setTitle(""); setModalOpen(true); };
  const openEdit = async (id) => {
    const res = await dispatch(getAProductCategory(id)).unwrap();
    setEditId(id); setTitle(res.title); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setTitle(""); setEditId(null); };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Category name is required");
    setSaving(true);
    try {
      if (editId) {
        await dispatch(updateAProductCategory({ id: editId, pCatData: { title: title.trim() } })).unwrap();
        toast.success("Category updated!");
      } else {
        await dispatch(createCategory({ title: title.trim() })).unwrap();
        toast.success("Category added!");
      }
      dispatch(getCategories());
      closeModal();
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    dispatch(deleteAProductCategory(pCatId));
    setDeleteOpen(false);
    setTimeout(() => dispatch(getCategories()), 100);
  };

  const data1 = pCatStat.map((c, i) => ({
    key: i + 1,
    name: c.title,
    action: (
      <div className="flex gap-3">
        <button onClick={() => openEdit(c._id)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all duration-200 border-0 cursor-pointer">
          <BiEdit className="text-lg" />
        </button>
        <button onClick={() => { setDeleteOpen(true); setPCatId(c._id); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all duration-200 border-0 cursor-pointer">
          <AiFillDelete className="text-lg" />
        </button>
      </div>
    ),
  }));

  const columns = [
    { title: <span className="text-gray-600 font-semibold">S.No</span>, dataIndex: "key", width: 80, align: "center" },
    { title: <span className="text-gray-600 font-semibold">Category Name</span>, dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    { title: <span className="text-gray-600 font-semibold">Actions</span>, dataIndex: "action", align: "center", width: 120 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaTags className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Categories</h2>
                <p className="text-emerald-200 text-sm">Manage your product categories</p>
              </div>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-md border-0 cursor-pointer">
              <FaPlus className="text-sm" /> Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <Table columns={columns} dataSource={data1} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories` }} />
      </div>

      <Modal
        title={editId ? "Edit Category" : "Add Category"}
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>Cancel</Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}>Save</Button>,
        ]}
        width={360}
      >
        <div className="mb-3">
          <label className="fw-medium mb-1 d-block">Category Name</label>
          <Input placeholder="e.g. T-Shirts" value={title} onChange={(e) => setTitle(e.target.value)} onPressEnter={handleSave} autoFocus />
        </div>
      </Modal>

      <CustomModal hideModal={() => setDeleteOpen(false)} open={deleteOpen} performAction={handleDelete} title="Are you sure you want to delete this category?" />
    </div>
  );
};

export default Categorylist;
