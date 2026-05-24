import React, { useEffect, useState } from "react";
import { Input, Button, Tag, Tooltip, Avatar, Modal, Badge } from "antd";
import AdminDataTable from "../components/AdminDataTable";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete, AiOutlineSearch } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { deleteAProduct, getProducts } from "../features/product/productSlice";
import { Link } from "react-router-dom";
import { delImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import BarcodeModal from "../components/BarcodeModal";
import SizeBarcodesList from "../components/SizeBarcodesList";
import { getReadableColorName, getColorSwatch } from "../utils/colorDisplay";
import JsBarcode from "jsbarcode";
import { MdInventory, MdOutlineInventory2, MdTrendingUp, MdShoppingBag } from "react-icons/md";
import { FiPackage, FiAlertTriangle, FiTag, FiLayers } from "react-icons/fi";

const Productlist = () => {
  const [open, setOpen] = useState(false);
  const [productId, setproductId] = useState("");
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sizeBarcodesModalOpen, setSizeBarcodesModalOpen] = useState(false);
  const [productSizeBarcodes, setProductSizeBarcodes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => { dispatch(getProducts()); }, []);

  const productState = useSelector((state) => state?.product?.products);

  const getEffectiveStock = (record) => {
    // variants take priority (5 colors × 3 sizes × qty each)
    if (record.variants?.length > 0)
      return record.variants.reduce(
        (sum, v) => sum + (v.sizeStock || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
        0
      );
    // flat sizeStock (1 color × N sizes)
    if (record.sizeStock?.length > 0)
      return record.sizeStock.reduce((s, i) => s + Number(i.quantity || 0), 0);
    // legacy plain quantity
    return Number(record.quantity || 0);
  };

  const getStockStatus = (qty) => {
    if (qty === 0) return { color: "#ff4d4f", bg: "#fff1f0", border: "#ffccc7", text: "Out of Stock", dot: "error" };
    if (qty < 10) return { color: "#fa8c16", bg: "#fff7e6", border: "#ffd591", text: "Low Stock", dot: "warning" };
    return { color: "#52c41a", bg: "#f6ffed", border: "#b7eb8f", text: "In Stock", dot: "success" };
  };

  const filteredProducts = productState?.filter((p) => {
    const q = searchText.toLowerCase();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.hsnCode?.toLowerCase().includes(q) ||
      p.vendorName?.toLowerCase().includes(q) ||
      p.tags?.toLowerCase().includes(q)
    );
  });

  const totalProducts = productState?.length || 0;
  const outOfStock = productState?.filter((p) => getEffectiveStock(p) === 0).length || 0;
  const lowStock = productState?.filter((p) => { const s = getEffectiveStock(p); return s > 0 && s < 10; }).length || 0;
  const purchaseValue = productState?.reduce((s, p) => s + (Number(p.purchasePrice) || 0) * getEffectiveStock(p), 0) || 0;
  const sellingValue = productState?.reduce((s, p) => s + (Number(p.price) || 0) * getEffectiveStock(p), 0) || 0;
  const potentialProfit = sellingValue - purchaseValue;

  const downloadBarcode = (barcode) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcode, { format: "CODE128", width: 2, height: 80, displayValue: true });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${barcode}.png`;
    link.click();
  };

  const showSizeBarcodes = (record) => {
    const sizeItems = record.sizeStock?.length > 0
      ? record.sizeStock
      : (record.variants || []).flatMap((v) => v.sizeStock || []);
    setProductSizeBarcodes(sizeItems.filter((i) => i.barcode).map((i) => ({ size: i.size, barcode: i.barcode, quantity: i.quantity })));
    setSelectedTitle(record.title);
    setSelectedRecord(record);
    setSizeBarcodesModalOpen(true);
  };

  const deleteProduct = (e) => {
    dispatch(deleteAProduct(e));
    dispatch(delImg(e));
    setOpen(false);
    setTimeout(() => dispatch(getProducts()), 100);
  };

  const columns = [
    {
      title: "#",
      dataIndex: "key",
      key: "key",
      width: 55,
      render: (_, __, index) => (
        <span style={{ color: "#9ca3af", fontWeight: 600, fontSize: 13 }}>{index + 1}</span>
      ),
    },
    {
      title: "Product",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              shape="square"
              size={52}
              src={record.images?.[0]?.url}
              style={{ borderRadius: 10, backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb" }}
              icon={<FiPackage style={{ color: "#9ca3af" }} />}
            />
            {record.inventory?.online && (
              <div style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981", border: "2px solid #fff" }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
              {text}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "1px 7px", borderRadius: 20 }}>{record.category}</span>
              {record.vendorName && (
                <span style={{ fontSize: 11, color: "#8b5cf6", background: "#f5f3ff", padding: "1px 7px", borderRadius: 20 }}>{record.vendorName}</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Brand / HSN",
      key: "brandHsn",
      width: 130,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, margin: 0 }}>{record.brand}</Tag>
          {record.hsnCode && (
            <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>HSN: {record.hsnCode}</span>
          )}
        </div>
      ),
    },
    {
      title: "Color & Sizes",
      key: "colorSize",
      width: 140,
      render: (_, record) => {
        const color = record.color;
        const sizes = record.sizeStock?.length > 0
          ? record.sizeStock.map((i) => i.size)
          : [...new Set((record.variants || []).flatMap((v) => (v.sizeStock || []).map((i) => i.size)))];
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {color?.title ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: getColorSwatch(color), border: "2px solid #e5e7eb", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{getReadableColorName(color)}</span>
              </div>
            ) : null}
            {sizes.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {sizes.slice(0, 4).map((s) => (
                  <span key={s} style={{ fontSize: 10, background: "#eff6ff", color: "#3b82f6", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>{s}</span>
                ))}
                {sizes.length > 4 && <span style={{ fontSize: 10, color: "#9ca3af" }}>+{sizes.length - 4}</span>}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Stock",
      key: "stock",
      width: 120,
      sorter: (a, b) => getEffectiveStock(a) - getEffectiveStock(b),
      render: (_, record) => {
        const total = getEffectiveStock(record);
        const status = getStockStatus(total);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: status.bg, border: `1px solid ${status.border}`, padding: "3px 10px", borderRadius: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: status.color }} />
              <span style={{ color: status.color, fontWeight: 600, fontSize: 12 }}>{status.text}</span>
            </div>
            <span style={{ fontSize: 12, color: "#6b7280", paddingLeft: 2 }}>{total} units</span>
          </div>
        );
      },
    },
    {
      title: "Pricing",
      key: "pricing",
      width: 150,
      sorter: (a, b) => Number(a.price) - Number(b.price),
      render: (_, record) => {
        const sell = Number(record.price) || 0;
        const purchase = Number(record.purchasePrice) || 0;
        const margin = purchase > 0 ? (((sell - purchase) / sell) * 100).toFixed(0) : null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>₹{sell.toLocaleString()}</span>
            {purchase > 0 && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>Cost: ₹{purchase.toLocaleString()}</span>
            )}
            {margin !== null && (
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>↑ {margin}% margin</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Barcodes",
      key: "barcode",
      width: 100,
      render: (_, record) => {
        const allItems = record.sizeStock?.length > 0
          ? record.sizeStock
          : (record.variants || []).flatMap((v) => v.sizeStock || []);
        const count = allItems.filter((s) => s.barcode).length;
        if (count > 0) return (
          <Button size="small" onClick={() => showSizeBarcodes(record)}
            style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: 8, fontWeight: 600, fontSize: 12 }}>
            🏷️ {count} {count === 1 ? "Size" : "Sizes"}
          </Button>
        );
        if (record.barcode) return (
          <Button size="small" onClick={() => { setSelectedBarcode(record.barcode); setSelectedTitle(record.title); setBarcodeModalOpen(true); }}
            style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12 }}>
            🏷️ Main
          </Button>
        );
        return <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>;
      },
    },
    {
      title: "Actions",
      key: "action",
      width: 90,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title="Edit">
            <Link to={`/admin/product/${record._id}`}
              style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              <BiEdit size={16} />
            </Link>
          </Tooltip>
          <Tooltip title="Delete">
            <button onClick={() => { setOpen(true); setproductId(record._id); }}
              style={{ width: 34, height: 34, borderRadius: 8, background: "#fff1f0", color: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AiFillDelete size={16} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const data1 = (filteredProducts || []).map((p, i) => ({
    key: i + 1,
    _id: p._id,
    title: p.title,
    brand: p.brand,
    barcode: p.barcode,
    hsnCode: p.hsnCode || "",
    sizeStock: p.sizeStock || [],
    variants: p.variants || [],
    category: p.category,
    color: p.color || null,
    images: p.images,
    quantity: p.quantity,
    price: p.price,
    mrp: p.mrp || "",
    purchasePrice: p.purchasePrice || 0,
    vendorName: p.vendorName || "",
    inventory: p.inventory,
  }));

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: <FiPackage size={22} />,
      iconBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      valueSuffix: "",
      sub: `${filteredProducts?.length || 0} shown`,
    },
    {
      label: "Purchase Value",
      value: `₹${purchaseValue.toLocaleString()}`,
      icon: <MdShoppingBag size={22} />,
      iconBg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      sub: `Cost × total stock`,
    },
    {
      label: "Selling Value",
      value: `₹${sellingValue.toLocaleString()}`,
      icon: <MdTrendingUp size={22} />,
      iconBg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      sub: `Profit: ₹${potentialProfit.toLocaleString()}`,
      subColor: potentialProfit >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: <FiAlertTriangle size={22} />,
      iconBg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      sub: `${lowStock} low stock`,
      subColor: lowStock > 0 ? "#f59e0b" : "#9ca3af",
    },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "clamp(8px, 2vw, 24px)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, boxShadow: "0 4px 20px rgba(102,126,234,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22 }}>
              <FiPackage />
            </div>
            <div>
              <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 22, margin: 0 }}>Product Inventory</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>Manage your products, pricing & stock</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Input
              placeholder="Search by name, brand, SKU, HSN..."
              prefix={<AiOutlineSearch style={{ color: "rgba(255,255,255,0.6)" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 280, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, color: "#fff" }}
            />
            <Link to="/admin/product">
              <button style={{ background: "#fff", color: "#667eea", border: "none", borderRadius: 10, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
                + Add Product
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: 13, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, margin: 0, marginBottom: 2 }}>{s.label}</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.1 }}>{s.value}</h3>
              {s.sub && <p style={{ fontSize: 11, color: s.subColor || "#9ca3af", margin: 0, marginTop: 3 }}>{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiLayers style={{ color: "#667eea" }} />
            <span style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>All Products</span>
            <span style={{ background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>
              {filteredProducts?.length || 0}
            </span>
          </div>
          {searchText && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Showing results for "<strong>{searchText}</strong>"
            </span>
          )}
        </div>
        <AdminDataTable
          columns={columns}
          dataSource={data1}
          paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`, pageSizeOptions: ["10", "20", "50", "100"] }}
        />
      </div>

      <CustomModal
        hideModal={() => setOpen(false)}
        open={open}
        performAction={() => deleteProduct(productId)}
        title="Are you sure you want to delete this Product?"
      />
      <BarcodeModal
        open={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        barcode={selectedBarcode}
        title={selectedTitle}
      />
      <Modal
        title={<span style={{ color: "#7c3aed", fontWeight: 700 }}>🏷️ Barcodes — {selectedTitle}</span>}
        open={sizeBarcodesModalOpen}
        onCancel={() => setSizeBarcodesModalOpen(false)}
        footer={null}
        width="min(700px, 95vw)"
      >
        <SizeBarcodesList
          barcodes={productSizeBarcodes}
          onDownload={downloadBarcode}
          productData={{ title: selectedTitle, color: selectedRecord?.color, price: selectedRecord?.price, mrp: selectedRecord?.mrp }}
        />
      </Modal>
    </div>
  );
};

export default Productlist;
