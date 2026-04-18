import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteABlog, getBlogs, resetState } from "../features/blogs/blogSlice";
import { delImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable from "../components/AdminDataTable";
import ActionButtons from "../components/ActionButtons";
import { FaBlog, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";

const Bloglist = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [blogId, setBlogId] = useState("");

  useEffect(() => {
    dispatch(resetState());
    dispatch(getBlogs());
  }, []);

  const getBlogState = useSelector((state) => state.blogs.blogs);

  const data = getBlogState.map((b, i) => ({
    key: b._id,
    sno: i + 1,
    name: b.title,
    category: b.category,
    _id: b._id,
  }));

  const columns = [
    { title: "S.No", dataIndex: "sno", width: 80, align: "center" },
    { title: "Title", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    { title: "Category", dataIndex: "category", render: (t) => <span className="text-gray-500">{t}</span> },
    {
      title: "Actions", dataIndex: "_id", align: "center", width: 120,
      render: (id) => (
        <ActionButtons
          editTo={`/admin/blog/${id}`}
          onDelete={() => { setBlogId(id); setOpen(true); }}
        />
      ),
    },
  ];

  const deleteBlog = () => {
    dispatch(deleteABlog(blogId));
    dispatch(delImg(blogId));
    setOpen(false);
    setTimeout(() => dispatch(getBlogs()), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <AdminPageHeader
        title="Blogs"
        description="Manage your blog posts"
        icon={<FaBlog />}
        gradient="from-cyan-600 to-cyan-700"
        actionButton={
          <Link to="/admin/blog" className="flex items-center gap-2 px-5 py-2.5 bg-white text-cyan-600 rounded-xl font-semibold hover:bg-cyan-50 transition-all shadow-md">
            <FaPlus className="text-sm" /> Add Blog
          </Link>
        }
      />
      <AdminDataTable columns={columns} dataSource={data} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} blogs` }} />
      <CustomModal hideModal={() => setOpen(false)} open={open} performAction={deleteBlog} title="Are you sure you want to delete this blog?" />
    </div>
  );
};

export default Bloglist;
