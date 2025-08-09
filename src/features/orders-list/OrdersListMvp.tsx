import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "../../entities/order/types";
import { getOrders } from "../../entities/order/api";
import OrdersFilterBar from "./OrdersFilterBar";

interface SavedView {
  name: string;
  search: string;
  visibleColumns: (keyof Order)[];
  sortKey: keyof Order;
  sortOrder: "asc" | "desc";
  page: number;
}

const ALL_COLUMNS: { key: keyof Order; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "client", label: "Client" },
  { key: "property", label: "Property" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "assigned", label: "Assigned" },
  { key: "due", label: "Due" },
  { key: "sla", label: "SLA" },
  { key: "lastActivity", label: "Last Activity" },
];

const SAVED_VIEWS_KEY = "orders-list-mvp-saved-views";

const OrdersListMvp: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Determine an initial saved view from localStorage. If any saved views
   * exist we take the most recently saved one (last in the array) and
   * hydrate our local component state accordingly. This provides the
   * "auto‑load on mount" behaviour required by the MVP.
   */
  const initialView: SavedView | null = (() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (!raw) return null;
      const parsed: SavedView[] = JSON.parse(raw);
      return parsed.length > 0 ? parsed[parsed.length - 1] : null;
    } catch {
      return null;
    }
  })();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // initialize search and view parameters from the last saved view if available
  const [search, setSearch] = useState(initialView?.search ?? "");
  const [visibleColumns, setVisibleColumns] = useState<(keyof Order)[]>(() =>
    initialView?.visibleColumns ?? ALL_COLUMNS.map((c) => c.key)
  );
  const [sortKey, setSortKey] = useState<keyof Order>(
    initialView?.sortKey ?? "id"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    initialView?.sortOrder ?? "asc"
  );
  const [currentPage, setCurrentPage] = useState(
    initialView?.page ?? 1
  );
  const pageSize = 10;
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_VIEWS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    getOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load orders");
        setLoading(false);
      });
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();
    return Object.values(order).some((val) => {
      if (typeof val === "string") {
        return val.toLowerCase().includes(searchLower);
      }
      return false;
    });
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedOrders.length / pageSize);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleColumn = (key: keyof Order) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter((col) => col !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  const handleSort = (key: keyof Order) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleSaveView = () => {
    const name = prompt("Enter view name");
    if (!name) return;
    const newView: SavedView = {
      name,
      search,
      visibleColumns,
      sortKey,
      sortOrder,
      page: currentPage,
    };
    const newViews = [...savedViews, newView];
    setSavedViews(newViews);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(newViews));
  };

  const applyView = (view: SavedView) => {
    setSearch(view.search);
    setVisibleColumns(view.visibleColumns);
    setSortKey(view.sortKey);
    setSortOrder(view.sortOrder);
    setCurrentPage(view.page);
  };

  const handleRowClick = (id: string) => {
    navigate("/orders/" + id);
  };

  const toggleRowSelection = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const toggleAllSelection = () => {
    if (selected.length === paginatedOrders.length) {
      setSelected([]);
    } else {
      setSelected(paginatedOrders.map((o) => o.id));
    }
  };

  const handleBulkAction = () => {
    alert("Bulk action on " + selected.length + " items");
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        {/* Reuse the existing OrdersFilterBar component for the search input */}
        <OrdersFilterBar search={search} setSearch={setSearch} />
        <div className="flex space-x-2">
          <button
            onClick={handleSaveView}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Save View
          </button>
          <select
            onChange={(e) => {
              const index = e.target.selectedIndex - 1;
              if (index >= 0) applyView(savedViews[index]);
            }}
            className="border p-2 rounded"
          >
            <option>Saved Views</option>
            {savedViews.map((view, index) => (
              <option key={index}>{view.name}</option>
            ))}
          </select>
          <div className="relative">
            <button
              className="bg-gray-200 p-2 rounded"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1 bg-white border p-2 z-10 space-y-1">
                {ALL_COLUMNS.map((col) => (
                  <label key={String(col.key)} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="my-2">
          <button
            onClick={handleBulkAction}
            className="bg-purple-500 text-white px-2 py-1 rounded"
          >
            Bulk Action
          </button>
          <span className="ml-2">{selected.length} selected</span>
        </div>
      )}
      <table className="min-w-full mt-4 border">
        <thead>
          <tr>
            <th className="border px-2 py-1">
              <input
                type="checkbox"
                checked={
                  selected.length === paginatedOrders.length &&
                  paginatedOrders.length > 0
                }
                onChange={toggleAllSelection}
              />
            </th>
            {ALL_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map(
              (col) => (
                <th
                  key={String(col.key)}
                  className="border px-2 py-1 cursor-pointer select-none"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}{" "}
                  {sortKey === col.key
                    ? sortOrder === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-100">
              <td className="border px-2 py-1">
                <input
                  type="checkbox"
                  checked={selected.includes(order.id)}
                  onChange={() => toggleRowSelection(order.id)}
                />
              </td>
              {ALL_COLUMNS.filter((col) =>
                visibleColumns.includes(col.key)
              ).map((col) => (
                <td
                  key={String(col.key)}
                  className="border px-2 py-1 cursor-pointer"
                  onClick={() => handleRowClick(order.id)}
                >
                  {String(order[col.key])}
                </td>
              ))}
            </tr>
          ))}
          {paginatedOrders.length === 0 && (
            <tr>
              <td
                colSpan={visibleColumns.length + 1}
                className="text-center py-2 border"
              >
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-2 flex space-x-2 items-center">
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OrdersListMvp;
