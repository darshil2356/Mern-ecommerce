import React, { useEffect, useState } from "react";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { createSize, deleteASize, getSizes, getASize, updateASize } from "../features/size/sizeSlice";
import CustomModal from "../components/CustomModal";
import { FaPlus, FaRuler } from "react-icons/fa";
import { Modal, Input, Button } from "antd";
import AdminDataTable from "../components/AdminDataTable";
import AdminPageHeader from "../components/AdminPageHeader";
import { toast } from "react-toastify";

const Sizelist = () => {
  const dispatch = useDispatch();
  const sizeState = useSelector((state) => state.size.sizes);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sizeId, setSizeId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(getSizes()); }, []);

  const openAdd = () => { setEditId(null); setTitle(""); setModalOpen(true); };
  const openEdit = async (id) => {
    const res = await dispatch(getASize(id)).unwrap();
    setEditId(id); setTitle(res.title); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setTitle(""); setEditId(null); };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Size is required");
    setSaving(true);
    try {
      if (editId) {
        await dispatch(updateASize({ id: editId, title: title.trim() })).unwrap();
        toast.success("Size updated!");
      } else {
        await dispatch(createSize({ title: title.trim() })).unwrap();
        toast.success("Size added!");
      }
      dispatch(getSizes());
      closeModal();
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    dispatch(deleteASize(sizeId));
    setDeleteOpen(false);
    setTimeout(() => dispatch(getSizes()), 100);
  };

  const data1 = sizeState.map((s, i) => ({
    key: i + 1,
    title: s.title,
    action: (
      <div className="flex gap-3">
        <button onClick={() => openEdit(s._id)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all duration-200 border-0 cursor-pointer">
          <BiEdit className="text-lg" />
        </button>
        <button onClick={() => { setDeleteOpen(true); setSizeId(s._id); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all duration-200 border-0 cursor-pointer">
          <AiFillDelete className="text-lg" />
        </button>
      </div>
    ),
  }));

  const columns = [
    { title: <span className="text-gray-600 font-semibold">S.No</span>, dataIndex: "key", width: 80, align: "center" },
    { title: <span className="text-gray-600 font-semibold">Size</span>, dataIndex: "title", sorter: (a, b) => a.title.localeCompare(b.title), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    { title: <span className="text-gray-600 font-semibold">Actions</span>, dataIndex: "action", align: "center", width: 120 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <AdminPageHeader
        title="Sizes"
        description="Manage your product sizes"
        icon={<FaRuler />}
        gradient="from-orange-500 to-orange-600"
        actionButton={
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-md border-0 cursor-pointer">
            <FaPlus className="text-sm" /> Add Size
          </button>
        }
      />

      <AdminDataTable columns={columns} dataSource={data1} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} sizes` }} />

      <Modal
        title={editId ? "Edit Size" : "Add Size"}
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>Cancel</Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}>Save</Button>,
        ]}
        width={360}
      >
        <div className="mb-3">
          <label className="fw-medium mb-1 d-block">Size</label>
          <Input placeholder="e.g. M, XL, 32, Free Size" value={title} onChange={(e) => setTitle(e.target.value)} onPressEnter={handleSave} autoFocus />
        </div>
      </Modal>

      <CustomModal hideModal={() => setDeleteOpen(false)} open={deleteOpen} performAction={handleDelete} title="Are you sure you want to delete this size?" />
    </div>
  );
};

export default Sizelist;
