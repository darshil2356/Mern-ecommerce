import React, { useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import { createBlogs, getABlog, resetState, updateABlog } from "../features/blogs/blogSlice";
import { getCategories } from "../features/bcategory/bcategorySlice";
import { delImg, uploadImg } from "../features/upload/uploadSlice";
import {
  FaBlog, FaSave, FaArrowLeft, FaImage, FaTimes, FaRobot,
  FaGlobe, FaTag, FaClock, FaUser, FaToggleOn, FaEye, FaEdit,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Content is required"),
  category: yup.string().required("Category is required"),
});

const BLOG_TYPES = [
  { value: "manual", label: "Manual", color: "bg-gray-100 text-gray-600" },
  { value: "retail", label: "Retail", color: "bg-blue-100 text-blue-600" },
  { value: "wholesale", label: "Wholesale", color: "bg-orange-100 text-orange-600" },
  { value: "business", label: "Business", color: "bg-teal-100 text-teal-600" },
];

// Same renderer as Frontend/src/pages/SingleBlog.js
const renderContent = (text = "") =>
  text.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return <h2 key={i} style={{ fontSize: 22, fontWeight: 700, margin: "28px 0 12px", color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>{line.slice(3)}</h2>;
    if (line.startsWith("### "))
      return <h3 key={i} style={{ fontSize: 18, fontWeight: 600, margin: "20px 0 10px", color: "#374151" }}>{line.slice(4)}</h3>;
    if (line.startsWith("- "))
      return <li key={i} style={{ marginBottom: 6, color: "#374151", lineHeight: 1.8 }}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
    if (line.trim() === "") return <br key={i} />;
    const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
    return <p key={i} style={{ marginBottom: 14, lineHeight: 1.9, color: "#374151", fontSize: 15 }} dangerouslySetInnerHTML={{ __html: bold }} />;
  });

