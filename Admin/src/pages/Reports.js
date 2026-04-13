import React, { useState, useEffect, useMemo } from "react";
import { 
  Card, Row, Col, Select, DatePicker, Table, Button, Tabs, 
  Statistic, Tag, Space, message, Spin, Empty 
} from "antd";
import { 
  FilePdfOutlined, FileExcelOutlined, DownloadOutlined, 
  PrinterOutlined, BarChartOutlined, PieChartOutlined, 
  LineChartOutlined, DollarOutlined, ShoppingCartOutlined, 
  UserOutlined, ClockCircleOutlined, SendOutlined 
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { 
  getMonthlyReportData, 
  getYearlyReportData, 
  getDateRangeReportData,
  getGSTReportData,
  getProductWiseReportData,
  getCustomerWiseReportData
} from "../features/auth/authSlice";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const dispatch = useDispatch();
  const { 
    isLoading, 
    monthlyReport, 
    yearlyReport, 
    dateRangeReport, 
    gstReport,
    productWiseReport,
    customerWiseReport 
  } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [paymentFilter, setPaymentFilter] = useState("all");

  const currentUser = useSelector((state) => state?.auth?.user);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = [];
  for (let i = dayjs().year(); i >= dayjs().year() - 5; i--) {
    years.push(i);
  }

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear, activeTab, paymentFilter]);

  const fetchReport = () => {
    if (activeTab === "monthly") {
      dispatch(getMonthlyReportData({ month: selectedMonth, year: selectedYear, paymentFilter }));
    } else if (activeTab === "yearly") {
      dispatch(getYearlyReportData({ year: selectedYear, paymentFilter }));
    } else if (activeTab === "gst") {
      dispatch(getGSTReportData({ month: selectedMonth, year: selectedYear, paymentFilter }));
    } else if (activeTab === "dateRange" && dateRange && dateRange[0] && dateRange[1]) {
      dispatch(getDateRangeReportData({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        paymentFilter,
      }));
    } else if (activeTab === "products" && dateRange && dateRange[0] && dateRange[1]) {
      dispatch(getProductWiseReportData({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        paymentFilter,
      }));
    } else if (activeTab === "customers" && dateRange && dateRange[0] && dateRange[1]) {
      dispatch(getCustomerWiseReportData({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        paymentFilter,
      }));
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      dispatch(getDateRangeReportData({
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD")
        , paymentFilter
      }));
    }
  };

  const handleProductWiseReport = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      dispatch(getProductWiseReportData({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD")
        , paymentFilter
      }));
    }
  };

  const handleCustomerWiseReport = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      dispatch(getCustomerWiseReportData({
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD")
        , paymentFilter
      }));
    }
  };

  // Generate PDF Report
  const generatePDF = () => {
    let reportData = null;
    let reportTitle = "";

    switch (activeTab) {
      case "monthly":
        reportData = monthlyReport;
        reportTitle = `Monthly Sales Report - ${monthNames[selectedMonth - 1]} ${selectedYear}`;
        break;
      case "yearly":
        reportData = yearlyReport;
        reportTitle = `Yearly Sales Report - ${selectedYear}`;
        break;
      case "dateRange":
        reportData = dateRangeReport;
        reportTitle = `Sales Report - ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}`;
        break;
      case "gst":
        reportData = gstReport;
        reportTitle = `GST Report - ${monthNames[selectedMonth - 1]} ${selectedYear}`;
        break;
      default:
        message.error("Please select a report type");
        return;
    }

    if (!reportData) {
      message.warning("No data available to generate report");
      return;
    }

    // Create printable content
    const printContent = generatePrintContent(reportData, reportTitle);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const generatePrintContent = (data, title) => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR' 
      }).format(amount || 0);
    };

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Inter', sans-serif; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body class="bg-white p-8">
        <div class="max-w-4xl mx-auto">
          <!-- Header -->
          <div class="text-center mb-8 border-b pb-4">
            <h1 class="text-2xl font-bold text-gray-800">Cart Corner</h1>
            <p class="text-gray-600">${title}</p>
            <p class="text-sm text-gray-500">Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
    `;

    if (activeTab === "monthly" || activeTab === "dateRange" || activeTab === "yearly") {
      const summary = data.summary || {};
      content += `
          <!-- Summary Cards -->
          <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="bg-blue-50 p-4 rounded-lg text-center">
              <p class="text-sm text-blue-600">Total Orders</p>
              <p class="text-2xl font-bold text-blue-800">${summary.totalOrders || 0}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
              <p class="text-sm text-green-600">Total Sales</p>
              <p class="text-2xl font-bold text-green-800">${formatCurrency(summary.totalSales)}</p>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg text-center">
              <p class="text-sm text-orange-600">Discount</p>
              <p class="text-2xl font-bold text-orange-800">${formatCurrency(summary.totalDiscount)}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg text-center">
              <p class="text-sm text-purple-600">Net Revenue</p>
              <p class="text-2xl font-bold text-purple-800">${formatCurrency(summary.netRevenue)}</p>
            </div>
          </div>
      `;

      if (data.modeBreakdown) {
        content += `
          <!-- Mode Breakdown -->
          <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4">Sales by Mode</h3>
            <table class="w-full border-collapse border border-gray-200">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border border-gray-200 p-2 text-left">Mode</th>
                  <th class="border border-gray-200 p-2 text-right">Orders</th>
                  <th class="border border-gray-200 p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-gray-200 p-2">Online</td>
                  <td class="border border-gray-200 p-2 text-right">${data.modeBreakdown.online?.orders || 0}</td>
                  <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.modeBreakdown.online?.amount)}</td>
                </tr>
                <tr>
                  <td class="border border-gray-200 p-2">Offline (POS)</td>
                  <td class="border border-gray-200 p-2 text-right">${data.modeBreakdown.offline?.orders || 0}</td>
                  <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.modeBreakdown.offline?.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }
    }

    if (activeTab === "gst" && data.summary) {
      content += `
        <!-- GST Summary -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">GST Summary</h3>
          <table class="w-full border-collapse border border-gray-200">
            <thead>
              <tr class="bg-gray-50">
                <th class="border border-gray-200 p-2 text-left">Description</th>
                <th class="border border-gray-200 p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-200 p-2">Total Invoices</td>
                <td class="border border-gray-200 p-2 text-right">${data.summary.totalInvoices}</td>
              </tr>
              <tr>
                <td class="border border-gray-200 p-2">Taxable Value</td>
                <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.summary.totalTaxableValue)}</td>
              </tr>
              <tr>
                <td class="border border-gray-200 p-2">CGST</td>
                <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.summary.totalCGST)}</td>
              </tr>
              <tr>
                <td class="border border-gray-200 p-2">SGST</td>
                <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.summary.totalSGST)}</td>
              </tr>
              <tr class="font-bold bg-gray-50">
                <td class="border border-gray-200 p-2">Total Tax</td>
                <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.summary.totalTax)}</td>
              </tr>
              <tr class="font-bold bg-blue-50">
                <td class="border border-gray-200 p-2">Total Invoice Value</td>
                <td class="border border-gray-200 p-2 text-right">${formatCurrency(data.summary.totalInvoiceValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (activeTab === "yearly" && data.monthlyBreakdown) {
      content += `
        <!-- Monthly Breakdown -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Monthly Breakdown</h3>
          <table class="w-full border-collapse border border-gray-200 text-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="border border-gray-200 p-2 text-left">Month</th>
                <th class="border border-gray-200 p-2 text-right">Orders</th>
                <th class="border border-gray-200 p-2 text-right">Sales</th>
                <th class="border border-gray-200 p-2 text-right">Discount</th>
                <th class="border border-gray-200 p-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${data.monthlyBreakdown.map(m => `
                <tr>
                  <td class="border border-gray-200 p-2">${m.month}</td>
                  <td class="border border-gray-200 p-2 text-right">${m.orders}</td>
                  <td class="border border-gray-200 p-2 text-right">${formatCurrency(m.sales)}</td>
                  <td class="border border-gray-200 p-2 text-right">${formatCurrency(m.discount)}</td>
                  <td class="border border-gray-200 p-2 text-right">${formatCurrency(m.revenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Footer
    content += `
          <!-- Footer -->
          <div class="mt-8 pt-4 border-t text-center text-sm text-gray-500">
            <p>This is a computer-generated document. No signature required.</p>
            <p>For any queries, contact your accountant or administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return content;
  };

  // Generate Excel Report - Meesho/Flipkart Style
  const generateExcel = () => {
    let reportData = null;
    let fileName = "";

    switch (activeTab) {
      case "monthly":
        reportData = monthlyReport;
        fileName = `Monthly_Report_${monthNames[selectedMonth - 1]}_${selectedYear}`;
        break;
      case "yearly":
        reportData = yearlyReport;
        fileName = `Yearly_Report_${selectedYear}`;
        break;
      case "dateRange":
        reportData = dateRangeReport;
        fileName = `Report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`;
        break;
      case "gst":
        reportData = gstReport;
        fileName = `GST_Report_${monthNames[selectedMonth - 1]}_${selectedYear}`;
        break;
      case "products":
        reportData = productWiseReport;
        fileName = `Product_Report`;
        break;
      case "customers":
        reportData = customerWiseReport;
        fileName = `Customer_Report`;
        break;
      default:
        message.error("Please select a report type");
        return;
    }

    if (!reportData) {
      message.warning("No data available to generate Excel");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Meesho/Flipkart Style: Detailed Invoice-wise data
    if (reportData.orders && reportData.orders.length > 0) {
      // Flat invoice data - each row = one order
      const invoiceData = reportData.orders.map(o => {
        // Get product details from order items
        const products = o.orderItems?.map(item => 
          item.product?.title || "Product"
        ).join(", ") || "N/A";
        
        const quantities = o.orderItems?.map(item => 
          item.quantity
        ).join(", ") || "0";
        
        const prices = o.orderItems?.map(item => 
          item.price
        ).join(", ") || "0";
        
        const totalItems = o.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        
        return {
          "Order ID": o._id?.slice(-8).toUpperCase() || "",
          "Order Date": o.createdAt ? dayjs(o.createdAt).format('DD-MM-YYYY') : "",
          "Customer Name": o.user ? `${o.user.firstname || ''} ${o.user.lastname || ''}`.trim() : "Walk-in Customer",
          "Contact": o.user?.mobile || "N/A",
          "Product Name": products,
          "SKU/Barcode": o.orderItems?.[0]?.product?.barcode || "N/A",
          "Quantity": totalItems,
          "Unit Price (₹)": prices,
          "Sub Total (₹)": o.totalPrice || 0,
          "Discount (₹)": o.discountAmount || 0,
          "Tax/GST (₹)": ((o.totalPriceAfterDiscount || 0) - (o.totalPrice || 0) + (o.discountAmount || 0)).toFixed(2),
          "Total Amount (₹)": o.totalPriceAfterDiscount || 0,
          "Payment Mode": o.mode === 'OFFLINE' ? 'COD/Offline' : 'Online',
          "Order Status": o.orderStatus || "Ordered",
          "Payment Status": o.paymentInfo?.razorpayPaymentId ? "Paid" : "Pending"
        };
      });

      const wsInvoice = XLSX.utils.json_to_sheet(invoiceData);
      
      // Set column widths for better readability
      wsInvoice['!cols'] = [
        { wch: 12 }, // Order ID
        { wch: 12 }, // Order Date
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Contact
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU/Barcode
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Sub Total
        { wch: 12 }, // Discount
        { wch: 12 }, // Tax/GST
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Payment Mode
        { wch: 15 }, // Order Status
        { wch: 15 }  // Payment Status
      ];
      
      XLSX.utils.book_append_sheet(wb, wsInvoice, "Invoice Details");
    }

    // Create Summary Sheet
    if (reportData.summary) {
      const summaryData = [];
      
      // Header
      summaryData.push(["SALES REPORT SUMMARY"]);
      summaryData.push([`Period: ${activeTab === 'monthly' ? monthNames[selectedMonth - 1] + ' ' + selectedYear : activeTab === 'yearly' ? selectedYear : dateRange[0].format('DD/MM/YYYY') + ' to ' + dateRange[1].format('DD/MM/YYYY')}`]);
      summaryData.push([`Generated On: ${new Date().toLocaleDateString('en-IN')}`]);
      summaryData.push([]);
      
      if (reportData.summary.totalOrders !== undefined) {
        summaryData.push(["KEY METRICS"]);
        summaryData.push(["Total Orders", reportData.summary.totalOrders]);
        summaryData.push(["Total Sales (₹)", reportData.summary.totalSales?.toFixed(2)]);
        summaryData.push(["Discount Given (₹)", reportData.summary.totalDiscount?.toFixed(2)]);
        summaryData.push(["Net Revenue - Active Orders (₹)", reportData.summary.netRevenue?.toFixed(2)]);
        summaryData.push(["Average Order Value (₹)", ((reportData.summary.netRevenue || 0) / (reportData.summary.totalOrders || 1))?.toFixed(2)]);
        summaryData.push([]);
        summaryData.push(["CANCELLED ORDER ACCOUNTING"]);
        summaryData.push(["Cancelled Orders (count)", reportData.summary.cancelledOrders || 0]);
        summaryData.push(["Cancelled Order Value (₹)", (reportData.summary.cancelledAmount || 0).toFixed ? (reportData.summary.cancelledAmount || 0).toFixed(2) : "0.00"]);
        summaryData.push(["Refunded as Coins (₹)", (reportData.summary.coinRefundAmount || 0).toFixed ? (reportData.summary.coinRefundAmount || 0).toFixed(2) : "0.00", "Cash stays in business"]);
        summaryData.push(["Cash Refunded (₹)", (reportData.summary.cashRefundAmount || 0).toFixed ? (reportData.summary.cashRefundAmount || 0).toFixed(2) : "0.00", "Actual money returned"]);
        summaryData.push(["Net Actual Revenue (₹)", (reportData.summary.netActualRevenue ?? reportData.summary.netRevenue ?? 0).toFixed ? (reportData.summary.netActualRevenue ?? reportData.summary.netRevenue ?? 0).toFixed(2) : "0.00", "After cash refunds only"]);
      }
      if (reportData.summary.totalInvoices !== undefined) {
        summaryData.push(["GST SUMMARY"]);
        summaryData.push(["Total Invoices", reportData.summary.totalInvoices]);
        summaryData.push(["Taxable Value (₹)", reportData.summary.totalTaxableValue?.toFixed(2)]);
        summaryData.push(["CGST (₹)", reportData.summary.totalCGST?.toFixed(2)]);
        summaryData.push(["SGST (₹)", reportData.summary.totalSGST?.toFixed(2)]);
        summaryData.push(["Total Tax (₹)", reportData.summary.totalTax?.toFixed(2)]);
        summaryData.push(["Total Invoice Value (₹)", reportData.summary.totalInvoiceValue?.toFixed(2)]);
      }
      
      // Mode Breakdown
      if (reportData.modeBreakdown) {
        summaryData.push([]);
        summaryData.push(["SALES BY MODE"]);
        summaryData.push(["Mode", "Orders", "Amount (₹)"]);
        summaryData.push(["Online", reportData.modeBreakdown.online?.orders || 0, reportData.modeBreakdown.online?.amount?.toFixed(2) || "0.00"]);
        summaryData.push(["Offline (POS)", reportData.modeBreakdown.offline?.orders || 0, reportData.modeBreakdown.offline?.amount?.toFixed(2) || "0.00"]);
      }
      
      // Order Status Breakdown
      if (reportData.statusBreakdown) {
        summaryData.push([]);
        summaryData.push(["ORDER STATUS"]);
        Object.entries(reportData.statusBreakdown).forEach(([status, data]) => {
          summaryData.push([status, data.count, data.amount?.toFixed(2) || "0.00"]);
        });
      }
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    }

    // Create Monthly Breakdown Sheet (for yearly)
    if (reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0) {
      const monthlyData = reportData.monthlyBreakdown.map(m => ({
        "Month": m.month,
        "Orders": m.orders,
        "Sales (₹)": m.sales?.toFixed(2),
        "Discount (₹)": m.discount?.toFixed(2),
        "Revenue (₹)": m.revenue?.toFixed(2),
        "Avg Order Value (₹)": ((m.revenue || 0) / (m.orders || 1))?.toFixed(2)
      }));
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
      wsMonthly['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Breakdown");
    }

    // Create GST Invoices Sheet - with CGST/SGST/IGST split
    if (reportData.invoices && reportData.invoices.length > 0) {
      const invoicesData = reportData.invoices.map(inv => ({
        "Invoice Number": inv.invoiceNumber || "",
        "Invoice Date": dayjs(inv.invoiceDate).format('DD-MM-YYYY'),
        "Customer Name": inv.customerName || "Walk-in",
        "GSTIN": inv.gstin || "N/A",
        "GST Type": inv.gstType === 'IGST' ? 'Inter-state (IGST)' : inv.gstType === 'CGST_SGST' ? 'Intra-state (CGST+SGST)' : 'None',
        "Taxable Value (₹)": inv.taxableValue || "0.00",
        "CGST Rate (%)": inv.gstType === 'CGST_SGST' ? (inv.cgstRate || 0) : 0,
        "CGST Amount (₹)": inv.gstType === 'CGST_SGST' ? (inv.cgst || "0.00") : "0.00",
        "SGST Rate (%)": inv.gstType === 'CGST_SGST' ? (inv.sgstRate || 0) : 0,
        "SGST Amount (₹)": inv.gstType === 'CGST_SGST' ? (inv.sgst || "0.00") : "0.00",
        "IGST Rate (%)": inv.gstType === 'IGST' ? (inv.igstRate || 0) : 0,
        "IGST Amount (₹)": inv.gstType === 'IGST' ? (inv.igst || "0.00") : "0.00",
        "Total Tax (₹)": inv.totalTax || "0.00",
        "Invoice Value (₹)": inv.invoiceValue || "0.00"
      }));
      const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
      wsInvoices['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 22 },
        { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsInvoices, "GST Invoices");
    }

    // Create Products Sheet - Detailed
    if (reportData.products && reportData.products.length > 0) {
      const productsData = reportData.products.map((p, index) => ({
        "Sr No": index + 1,
        "Product Name": p.name || "",
        "HSN Code": p.hsnCode || "",
        "Brand": p.brand || "N/A",
        "Category": p.category || "N/A",
        "Barcode/SKU": p.barcode || "N/A",
        "Quantity Sold": p.quantitySold || 0,
        "Avg Selling Price (₹)": p.avgPrice?.toFixed(2) || "0.00",
        "Total Revenue (₹)": p.totalRevenue?.toFixed(2) || "0.00",
        "Contribution (%)": ((p.totalRevenue / (reportData.products.reduce((sum, x) => sum + x.totalRevenue, 0))) * 100)?.toFixed(2) || "0.00"
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productsData);
      wsProducts['!cols'] = [
        { wch: 8 }, { wch: 30 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProducts, "Product Sales");
    }

    // Create Customers Sheet - Detailed
    if (reportData.customers && reportData.customers.length > 0) {
      const customersData = reportData.customers.map((c, index) => ({
        "Sr No": index + 1,
        "Customer Name": c.name || "",
        "Mobile Number": c.mobile || "N/A",
        "Email": c.email || "N/A",
        "Total Orders": c.totalOrders || 0,
        "Total Purchase (₹)": c.totalPurchase?.toFixed(2) || "0.00",
        "Avg Order Value (₹)": c.avgOrderValue?.toFixed(2) || "0.00",
        "First Order Date": c.firstOrderDate ? dayjs(c.firstOrderDate).format('DD-MM-YYYY') : "N/A",
        "Last Order Date": c.lastOrderDate ? dayjs(c.lastOrderDate).format('DD-MM-YYYY') : "N/A"
      }));
      const wsCustomers = XLSX.utils.json_to_sheet(customersData);
      wsCustomers['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
        { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsCustomers, "Customer Sales");
    }

    // Create Mode Breakdown Sheet
    if (reportData.modeBreakdown) {
      const modeData = [
        ["SALES BY PAYMENT MODE"],
        [],
        ["Mode", "Number of Orders", "Amount (₹)", "Percentage"],
        ["Online", reportData.modeBreakdown.online?.orders || 0, reportData.modeBreakdown.online?.amount?.toFixed(2) || "0.00", ((reportData.modeBreakdown.online?.amount / (reportData.summary?.netRevenue || 1)) * 100)?.toFixed(2) + "%"],
        ["Offline (POS)", reportData.modeBreakdown.offline?.orders || 0, reportData.modeBreakdown.offline?.amount?.toFixed(2) || "0.00", ((reportData.modeBreakdown.offline?.amount / (reportData.summary?.netRevenue || 1)) * 100)?.toFixed(2) + "%"],
        [],
        ["TOTAL", (reportData.modeBreakdown.online?.orders || 0) + (reportData.modeBreakdown.offline?.orders || 0), (reportData.summary?.netRevenue || 0)?.toFixed(2), "100%"]
      ];
      const wsMode = XLSX.utils.aoa_to_sheet(modeData);
      wsMode['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsMode, "Payment Mode");
    }

    // Download Excel file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    message.success("Excel file downloaded successfully!");
  };

  // Send Report via Email
  const sendReportViaEmail = () => {
    let reportData = null;
    let reportTitle = "";
    let fileName = "";

    switch (activeTab) {
      case "monthly":
        reportData = monthlyReport;
        reportTitle = `Monthly Sales Report - ${monthNames[selectedMonth - 1]} ${selectedYear}`;
        fileName = `Monthly_Report_${monthNames[selectedMonth - 1]}_${selectedYear}`;
        break;
      case "yearly":
        reportData = yearlyReport;
        reportTitle = `Yearly Sales Report - ${selectedYear}`;
        fileName = `Yearly_Report_${selectedYear}`;
        break;
      case "gst":
        reportData = gstReport;
        reportTitle = `GST Report - ${monthNames[selectedMonth - 1]} ${selectedYear}`;
        fileName = `GST_Report_${monthNames[selectedMonth - 1]}_${selectedYear}`;
        break;
      default:
        message.info("Email feature available for Monthly, Yearly and GST reports");
        return;
    }

    if (!reportData) {
      message.warning("No data available to send report");
      return;
    }

    // Create email content
    const summary = reportData.summary || {};
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Cart Corner - ${reportTitle}</h2>
        <p>Please find attached the financial report for your reference.</p>
        
        <h3 style="color: #555;">Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Orders</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${summary.totalOrders || 0}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Sales</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatCurrency(summary.totalSales)}</td>
          </tr>
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Discount Given</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatCurrency(summary.totalDiscount)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Net Revenue</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${formatCurrency(summary.netRevenue)}</strong></td>
          </tr>
          ${reportData.modeBreakdown ? `
          <tr style="background-color: #e8f4fd;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Online Sales</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatCurrency(reportData.modeBreakdown.online?.amount)}</td>
          </tr>
          <tr style="background-color: #e8f4fd;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Offline Sales</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${formatCurrency(reportData.modeBreakdown.offline?.amount)}</td>
          </tr>
          ` : ''}
        </table>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated report generated from Cart Corner system.<br>
          Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
        </p>
      </div>
    `;

    // Show modal or prompt for email (in a real app, you'd integrate with email service)
    const email = window.prompt("Enter CA/Accountant email address to send report:");
    
    if (email && email.includes('@')) {
      // In a real implementation, you would call an API to send email
      // For now, we'll generate and download the Excel, then show success
      message.loading("Preparing report for email...", 2);
      
      setTimeout(() => {
        // Generate Excel and download
        generateExcel();
        message.success(`Report ready! In production, this would be sent to ${email}`);
      }, 2000);
    } else if (email) {
      message.error("Please enter a valid email address");
    }
  };

  const tabItems = [
    {
      key: "monthly",
      label: (
        <span><BarChartOutlined /> Monthly Report</span>
      ),
      children: (
        <div>
          <div className="flex gap-4 mb-6">
            <Select 
              value={selectedMonth} 
              onChange={setSelectedMonth}
              style={{ width: 150 }}
            >
              {monthNames.map((month, index) => (
                <Option key={index + 1} value={index + 1}>{month}</Option>
              ))}
            </Select>
            <Select 
              value={selectedYear} 
              onChange={setSelectedYear}
              style={{ width: 100 }}
            >
              {years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </div>

          {monthlyReport && (
            <>
              <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Orders" 
                      value={monthlyReport.summary?.totalOrders || 0}
                      prefix={<ShoppingCartOutlined />} 
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Sales" 
                      value={monthlyReport.summary?.totalSales || 0}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Discount Given" 
                      value={monthlyReport.summary?.totalDiscount || 0}
                      valueStyle={{ color: '#fa541c' }}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Net Revenue (Active Orders)" 
                      value={monthlyReport.summary?.netRevenue || 0}
                      valueStyle={{ color: '#52c41a' }}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card className="border-red-200 bg-red-50">
                    <Statistic
                      title="Cancelled Orders"
                      value={monthlyReport.summary?.cancelledOrders || 0}
                      valueStyle={{ color: '#cf1322' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹{(monthlyReport.summary?.cancelledAmount || 0).toFixed(2)} order value</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-yellow-200 bg-yellow-50">
                    <Statistic
                      title="Refunded as Coins"
                      value={monthlyReport.summary?.coinRefundAmount || 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#d48806' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cash stays in business</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-orange-200 bg-orange-50">
                    <Statistic
                      title="Cash Refunded"
                      value={monthlyReport.summary?.cashRefundAmount || 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#fa541c' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Actual money returned</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-green-200 bg-green-50">
                    <Statistic
                      title="Net Actual Revenue"
                      value={monthlyReport.summary?.netActualRevenue ?? monthlyReport.summary?.netRevenue ?? 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#389e0d' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">After cash refunds only</p>
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} className="mb-6">
                <Col span={12}>
                  <Card title="Sales by Mode" size="small">
                    <div className="flex justify-between mb-2">
                      <span>Online</span>
                      <Tag color="blue">₹{monthlyReport.modeBreakdown?.online?.amount?.toFixed(2)}</Tag>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Offline (POS)</span>
                      <Tag color="green">₹{monthlyReport.modeBreakdown?.offline?.amount?.toFixed(2)}</Tag>
                    </div>
                    <div className="flex justify-between font-semibold mt-4 pt-2 border-t">
                      <span>Total</span>
                      <span>₹{monthlyReport.summary?.netRevenue?.toFixed(2)}</span>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Order Status" size="small">
                    {Object.entries(monthlyReport.statusBreakdown || {}).map(([status, data]) => (
                      <div key={status} className="flex justify-between mb-2">
                        <Tag color={status === 'Delivered' ? 'green' : status === 'Cancelled' ? 'red' : 'blue'}>
                          {status}
                        </Tag>
                        <span>{data.count} orders</span>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>

              <Card title="Top Products" size="small" className="mb-6">
                <Table
                  dataSource={monthlyReport.topProducts?.map((p, i) => ({ ...p, key: i }))}
                  columns={[
                    { title: '#', dataIndex: 'key', width: 50, render: (r) => r + 1 },
                    { title: 'Product', dataIndex: 'name' },
                    { title: 'Brand', dataIndex: 'brand' },
                    { title: 'Quantity', dataIndex: 'quantity' },
                    { title: 'Revenue', dataIndex: 'revenue', render: (v) => `₹${v?.toFixed(2)}` }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>

              <Card title="Top Customers" size="small">
                <Table
                  dataSource={monthlyReport.topCustomers?.map((c, i) => ({ ...c, key: i }))}
                  columns={[
                    { title: '#', dataIndex: 'key', width: 50, render: (r) => r + 1 },
                    { title: 'Customer', dataIndex: 'name' },
                    { title: 'Mobile', dataIndex: 'mobile' },
                    { title: 'Orders', dataIndex: 'orders' },
                    { title: 'Total Spent', dataIndex: 'amount', render: (v) => `₹${v?.toFixed(2)}` }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: "yearly",
      label: (
        <span><LineChartOutlined /> Yearly Report</span>
      ),
      children: (
        <div>
          <div className="flex gap-4 mb-6">
            <Select 
              value={selectedYear} 
              onChange={setSelectedYear}
              style={{ width: 150 }}
            >
              {years.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<ClockCircleOutlined />}
              onClick={() => dispatch(getYearlyReportData({ year: selectedYear, paymentFilter }))}
            >
              Fetch Report
            </Button>
          </div>

          {yearlyReport && (
            <>
              <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Orders" 
                      value={yearlyReport.summary?.totalOrders || 0}
                      prefix={<ShoppingCartOutlined />} 
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Sales" 
                      value={yearlyReport.summary?.totalSales || 0}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Discount" 
                      value={yearlyReport.summary?.totalDiscount || 0}
                      valueStyle={{ color: '#fa541c' }}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Net Revenue (Active Orders)" 
                      value={yearlyReport.summary?.netRevenue || 0}
                      valueStyle={{ color: '#52c41a' }}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card className="border-red-200 bg-red-50">
                    <Statistic
                      title="Cancelled Orders"
                      value={yearlyReport.summary?.cancelledOrders || 0}
                      valueStyle={{ color: '#cf1322' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹{(yearlyReport.summary?.cancelledAmount || 0).toFixed(2)} order value</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-yellow-200 bg-yellow-50">
                    <Statistic
                      title="Refunded as Coins"
                      value={yearlyReport.summary?.coinRefundAmount || 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#d48806' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cash stays in business</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-orange-200 bg-orange-50">
                    <Statistic
                      title="Cash Refunded"
                      value={yearlyReport.summary?.cashRefundAmount || 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#fa541c' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Actual money returned</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-green-200 bg-green-50">
                    <Statistic
                      title="Net Actual Revenue"
                      value={yearlyReport.summary?.netActualRevenue ?? yearlyReport.summary?.netRevenue ?? 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#389e0d' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">After cash refunds only</p>
                  </Card>
                </Col>
              </Row>

              <Card title="Monthly Breakdown" size="small">
                <Table
                  dataSource={yearlyReport.monthlyBreakdown?.map((m, i) => ({ ...m, key: i }))}
                  columns={[
                    { title: 'Month', dataIndex: 'month' },
                    { title: 'Orders', dataIndex: 'orders', align: 'right' },
                    { title: 'Sales', dataIndex: 'sales', align: 'right', render: (v) => `₹${v?.toFixed(2)}` },
                    { title: 'Discount', dataIndex: 'discount', align: 'right', render: (v) => `₹${v?.toFixed(2)}` },
                    { title: 'Revenue', dataIndex: 'revenue', align: 'right', render: (v) => `₹${v?.toFixed(2)}` }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: "dateRange",
      label: (
        <span><ClockCircleOutlined /> Custom Range</span>
      ),
      children: (
        <div>
          <div className="flex gap-4 mb-6">
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
          </div>

          {dateRangeReport && (
            <>
              <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Orders" 
                      value={dateRangeReport.summary?.totalOrders || 0} 
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Total Sales" 
                      value={dateRangeReport.summary?.totalSales || 0}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Discount" 
                      value={dateRangeReport.summary?.totalDiscount || 0}
                      valueStyle={{ color: '#fa541c' }}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic 
                      title="Net Revenue (Active Orders)" 
                      value={dateRangeReport.summary?.netRevenue || 0}
                      valueStyle={{ color: '#52c41a' }}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} className="mb-4">
                <Col span={6}>
                  <Card className="border-red-200 bg-red-50">
                    <Statistic
                      title="Cancelled Orders"
                      value={dateRangeReport.summary?.cancelledOrders || 0}
                      valueStyle={{ color: '#cf1322' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹{(dateRangeReport.summary?.cancelledAmount || 0).toFixed(2)} order value</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-yellow-200 bg-yellow-50">
                    <Statistic
                      title="Refunded as Coins"
                      value={dateRangeReport.summary?.coinRefundAmount || 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#d48806' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cash stays in business</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-orange-200 bg-orange-50">
                    <Statistic
                      title="Cash Refunded"
                      value={dateRangeReport.summary?.cashRefundAmount || 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#fa541c' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Actual money returned</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-green-200 bg-green-50">
                    <Statistic
                      title="Net Actual Revenue"
                      value={dateRangeReport.summary?.netActualRevenue ?? dateRangeReport.summary?.netRevenue ?? 0}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#389e0d' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">After cash refunds only</p>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      ),
    },
    {
      key: "gst",
      label: (
        <span><PieChartOutlined /> GST Report</span>
      ),
      children: (
        <div>
          <div className="flex gap-4 mb-6">
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 150 }}>
              {monthNames.map((month, index) => (<Option key={index + 1} value={index + 1}>{month}</Option>))}
            </Select>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 100 }}>
              {years.map(year => (<Option key={year} value={year}>{year}</Option>))}
            </Select>
          </div>

          {gstReport && (
            <>
              {/* Summary Cards */}
              <Row gutter={16} className="mb-4">
                <Col span={6}>
                  <Card><Statistic title="Total Invoices" value={gstReport.summary?.totalInvoices || 0} /></Card>
                </Col>
                <Col span={6}>
                  <Card><Statistic title="Taxable Value" value={gstReport.summary?.totalTaxableValue || 0} prefix="₹" precision={2} /></Card>
                </Col>
                <Col span={6}>
                  <Card><Statistic title="Total Tax" value={gstReport.summary?.totalTax || 0} prefix="₹" precision={2} valueStyle={{ color: '#fa541c' }} /></Card>
                </Col>
                <Col span={6}>
                  <Card><Statistic title="Invoice Value" value={gstReport.summary?.totalInvoiceValue || 0} prefix="₹" precision={2} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
              </Row>

              {/* CGST / SGST / IGST Split */}
              <Row gutter={16} className="mb-6">
                <Col span={6}>
                  <Card className="border-green-200 bg-green-50">
                    <Statistic title="CGST (Intra-state)" value={gstReport.summary?.totalCGST || 0} prefix="₹" precision={2} valueStyle={{ color: '#16a34a' }} />
                    <p className="text-xs text-gray-500 mt-1">{gstReport.summary?.cgstSgstOrders || 0} intra-state orders</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-green-200 bg-green-50">
                    <Statistic title="SGST (Intra-state)" value={gstReport.summary?.totalSGST || 0} prefix="₹" precision={2} valueStyle={{ color: '#16a34a' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-orange-200 bg-orange-50">
                    <Statistic title="IGST (Inter-state)" value={gstReport.summary?.totalIGST || 0} prefix="₹" precision={2} valueStyle={{ color: '#ea580c' }} />
                    <p className="text-xs text-gray-500 mt-1">{gstReport.summary?.igstOrders || 0} inter-state orders</p>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="border-blue-200 bg-blue-50">
                    <Statistic title="CGST + SGST + IGST" value={gstReport.summary?.totalTax || 0} prefix="₹" precision={2} valueStyle={{ color: '#2563eb' }} />
                  </Card>
                </Col>
              </Row>

              <Card title="Invoice Details" size="small">
                <Table
                  dataSource={gstReport.invoices?.slice(0, 50).map((inv, i) => ({ ...inv, key: i }))}
                  columns={[
                    { title: 'Invoice #', dataIndex: 'invoiceNumber', width: 110 },
                    { title: 'Date', dataIndex: 'invoiceDate', render: (d) => dayjs(d).format('DD/MM/YYYY'), width: 100 },
                    { title: 'Customer', dataIndex: 'customerName', ellipsis: true },
                    { title: 'Type', dataIndex: 'gstType', width: 100, render: (v) => (
                      <Tag color={v === 'IGST' ? 'orange' : v === 'CGST_SGST' ? 'green' : 'default'}>
                        {v === 'IGST' ? 'IGST' : v === 'CGST_SGST' ? 'CGST+SGST' : 'None'}
                      </Tag>
                    )},
                    { title: 'Taxable', dataIndex: 'taxableValue', align: 'right', width: 90 },
                    { title: 'CGST', dataIndex: 'cgst', align: 'right', width: 80, render: (v, r) => r.gstType === 'CGST_SGST' ? `₹${v}` : '-' },
                    { title: 'SGST', dataIndex: 'sgst', align: 'right', width: 80, render: (v, r) => r.gstType === 'CGST_SGST' ? `₹${v}` : '-' },
                    { title: 'IGST', dataIndex: 'igst', align: 'right', width: 80, render: (v, r) => r.gstType === 'IGST' ? `₹${v}` : '-' },
                    { title: 'Total', dataIndex: 'invoiceValue', align: 'right', width: 90, render: (v) => <b>₹{v}</b> }
                  ]}
                  pagination={{ pageSize: 20 }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: "products",
      label: (
        <span><ShoppingCartOutlined /> Product-wise</span>
      ),
      children: (
        <div>
          <div className="flex gap-4 mb-6">
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
            <Button 
              type="primary" 
              icon={<BarChartOutlined />}
              onClick={handleProductWiseReport}
            >
              Generate Report
            </Button>
          </div>

          {productWiseReport && (
            <Card>
              <Table
                dataSource={productWiseReport.products?.map((p, i) => ({ ...p, key: i }))}
                columns={[
                  { title: '#', dataIndex: 'key', width: 50, render: (r) => r + 1 },
                  { title: 'Product', dataIndex: 'name', ellipsis: true },
                  { title: 'HSN', dataIndex: 'hsnCode' },
                  { title: 'Brand', dataIndex: 'brand' },
                  { title: 'Barcode', dataIndex: 'barcode' },
                  { title: 'Qty Sold', dataIndex: 'quantitySold', align: 'right' },
                  { title: 'Avg Price', dataIndex: 'avgPrice', align: 'right', render: (v) => `₹${v}` },
                  { title: 'Revenue', dataIndex: 'totalRevenue', align: 'right', render: (v) => <b>₹{v}</b> }
                ]}
                pagination={{ pageSize: 20 }}
                size="small"
                summary={(pageData) => {
                  const totalQty = pageData.reduce((sum, p) => sum + p.quantitySold, 0);
                  const totalRev = pageData.reduce((sum, p) => sum + parseFloat(p.totalRevenue), 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={4}><b>Page Total</b></Table.Summary.Cell>
                      <Table.Summary.Cell align="right"><b>{totalQty}</b></Table.Summary.Cell>
                      <Table.Summary.Cell></Table.Summary.Cell>
                      <Table.Summary.Cell align="right"><b>₹{totalRev.toFixed(2)}</b></Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: "customers",
      label: (
        <span><UserOutlined /> Customer-wise</span>
      ),
      children: (
        <div>
          <div className="flex gap-4 mb-6">
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
            <Button 
              type="primary" 
              icon={<UserOutlined />}
              onClick={handleCustomerWiseReport}
            >
              Generate Report
            </Button>
          </div>

          {customerWiseReport && (
            <>
              <Row gutter={16} className="mb-6">
                <Col span={8}>
                  <Card>
                    <Statistic 
                      title="Total Customers" 
                      value={customerWiseReport.summary?.totalCustomers || 0} 
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic 
                      title="Walk-in Orders" 
                      value={customerWiseReport.summary?.walkInOrders || 0} 
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic 
                      title="Total Revenue" 
                      value={customerWiseReport.summary?.totalRevenue || 0}
                      prefix="₹"
                      precision={2}
                    />
                  </Card>
                </Col>
              </Row>

              <Card>
                <Table
                  dataSource={customerWiseReport.customers?.map((c, i) => ({ ...c, key: i }))}
                  columns={[
                    { title: '#', dataIndex: 'key', width: 50, render: (r) => r + 1 },
                    { title: 'Customer', dataIndex: 'name' },
                    { title: 'Mobile', dataIndex: 'mobile' },
                    { title: 'Email', dataIndex: 'email', ellipsis: true },
                    { title: 'Orders', dataIndex: 'totalOrders', align: 'right' },
                    { title: 'Avg Order', dataIndex: 'avgOrderValue', align: 'right', render: (v) => `₹${v}` },
                    { title: 'Total Spent', dataIndex: 'totalPurchase', align: 'right', render: (v) => <b>₹{v}</b> }
                  ]}
                  pagination={{ pageSize: 20 }}
                  size="small"
                />
              </Card>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="reports-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="title" style={{ margin: 0 }}>Reports</h3>
          <p className="text-gray-500 text-sm">Generate reports for CA / Accountant</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">Payment filter:</span>
          <Select
            value={paymentFilter}
            onChange={setPaymentFilter}
            style={{ width: 240 }}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Cash', value: 'cash' },
              { label: 'Online - Current Account', value: 'online_current' },
              { label: 'Online - Other Account', value: 'online_other' },
            ]}
          />
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />}
            onClick={generatePDF}
            className="bg-red-500"
          >
            Export PDF
          </Button>
          <Button 
            type="primary" 
            icon={<FileExcelOutlined />}
            onClick={generateExcel}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Export Excel
          </Button>
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={sendReportViaEmail}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            Send to CA
          </Button>
        </Space>
      </div>

      <Card>
        <Spin spinning={isLoading}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Reports;

