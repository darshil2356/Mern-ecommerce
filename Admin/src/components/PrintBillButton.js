import React from "react";
import { Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

const PrintBillButton = ({ 
  cart, 
  customer, 
  payableAmount,
  cgstAmount = 0,
  sgstAmount = 0,
  igstAmount = 0,
  gstType = "CGST_SGST",
  cgstPercent = 0,
  sgstPercent = 0,
  igstPercent = 0,
  discountAmount = 0,
  coinDiscountAmount = 0,
  coinsUsed = 0,
  subtotal = 0,
  invoiceNumber = null,
  gstin = ""
}) => {
  // Generate invoice number if not provided
  const generateInvoiceNumber = () => {
    if (invoiceNumber) return invoiceNumber;
    const date = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${random}`;
  };

  const printBill = () => {
    if (!Object.keys(cart).length) {
      Swal.fire({
        icon: 'warning',
        title: 'Cart is Empty',
        text: 'Please add items to the cart before printing.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const invoiceNum = generateInvoiceNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const effectiveSubtotal = subtotal || payableAmount + discountAmount + coinDiscountAmount - cgstAmount - sgstAmount - igstAmount;
    const totalDiscount = discountAmount + coinDiscountAmount;
    const displayCoinsUsed = coinsUsed || coinDiscountAmount;

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
                <p class="font-semibold text-gray-800">${customer.name || "Walk-in Customer"}</p>
                <p class="text-sm text-gray-600">${customer.address || "N/A"}</p>
                ${customer.mobile ? `<p class="text-sm text-gray-600">📞 ${customer.mobile}</p>` : ''}
                ${gstin ? `<p class="text-sm text-gray-600 font-medium">GSTIN: ${gstin}</p>` : ''}
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600"><span class="text-gray-500">Date:</span> ${dateStr}</p>
                <p class="text-sm text-gray-600"><span class="text-gray-500">Time:</span> ${timeStr}</p>
                <p class="text-sm text-gray-600"><span class="text-gray-500">Payment:</span> <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">CASH</span></p>
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
                  ${Object.values(cart)
                    .map(
                      (item, index) => `
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="py-3 px-2 text-gray-500">${index + 1}</td>
                      <td class="py-3 px-2 font-medium text-gray-800">${item.name}</td>
                      <td class="py-3 px-2 text-center text-gray-600">${item.qty}</td>
                      <td class="py-3 px-2 text-right text-gray-600">₹${item.price.toFixed(2)}</td>
                      <td class="py-3 px-2 text-right font-medium text-gray-800">₹${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>

              <!-- Summary Section -->
              <div class="mt-6 flex justify-end">
                <div class="w-72">
                  <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Subtotal</span>
                      <span class="font-medium">₹${effectiveSubtotal.toFixed(2)}</span>
                    </div>
                    ${cgstAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">CGST (${cgstPercent}%)</span>
                      <span class="text-green-600">+₹${cgstAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${sgstAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">SGST (${sgstPercent}%)</span>
                      <span class="text-green-600">+₹${sgstAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${igstAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">IGST (${igstPercent}%)</span>
                      <span class="text-green-600">+₹${igstAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${discountAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Discount</span>
                      <span class="text-red-600">-₹${discountAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${coinDiscountAmount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Coin Discount (${displayCoinsUsed} coins)</span>
                      <span class="text-red-600">-₹${coinDiscountAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    ${totalDiscount > 0 ? `
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-700 font-medium">Total Discount</span>
                      <span class="text-red-700 font-medium">-₹${totalDiscount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="border-t border-gray-200 pt-2 mt-2">
                      <div class="flex justify-between items-center">
                        <span class="text-lg font-bold text-gray-800">Total Payable</span>
                        <span class="text-2xl font-bold text-blue-600">₹${payableAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div class="text-center pt-2">
                      <span class="text-xs text-gray-400">Amount in Words</span>
                      <p class="text-sm font-medium text-gray-700">${numberToWords(payableAmount)} Rupees Only</p>
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
  };

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

  return (
    <Button
      icon={<PrinterOutlined />}
      onClick={printBill}
      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg h-10 font-medium shadow-md hover:shadow-lg transition-all duration-200 border-0"
    >
      Print Bill
    </Button>
  );
};

export default PrintBillButton;