const Addblog = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const getBlogId = location.pathname.split("/")[3];
  const isEdit = !!getBlogId;

  const imgState = useSelector((state) => state.upload.images);
  const bCatState = useSelector((state) => state.bCategory.bCategories);
  const blogState = useSelector((state) => state.blogs);

  const {
    isSuccess, isError, isLoading, createdBlog, updatedBlog,
    blogName, blogDesc, blogCategory, blogImages,
    blogSlug, blogMetaTitle, blogMetaDescription, blogKeywords,
    blogReadTime, blogAuthor, blogType, blogIsPublished,
  } = blogState;

  const [activeTab, setActiveTab] = useState("content");
  const [previewMode, setPreviewMode] = useState(false);

  // Insert markdown syntax at cursor
  const insertMarkdown = (e, before, after = "") => {
    e.preventDefault();
    const ta = document.getElementById("blog-content-editor");
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = formik.values.description.slice(start, end);
    const newVal =
      formik.values.description.slice(0, start) +
      before + (selected || "text") + after +
      formik.values.description.slice(end);
    formik.setFieldValue("description", newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + (selected || "text").length);
    }, 0);
  };

  useEffect(() => {
    dispatch(getCategories());
    if (isEdit) {
      dispatch(getABlog(getBlogId));
    } else {
      dispatch(resetState());
    }
  }, [getBlogId]);

  useEffect(() => {
    if (isSuccess && createdBlog) {
      toast.success("Blog created successfully!");
      navigate("/admin/blog-list");
    }
    if (isSuccess && updatedBlog) {
      toast.success("Blog updated successfully!");
      navigate("/admin/blog-list");
    }
    if (isError) toast.error("Something went wrong!");
  }, [isSuccess, isError, isLoading]);

  // Merge DB images + newly uploaded images
  const existingImgs = (blogImages || []).map((i) => ({ public_id: i.public_id, url: i.url }));
  const allImages = isEdit ? [...existingImgs, ...imgState] : imgState;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: blogName || "",
      description: blogDesc || "",
      category: blogCategory || "",
      slug: blogSlug || "",
      metaTitle: blogMetaTitle || "",
      metaDescription: blogMetaDescription || "",
      keywords: blogKeywords || "",
      readTime: blogReadTime || "",
      author: blogAuthor || "Admin",
      blogType: blogType || "manual",
      isPublished: blogIsPublished ?? true,
      images: allImages,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = { ...values, images: allImages };
      if (isEdit) {
        dispatch(updateABlog({ id: getBlogId, blogData: payload }));
      } else {
        dispatch(createBlogs(payload));
      }
    },
  });

  const wordCount = formik.values.description
    ? formik.values.description.replace(/^#+\s|^-\s|\*\*/g, "").split(/\s+/).filter(Boolean).length
    : 0;

  const tabs = [
    { key: "content", label: "Content" },
    { key: "seo", label: "SEO & Meta" },
    { key: "media", label: "Cover Image" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl">
              <FaBlog />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{isEdit ? "Edit Blog" : "Add New Blog"}</h1>
              <p className="text-cyan-100 text-sm mt-0.5">
                {isEdit ? "Update your blog post" : "Create a new blog post"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/blog-list"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all text-sm font-medium"
            >
              <FaArrowLeft className="text-xs" /> Back to Blogs
            </Link>
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-white text-cyan-700 rounded-xl font-semibold hover:bg-cyan-50 transition-all shadow-md text-sm disabled:opacity-60"
            >
              <FaSave /> {isLoading ? "Saving..." : isEdit ? "Update Blog" : "Publish Blog"}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left — Main Content */}
          <div className="xl:col-span-2 space-y-5">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                      activeTab === tab.key
                        ? "text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Content Tab */}
                {activeTab === "content" && (
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Blog Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        placeholder="Enter an engaging blog title..."
                        value={formik.values.title}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      />
                      {formik.touched.title && formik.errors.title && (
                        <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>
                      )}
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        URL Slug
                      </label>
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent">
                        <span className="px-3 py-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">/blog/</span>
                        <input
                          type="text"
                          name="slug"
                          placeholder="auto-generated-from-title"
                          value={formik.values.slug}
                          onChange={formik.handleChange}
                          className="flex-1 px-3 py-3 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Content Editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Content <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{wordCount} words</span>
                          <button
                            type="button"
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                              previewMode
                                ? "bg-cyan-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {previewMode ? <><FaEdit className="text-xs" /> Edit</> : <><FaEye className="text-xs" /> Preview</>}
                          </button>
                        </div>
                      </div>

                      {!previewMode ? (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Markdown Toolbar */}
                          <div className="flex flex-wrap gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
                            {[
                              { label: "H2",  action: (e) => insertMarkdown(e, "## ") },
                              { label: "H3",  action: (e) => insertMarkdown(e, "### ") },
                              { label: "B",   action: (e) => insertMarkdown(e, "**", "**"), style: "font-bold" },
                              { label: "• List", action: (e) => insertMarkdown(e, "- ") },
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onMouseDown={btn.action}
                                className={`px-2.5 py-1 text-xs rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 transition-all ${btn.style || ""}`}
                              >
                                {btn.label}
                              </button>
                            ))}
                            <span className="ml-auto text-xs text-gray-400 self-center">Markdown supported</span>
                          </div>
                          <textarea
                            id="blog-content-editor"
                            name="description"
                            rows={20}
                            placeholder={`Write your blog content in markdown...\n\n## Section Heading\n\n### Sub Heading\n\nYour paragraph text here. Use **bold** for emphasis.\n\n- Bullet point one\n- Bullet point two`}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full px-4 py-4 text-sm text-gray-700 font-mono leading-relaxed focus:outline-none resize-none"
                            style={{ minHeight: 420 }}
                          />
                        </div>
                      ) : (
                        <div
                          className="border border-gray-200 rounded-xl p-6 bg-white"
                          style={{ minHeight: 420, fontSize: 15, lineHeight: 1.9 }}
                        >
                          {formik.values.description
                            ? renderContent(formik.values.description)
                            : <p className="text-gray-400 text-sm">Nothing to preview yet...</p>
                          }
                        </div>
                      )}

                      {formik.touched.description && formik.errors.description && (
                        <p className="text-red-500 text-xs mt-1">{formik.errors.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* SEO Tab */}
                {activeTab === "seo" && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
                      <FaGlobe className="shrink-0" />
                      <span>SEO fields help your blog rank better on Google.</span>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Title</label>
                      <input
                        type="text"
                        name="metaTitle"
                        placeholder="SEO title (under 60 chars recommended)"
                        value={formik.values.metaTitle}
                        onChange={formik.handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">{formik.values.metaTitle.length}/60 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description</label>
                      <textarea
                        name="metaDescription"
                        rows={3}
                        placeholder="Brief description for search engines (under 160 chars)"
                        value={formik.values.metaDescription}
                        onChange={formik.handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">{formik.values.metaDescription.length}/160 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <FaTag className="inline mr-1.5 text-gray-400" />Keywords
                      </label>
                      <input
                        type="text"
                        name="keywords"
                        placeholder="keyword1, keyword2, keyword3"
                        value={formik.values.keywords}
                        onChange={formik.handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">Comma-separated keywords</p>
                    </div>

                    {/* Google Preview */}
                    {(formik.values.metaTitle || formik.values.title) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Google Preview</p>
                        <div className="border border-gray-200 rounded-xl p-4 bg-white">
                          <p className="text-blue-600 text-base font-medium truncate">
                            {formik.values.metaTitle || formik.values.title}
                          </p>
                          <p className="text-green-700 text-xs mt-0.5">yourstore.com/blog/{formik.values.slug || "blog-slug"}</p>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {formik.values.metaDescription || "No meta description provided."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === "media" && (
                  <div className="space-y-5">
                    <Dropzone
                      onDrop={(files) => dispatch(uploadImg(files))}
                      accept={{ "image/*": [] }}
                      multiple={false}
                    >
                      {({ getRootProps, getInputProps, isDragActive }) => (
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                            isDragActive
                              ? "border-cyan-500 bg-cyan-50"
                              : "border-gray-200 hover:border-cyan-400 hover:bg-gray-50"
                          }`}
                        >
                          <input {...getInputProps()} />
                          <FaImage className="text-4xl text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-600">
                            {isDragActive ? "Drop image here..." : "Drag & drop or click to upload cover image"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        </div>
                      )}
                    </Dropzone>

                    {allImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => dispatch(delImg(img.public_id))}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — Settings Sidebar */}
          <div className="space-y-5">
            {/* Publish Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FaToggleOn className="text-cyan-500" /> Publish Settings
              </h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formik.values.isPublished ? "Visible to public" : "Hidden from public"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue("isPublished", !formik.values.isPublished)}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    formik.values.isPublished ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      formik.values.isPublished ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                    formik.values.isPublished
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {formik.values.isPublished ? "● Published" : "● Draft"}
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Category & Type</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    <option value="">Select category</option>
                    {bCatState.map((c, i) => (
                      <option key={i} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                  {formik.touched.category && formik.errors.category && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Blog Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BLOG_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => formik.setFieldValue("blogType", t.value)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                          formik.values.blogType === t.value
                            ? `${t.color} border-current`
                            : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Author & Read Time */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Author & Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    <FaUser className="inline mr-1" />Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    placeholder="Author name"
                    value={formik.values.author}
                    onChange={formik.handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    <FaClock className="inline mr-1" />Read Time
                  </label>
                  <input
                    type="text"
                    name="readTime"
                    placeholder="e.g. 5 min read"
                    value={formik.values.readTime}
                    onChange={formik.handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {wordCount > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Suggested: ~{Math.max(1, Math.ceil(wordCount / 200))} min read ({wordCount} words)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Badge */}
            {blogState.blogIsAI && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
                <FaRobot className="text-purple-500 text-xl shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-700">AI Generated</p>
                  <p className="text-xs text-purple-500 mt-0.5">Review before publishing</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-cyan-800 transition-all shadow-md disabled:opacity-60 text-sm"
            >
              <FaSave />
              {isLoading ? "Saving..." : isEdit ? "Update Blog" : "Publish Blog"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Addblog;
