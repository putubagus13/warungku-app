"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/utils";
import { useState } from "react";

interface TopItem {
  name: string;
  total: number;
  qty: number;
}

interface Props {
  products: TopItem[];
  categories: TopItem[];
}

const COLORS_PRODUCTS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];
const COLORS_CATEGORIES = [
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #e4e4e7",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
        }}
      >
        <p style={{ fontWeight: 600, color: "#3f3f46", marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ color: "#71717a" }}>
          Pendapatan:{" "}
          <strong style={{ color: "#18181b" }}>
            {formatCurrency(payload[0]?.value)}
          </strong>
        </p>
        {payload[0]?.payload?.qty > 0 && (
          <p style={{ color: "#71717a" }}>
            Terjual:{" "}
            <strong style={{ color: "#18181b" }}>
              {payload[0].payload.qty} pcs
            </strong>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function TopProductsChart({ products, categories }: Props) {
  const [view, setView] = useState<"products" | "categories">("products");
  const data = view === "products" ? products : categories;
  const colors = view === "products" ? COLORS_PRODUCTS : COLORS_CATEGORIES;

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
          color: "#a1a1aa",
        }}
      >
        <p style={{ fontSize: 13 }}>Belum ada data transaksi</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { val: "products", label: "Produk Terlaris", active: "#16a34a" },
          { val: "categories", label: "Kategori Terlaris", active: "#7c3aed" },
        ].map((btn) => (
          <button
            key={btn.val}
            onClick={() => setView(btn.val as any)}
            style={{
              fontSize: 11,
              padding: "3px 12px",
              borderRadius: 99,
              border: `1px solid ${view === btn.val ? btn.active : "#e4e4e7"}`,
              background: view === btn.val ? btn.active : "white",
              color: view === btn.val ? "white" : "#71717a",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          barSize={16}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#f4f4f5"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#52525b" }}
            axisLine={false}
            tickLine={false}
            width={88}
            tickFormatter={(v) => (v.length > 11 ? v.slice(0, 11) + "…" : v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="total" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
