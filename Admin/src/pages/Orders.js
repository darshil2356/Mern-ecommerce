import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Popover, DatePicker, Radio, Tag, Tooltip } from "antd";
import { FilterOutlined, EyeOutlined, PrinterOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getOrders, updateAOrder } from "../features/auth/authSlice";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import axios from "axios";

// Helper function to convert number to words
const numberToWords = (num) => {
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  const numToWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_zero = ('000000000' + n).substr(-9);
    let n1 = n_zero.substr(0, 2), n2 = n_zero.substr(2, 2), n3 = n_zero.substr(4, 2), n4 = n_zero.substr(6, 2), n5 = n_zero.substr(8, 2);
    let n6 = n_zero.substr(0, 3), n7 = n_zero.substr(3, 3), n8 = n_zero.substr(6, 3);
    let res = '';
    res += (n1 != 0) ? (a[Number(n1)] || b[n1[0]] + ' ' + a[n1[1]]) + 'Crore ' : '';
    res += (n2 != 0) ? (a[Number(n2)] || b[n2[0]] + ' ' + a[n2[1]]) + 'Lakh ' : '';
    res += (n3 != 0) ? (a[Number(n3)] || b[n3[0]] + ' ' + a[n3[1]]) + 'Thousand ' : '';
    res += (n4 != 0) ? (a[Number(n4)] || b[n4[0]] + ' ' + a[n4[1]]) + 'Hundred ' : '';
    res += (n5 != 0) ? ((res != '') ? 'and ' : '') + (a[Number(n5)] || b[n5[0]] + ' ' + a[n5[1]]) : '';
    return res;
  };

  if (num <= 0) return 'Zero';
  return numToWords(Math.floor(num));
};

