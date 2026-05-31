/**
 * exportToExcel – converts arrays of objects to a multi-sheet Excel workbook
 * and triggers an immediate browser download.
 *
 * Usage (single sheet):
 *   exportToExcel([{ name: "Products", data: productsArray }], "products.xlsx");
 *
 * Usage (multi-sheet):
 *   exportToExcel(
 *     [
 *       { name: "Products", data: productsArray },
 *       { name: "Orders",   data: ordersArray   },
 *     ],
 *     "dashboard-export.xlsx",
 *   );
 */

/**
 * @param {Array<{ name: string, data: object[] }>} sheets
 * @param {string} [filename]
 */
export async function exportToExcel(sheets, filename = "export.xlsx") {
  // Dynamically import xlsx so it is NOT included in the initial JS bundle.
  // It is only downloaded the first time the user clicks Export.
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    if (!data || data.length === 0) {
      // Still write an empty sheet so the tab exists
      const ws = XLSX.utils.aoa_to_sheet([["No data available"]]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths based on header lengths
    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length + 2, 14),
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });

  XLSX.writeFile(wb, filename);
}

// ─── Formatter helpers ─────────────────────────────────────────────────────

/** Flatten a products array into export-friendly rows */
export function formatProductsForExport(products) {
  return products.map((p) => ({
    ID: p._id,
    SKU: p.sku || "",
    Name: p.name,
    Category: p.category,
    "Cost Price (PKR)": p.costPrice ?? "",
    "Price (PKR)": p.price,
    Stock: p.stock,
    Rating: p.rating ?? 0,
    Reviews: p.numReviews ?? 0,
    Active: p.isActive ? "Yes" : "No",
    "Created At": p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
  }));
}

/** Flatten an orders array into export-friendly rows */
export function formatOrdersForExport(orders) {
  const formatBatchAllocations = (item) => {
    const allocations = Array.isArray(item?.batchAllocations)
      ? item.batchAllocations
      : [];

    if (allocations.length === 0) {
      return "—";
    }

    return allocations
      .map(
        (allocation) =>
          `${allocation.batchNumber || "Unknown"}: ${Number(allocation.quantity || 0)}`,
      )
      .join(" | ");
  };

  return orders.flatMap((o) => {
    const items = Array.isArray(o.orderItems) ? o.orderItems : [];
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const shippingCost = Number(o.shippingPrice || 0);
    const taxAmount = Number(o.taxPrice || 0);
    const totalOrderValue = Number(o.totalPrice ?? o.total ?? 0);
    const discountApplied = Math.max(
      subtotal + shippingCost + taxAmount - totalOrderValue,
      0,
    );

    const baseRow = {
      "Order ID": o._id,
      "Customer Name": o.user?.name || "—",
      "Customer Email": o.user?.email || "—",
      "Total Order Value (PKR)": totalOrderValue,
      "Payment Status": o.isPaid ? "Paid" : "Unpaid",
      "Order Status": o.status || "pending",
      "Discount Applied (PKR)": discountApplied,
      "Shipping Cost (PKR)": shippingCost,
      "Payment Method": o.paymentMethod || "—",
      "Placed At": o.createdAt
        ? new Date(o.createdAt).toLocaleDateString()
        : "",
    };

    if (items.length === 0) {
      return [
        {
          ...baseRow,
          "Product Name": "—",
          Quantity: 0,
          "Price Per Item (PKR)": 0,
          "Batch Allocations": "—",
        },
      ];
    }

    return items.map((item, index) => ({
      ...baseRow,
      "Total Order Value (PKR)": index === 0 ? totalOrderValue : "",
      "Product Name": item.name || item.product?.name || "—",
      Quantity: Number(item.quantity || 0),
      "Price Per Item (PKR)": Number(item.price || 0),
      "Batch Allocations": formatBatchAllocations(item),
    }));
  });
}

/** Flatten a users array into export-friendly rows */
export function formatUsersForExport(users) {
  return users.map((u) => ({
    ID: u._id,
    "First Name": u.firstName || (u.name ? u.name.split(" ")[0] : ""),
    "Last Name":
      u.lastName || (u.name ? u.name.split(" ").slice(1).join(" ") : ""),
    Email: u.email,
    Role: u.role,
    "Joined At": u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
  }));
}

/** Flatten a categories array into export-friendly rows */
export function formatCategoriesForExport(categories) {
  return categories.map((c) => ({
    ID: c._id,
    Name: c.name,
    Value: c.value,
    Description: c.description || "",
    Active: c.isActive ? "Yes" : "No",
  }));
}
