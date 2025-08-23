import { Avatar } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";

/**
 * Reuse the RankingRow type from your previous module. If it's declared in the same file,
 * import it. Otherwise duplicate this lightweight subset:
 */
export interface RankingRow {
  key: string;
  playerId: string;
  rank: number;
  name: string;
  avatar?: string | null;
  corrects: number;
  incorrect: number;
  skipped: number;
  timeout: number;
  total: number;
  accuracy: number; // 0..100
}

/** Compact row for mobile */
export interface CompactRankingRow {
  key: string;
  rank: number;
  name: string;
  avatar?: string | null;
  // a short human-friendly stats string to show on one line
  statsShort: string | ReactNode;
  accuracy: number; // 0..100
  total: number;
}

/**
 * Convert existing RankingRow[] -> CompactRankingRow[] (mobile friendly)
 * Keep it pure and small — you can call this during render or once after build.
 */
export function toCompactRows(rows: RankingRow[]): CompactRankingRow[] {
  return rows.map((r) => {
    const statsShort = (
      <span className="text-xs font-medium flex items-center gap-1">
        <span className="flex items-center gap-0.5">
          <span className="p-1 rounded-full bg-green-400" />
          <span>{r.corrects}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="p-1 rounded-full bg-primary" />
          <span>{r.incorrect}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="p-1 rounded-full bg-amber-400" />
          <span>{r.skipped}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="p-1 rounded-full bg-sky-400" />
          <span>{r.timeout}</span>
        </span>
      </span>
    );
    // const statsShort = `✅${r.corrects}  ❌${r.incorrect}  ⏭${r.skipped}  ⏱${r.timeout}`;
    return {
      key: r.key,
      rank: r.rank,
      name: r.name,
      avatar: r.avatar ?? null,
      statsShort,
      accuracy: r.accuracy,
      total: r.total,
    };
  });
}

/**
 * Columns optimized for mobile: single primary column for name/stats and a small accuracy column.
 * You can use these columns directly with antd Table when on mobile.
 */
export function mobileColumns(): ColumnsType<CompactRankingRow> {
  return [
    {
      title: "Player",
      dataIndex: "name",
      key: "player",
      // Make this the main visual row: avatar, name + rank, and the short stats line underneath
      render: (_, record) => {
        // initials fallback
        const initials = (record.name || "")
          .split(" ")
          .map((part) => part[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              src={record.avatar ?? undefined}
              alt={record.name}
              size={36}
            >
              {!record.avatar ? initials : null}
            </Avatar>

            <div
              style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {record.name}
                </div>
                <div
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: "rgba(0,0,0,0.45)",
                  }}
                >
                  #{record.rank}
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "rgba(0,0,0,0.45)",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {record.statsShort}
              </div>
            </div>
          </div>
        );
      },
      // keep this sortable by name if you want to allow users to sort on mobile
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Acc",
      dataIndex: "accuracy",
      key: "accuracy",
      width: 90,
      align: "right",
      render: (v: number) => `${v.toFixed(2)}%`,
      sorter: (a, b) => a.accuracy - b.accuracy,
      // keep this column visible on mobile as a compact numeric indicator
      responsive: ["xs", "sm", "md", "lg", "xl"],
    },
  ];
}

/**
 * Small usage helper: build both for convenience.
 * Accepts the RankingRow[] from your existing function and returns both mobile rows + columns.
 */
export function buildMobileConfigFromRankingRows(rows: RankingRow[]) {
  const dataSource = toCompactRows(rows);
  const columns = mobileColumns();
  return { dataSource, columns };
}