// Function to print bill from order
const printOrderBill = async (orderId) => {
  try {
    // Fetch order details with product info
    const res = await axios.get(`${base_url}user/getaOrder/${orderId}`, config);
    const order = res.data.orders;
    
    const invoiceNum = order._id.slice(-8).toUpperCase();
    const now = new Date(order.createdAt);
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    const customerName = order.user ? `${order.user.firstname || ''} ${order.user.lastname || ''}`.trim() : "Walk-in Customer";
    const customerMobile = order.user ? order.user.mobile : "";
    const customerAddress = order.user ? order.user.address || "N/A" : "N/A";
    const gstin = order.user ? order.user.gstin || "" : "";
    
    const subtotal = order.totalPrice;
    const discountAmount = order.discountAmount || 0;
    const totalAmount = order.totalPriceAfterDiscount;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoiceNum}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { font-family: 'Inter', 'Segoe UI', sans-serif; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body class="bg-gray-50 p-4">
          <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            
            <!-- Premium Header -->
            <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white p-6">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h1 class="text-2xl font-bold tracking-tight">PREMIUM STORE</h1>
                      <p class="text-blue-200 text-xs">Wholesale & Retail</p>
                    </div>
                  </div>
                  <p class="text-blue-100 text-sm mt-3">
                    123 Business Street, Tech Park<br>
                    City Center, State - 123456<br>
                    📞 +91 98765 43210 | ✉️ info@premiumstore.com
                  </p>
                </div>
                <div class="text-right">
                  <div class="bg-white/20 px-4 py-2 rounded-lg inline-block">
                    <span class="text-xs text-blue-200 block">INVOICE</span>
                    <span class="text-xl font-bold">${invoiceNum}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invoice Meta Info -->
            <div class="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Bill To</p>
                <p class="font-semibold text-gray-800">${customerName}</p>
                <p class="text-sm text-gray-600">${customerAddress}</p>
                ${customerMobile ? `<p class="text-sm text-gray-600">📞 ${customerMobile}</p>` : ''}
                ${gstin ? `<p class="text-sm text-gray-600 font-medium">GSTIN: ${gstin}</p>` : ''}
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600"><span class="text-gray-500">Date:</span> ${dateStr}</p>
                <p class="text-sm text-gray-600"><span class="text-gray-500">Time:</span> ${timeStr}</p>
                <p class="text-sm text-gray-600"><span class="text-gray-500">Payment:</span> <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">${order.mode === 'OFFLINE' ? 'CASH' : 'ONLINE'}</span></p>
              </div>
            </div>

            <!-- Items Table -->
            <div class="p-6">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left">
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold rounded-l-lg">#</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold">Item Description</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold text-center">Qty</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold text-right">Rate</th>
                    <th class="py-3 px-2 bg-blue-50 text-blue-800 font-semibold text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.orderItems.map((item, index) => `
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="py-3 px-2 text-gray-500">${index + 1}</td>
                      <td class="py-3 px-2 font-medium text-gray-800">${item.product ? item.product.title : 'Product'}</td>
                      <td class="py-3 px-2 text-center text-gray-600">${item.quantity}</td>
                      <td class="py-3 px-2 text-right text-gray-600">₹${item.price.toFixed(2)}</td>
                      <td class="py-3 px-2 text-right font-medium text-gray-800">₹${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Summary Section -->
              <div class="mt-6 flex justify-end">
                <div class="w-72">
                  <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Subtotal</span>
                      <span class="font-medium">₹${subtotal.toFixed(2)}</span>
                    </div>
                    ${discountAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Discount</span>
                      <span class="text-red-600">-₹${discountAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="border-t border-gray-200 pt-2 mt-2">
                      <div class="flex justify-between items-center">
                        <span class="text-lg font-bold text-gray-800">Total Payable</span>
                        <span class="text-2xl font-bold text-blue-600">₹${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div class="text-center pt-2">
                      <span class="text-xs text-gray-400">Amount in Words</span>
                      <p class="text-sm font-medium text-gray-700">${numberToWords(totalAmount)} Rupees Only</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="bg-gray-900 text-white p-6">
              <div class="flex justify-between items-start">
                <div class="text-sm">
                  <p class="font-semibold mb-1">Terms & Conditions</p>
                  <p class="text-gray-400 text-xs">• Goods once sold cannot be returned<br>• Warranty as per manufacturer policy<br>• Please retain this invoice for future reference</p>
                </div>
                <div class="text-center">
                  <div class="w-32 h-16 border-b border-gray-600 mb-2"></div>
                  <p class="text-xs text-gray-400">Authorized Signature</p>
                </div>
              </div>
              <div class="border-t border-gray-700 mt-4 pt-4 text-center">
                <p class="text-blue-400 font-semibold text-sm">Thank You for Shopping with Us! 🙏</p>
                <p class="text-gray-500 text-xs mt-1">Visit Again | Quality Guaranteed | Best Prices</p>
              </div>
            </div>

            <!-- Footer Bar -->
            <div class="bg-blue-600 text-white text-center py-2">
              <p class="text-xs">www.premiumstore.com | Powered by Premium Store Billing System</p>
            </div>

          </div>
        </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => win.print(), 500);
  } catch (error) {
    console.error("Error printing bill:", error);
  }
};

const getStatusColor = (status) => {
  const colors = {
    "Ordered": "default",
    "Processed": "blue",
    "Shipped": "purple",
    "Out for Delivery": "cyan",
    "Delivered": "green",
    "Cancelled": "red",
  };
  return colors[status] || "default";
};

const getPaymentStatus = (paymentInfo) => {
  if (!paymentInfo) return { status: "Unknown", color: "default" };
  if (paymentInfo.razorpayPaymentId) {
    return { status: "Paid", color: "green" };
  }
  if (paymentInfo.razorpayOrderId === "OFFLINE") {
    return { status: "Offline Paid", color: "blue" };
  }
  return { status: "Pending", color: "orange" };
};

const columns = [
  { 
    title: "SNo", 
    dataIndex: "key",
    width: 60,
  },
  { 
    title: "Order ID", 
    dataIndex: "orderId",
    render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id?.slice(-8).toUpperCase()}</span>,
  },
  { 
    title: "Name", 
    dataIndex: "name",
    ellipsis: true,
  },
  { 
    title: "Items", 
    dataIndex: "items",
    align: "center",
    width: 70,
  },
  { 
    title: "Amount", 
    dataIndex: "amount",
    render: (amount) => <span style={{ fontWeight: 600 }}>₹{amount?.toFixed(2)}</span>,
  },
  { 
    title: "Discount", 
    dataIndex: "discount",
    render: (discount, record) => {
      if (discount <= 0) return "-";
      const b = record.discountBreakdown || {};
      const hasBreakdown = b.directDiscount > 0 || b.offerDiscount > 0 || b.coinDiscount > 0;
      const tip = hasBreakdown ? (
        <div style={{ fontSize: 12 }}>
          {b.directDiscount > 0 && <div>🏷️ Direct: -₹{b.directDiscount.toFixed(2)}</div>}
          {b.offerDiscount  > 0 && <div>🎁 Offer: -₹{b.offerDiscount.toFixed(2)}</div>}
          {b.coinDiscount   > 0 && <div>🪙 Coins: -₹{b.coinDiscount.toFixed(2)}</div>}
        </div>
      ) : null;
      return (
        <Tooltip title={tip}>
          <span style={{ color: "#52c41a", cursor: hasBreakdown ? "help" : "default" }}>
            -₹{discount.toFixed(2)}{hasBreakdown ? " ℹ️" : ""}
          </span>
        </Tooltip>
      );
    },
  },
  { 
    title: "Final", 
    dataIndex: "finalAmount",
    render: (amount) => <span style={{ fontWeight: 700, color: "#1890ff" }}>₹{amount?.toFixed(2)}</span>,
  },
  { 
    title: "Status", 
    dataIndex: "status",
    render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    width: 130,
  },
  { 
    title: "Payment", 
    dataIndex: "payment",
    render: (payment) => <Tag color={payment.color}>{payment.status}</Tag>,
  },
  { 
    title: "Mode", 
    dataIndex: "mode",
    render: (mode) => (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          color: "#fff",
          background: mode === "OFFLINE" ? "#fa541c" : "#52c41a",
        }}
      >
        {mode}
      </span>
    ),
    width: 90,
  },
  { 
    title: "Date", 
    dataIndex: "date",
    sorter: (a, b) => new Date(a.rawDate) - new Date(b.rawDate),
  },
  { 
    title: "Action", 
    dataIndex: "action",
    width: 200,
  },
];

