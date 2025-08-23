import { Avatar } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Id } from "myconvex/_generated/dataModel";

export interface Player {
  user: {
    _id: Id<"users">;
    _creationTime: number;
    email?: string | undefined;
    fullname?: string | undefined;
    clerkId?: string | undefined;
    image?: string | undefined;
    username: string;
  } | null;
  ishost: boolean;
  _id: Id<"roomPlayers">;
  _creationTime: number;
  ready?: boolean | undefined;
  joinIndex?: number | undefined;
  userId: Id<"users">;
  roomId: Id<"rooms">;
}

export interface Play {
  done: boolean;
  riddleId: Id<"riddles">;
  playedBy: Id<"users">;
  turnIndex: number;
  result: "skipped" | "correct" | "incorrect" | "timedOut";
}

export interface RankingRow {
  key: Id<"users">; // AntD uses `key`
  playerId: Id<"users">;
  rank: number; // 1-based rank after sorting
  name: string;
  avatar?: string | null;
  corrects: number;
  incorrect: number;
  skipped: number;
  timeout: number;
  total: number;
  accuracy: number; // 0..100 (percentage, 2 decimals)
}

/**
 * Build a ranking table from players + plays.
 *
 * @param players - array of Player objects from the room
 * @param plays - array of Play objects recorded during the game
 * @param options - optional sorting options
 * @returns RankingRow[] ready to render in a table.
 */
export function buildRankingTable(
  players: Player[],
  plays: Play[],
  options?: {
    sortBy?: "corrects" | "total" | "name";
    direction?: "desc" | "asc";
    includeNonPlayers?: boolean; // if true, include plays from users not present in players
  }
): { dataSource: RankingRow[]; columns: ColumnsType<RankingRow> } {
  const {
    sortBy = "corrects",
    direction = "desc",
    includeNonPlayers = false,
  } = options ?? {};

  // initialize map userId -> partial row using players
  const map = new Map<Id<"users">, Partial<RankingRow>>();

  for (const p of players) {
    const userId = p.user?._id ?? p.userId;
    const name =
      p.user?.fullname?.trim() || p.user?.username?.trim() || String(userId);

    map.set(userId, {
      key: userId,
      playerId: userId,
      name,
      avatar: p.user?.image ?? null,
      corrects: 0,
      incorrect: 0,
      skipped: 0,
      timeout: 0,
      total: 0,
      accuracy: 0,
      rank: 0,
    });
  }

  // Helper to ensure row exists (for plays from users not in players array)
  function ensure(userId: Id<"users">): Partial<RankingRow> {
    let r = map.get(userId);
    if (!r) {
      r = {
        key: userId,
        playerId: userId,
        name: String(userId),
        avatar: null,
        corrects: 0,
        incorrect: 0,
        skipped: 0,
        timeout: 0,
        total: 0,
        accuracy: 0,
        rank: 0,
      };
      map.set(userId, r);
    }
    return r;
  }

  // Aggregate plays
  for (const play of plays) {
    const userId = play.playedBy;
    if (!map.has(userId) && !includeNonPlayers) continue;
    const row = ensure(userId);

    switch (play.result) {
      case "correct":
        row.corrects = (row.corrects ?? 0) + 1;
        break;
      case "incorrect":
        row.incorrect = (row.incorrect ?? 0) + 1;
        break;
      case "skipped":
        row.skipped = (row.skipped ?? 0) + 1;
        break;
      case "timedOut":
        row.timeout = (row.timeout ?? 0) + 1;
        break;
    }
    row.total =
      (row.corrects ?? 0) +
      (row.incorrect ?? 0) +
      (row.skipped ?? 0) +
      (row.timeout ?? 0);
    row.accuracy =
      row.total > 0
        ? Number((((row.corrects ?? 0) / row.total) * 100).toFixed(2))
        : 0;
  }

  // Convert to full rows
  const rows: RankingRow[] = Array.from(map.values()).map((r) => ({
    key: r.key as Id<"users">,
    playerId: r.playerId as Id<"users">,
    rank: 0,
    name: (r.name ?? "") as string,
    avatar: (r.avatar ?? null) as string | null,
    corrects: (r.corrects ?? 0) as number,
    incorrect: (r.incorrect ?? 0) as number,
    skipped: (r.skipped ?? 0) as number,
    timeout: (r.timeout ?? 0) as number,
    total: (r.total ?? 0) as number,
    accuracy: (r.accuracy ?? 0) as number,
  }));

  // Sorting comparator (same tiebreakers you approved)
  const dirFactor = direction === "desc" ? -1 : 1;
  const comparator =
    sortBy === "corrects"
      ? (a: RankingRow, b: RankingRow) => {
          if (a.corrects !== b.corrects)
            return (a.corrects - b.corrects) * dirFactor;
          if (a.incorrect !== b.incorrect)
            return (a.incorrect - b.incorrect) * -1; // fewer incorrect is better
          if (a.total !== b.total) return (a.total - b.total) * dirFactor;
          return a.name.localeCompare(b.name);
        }
      : sortBy === "total"
        ? (a: RankingRow, b: RankingRow) => {
            if (a.total !== b.total) return (a.total - b.total) * dirFactor;
            if (a.corrects !== b.corrects)
              return (a.corrects - b.corrects) * -1; // more corrects preferred
            return a.name.localeCompare(b.name);
          }
        : (a: RankingRow, b: RankingRow) =>
            a.name.localeCompare(b.name) * dirFactor;

  rows.sort(comparator);

  // assign ranks (1-based), ties get same rank (standard competition ranking "1224")
  let currentRank = 0;
  let lastValues: {
    corrects?: number;
    incorrect?: number;
    total?: number;
    name?: string;
  } | null = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const compKey = {
      corrects: r.corrects,
      incorrect: r.incorrect,
      total: r.total,
      name: r.name,
    };
    if (
      !lastValues ||
      compKey.corrects !== lastValues.corrects ||
      compKey.incorrect !== lastValues.incorrect ||
      compKey.total !== lastValues.total
    ) {
      currentRank = i + 1;
      lastValues = compKey;
    }
    r.rank = currentRank;
  }

  // AntD columns
  const columns: ColumnsType<RankingRow> = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      sorter: (a, b) => a.rank - b.rank,
      defaultSortOrder:
        sortBy === "corrects" && direction === "desc" ? "ascend" : undefined, // keep natural ordering visible
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            src={record.avatar ?? undefined}
            alt={record.name}
            style={{ width: 32, height: 32 }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
              {record.playerId}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Corrects",
      dataIndex: "corrects",
      key: "corrects",
      sorter: (a, b) => a.corrects - b.corrects,
      defaultSortOrder:
        sortBy === "corrects" && direction === "desc" ? "descend" : undefined,
    },
    {
      title: "Incorrect",
      dataIndex: "incorrect",
      key: "incorrect",
      sorter: (a, b) => a.incorrect - b.incorrect,
    },
    {
      title: "Skipped",
      dataIndex: "skipped",
      key: "skipped",
      sorter: (a, b) => a.skipped - b.skipped,
    },
    {
      title: "Timeout",
      dataIndex: "timeout",
      key: "timeout",
      sorter: (a, b) => a.timeout - b.timeout,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Accuracy",
      dataIndex: "accuracy",
      key: "accuracy",
      sorter: (a, b) => a.accuracy - b.accuracy,
      render: (v: number) => `${v.toFixed(2)}%`,
    },
  ];

  return { dataSource: rows, columns };
}