const Orders = () => {
  const dispatch = useDispatch();
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: null,
    mode: null,
    status: null,
  });

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const updateOrderStatus = (id, status) => {
    dispatch(updateAOrder({ id, status }));
  };

  const dataSource = useMemo(() => {
    if (!orderState) return [];

    return orderState.map((order, index) => {
      // Use discountAmount if available, otherwise calculate from difference
      const discount = order.discountAmount || ((order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0));
      const payment = getPaymentStatus(order.paymentInfo);
      
      return {
        key: index + 1,
        orderId: order._id,
        name: order?.user?.firstname || "N/A",
        items: order?.orderItems?.length || 0,
        amount: order?.totalPrice,
        discount: discount,
        discountBreakdown: order?.discountBreakdown || {},
        finalAmount: order?.totalPriceAfterDiscount,
        status: order?.orderStatus || "Ordered",
        payment: payment,
        mode: order?.mode || "ONLINE",
        date: dayjs(order?.createdAt).format("DD-MM-YYYY HH:mm"),
        rawDate: order?.createdAt,
        action: (
          <div style={{ display: "flex", gap: 8 }}>
            <Tooltip title="Print Bill">
              <Button 
                size="small" 
                icon={<PrinterOutlined />} 
                onClick={() => printOrderBill(order?._id)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
              />
            </Tooltip>
            <Tooltip title="View Order">
              <Link to={`/admin/order/${order?._id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
            </Tooltip>
            <select
              defaultValue={order?.orderStatus}
              onChange={(e) => updateOrderStatus(order?._id, e.target.value)}
              className="form-control form-select"
              style={{ fontSize: 12, padding: "4px 8px" }}
            >
              <option value="Ordered" disabled>Ordered</option>
              <option value="Processed">Processed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ),
      };
    });
  }, [orderState]);

  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      let ok = true;

      if (filters.mode) {
        ok = ok && item.mode === filters.mode;
      }

      if (filters.status) {
        ok = ok && item.status === filters.status;
      }

      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const d = dayjs(item.rawDate);
        ok =
          ok &&
          d.isAfter(start.startOf("day")) &&
          d.isBefore(end.endOf("day"));
      }

      return ok;
    });
  }, [filters, dataSource]);

  const filterContent = (
    <div style={{ width: 280 }}>
      <Radio.Group
        size="small"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        style={{ marginBottom: 12 }}
      >
        <Radio.Button value="date">Date</Radio.Button>
        <Radio.Button value="mode">Mode</Radio.Button>
        <Radio.Button value="status">Status</Radio.Button>
      </Radio.Group>

      {activeFilter === "date" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Date Range
          </div>
          <DatePicker.RangePicker
            size="small"
            className="w-full"
            popupClassName="single-calendar-range"
            onChange={(dates) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: dates,
              }))
            }
          />
        </>
      )}

      {activeFilter === "mode" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Order Mode
          </div>
          <Radio.Group
            size="small"
            value={filters.mode}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                mode: e.target.value,
              }))
            }
          >
            <Radio value="ONLINE">Online</Radio>
            <Radio value="OFFLINE">Offline (POS)</Radio>
          </Radio.Group>
        </>
      )}

      {activeFilter === "status" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Order Status
          </div>
          <Radio.Group
            size="small"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
          >
            <Radio value="Ordered">Ordered</Radio>
            <Radio value="Processed">Processed</Radio>
            <Radio value="Shipped">Shipped</Radio>
            <Radio value="Out for Delivery">Out for Delivery</Radio>
            <Radio value="Delivered">Delivered</Radio>
            <Radio value="Cancelled">Cancelled</Radio>
          </Radio.Group>
        </>
      )}

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button
          size="small"
          onClick={() => {
            setFilters({ dateRange: null, mode: null, status: null });
            setActiveFilter(null);
          }}
        >
          Clear
        </Button>
        <Button size="small" type="primary">
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 className="title" style={{ margin: 0 }}>Orders</h3>
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>
            Total: {filteredData.length} orders
          </span>
        </div>

        <Popover
          content={filterContent}
          trigger="click"
          placement="bottomRight"
        >
          <Button size="small" icon={<FilterOutlined />}>
            Filters
          </Button>
        </Popover>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredData} 
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        size="small"
      />
    </div>
  );
};

export default Orders;

