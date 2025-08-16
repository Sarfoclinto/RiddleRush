// progress bar
// // basic
// <LoadingDots />

// // 5 red dots, 12px, faster
// <LoadingDots dotCount={5} color="#ef4444" size={12} speed={0.5} />

// // small inline loader inside a button (inline)
// <button>
//   Save
//   <LoadingDots inline size={6} color="white" style={{ marginLeft: 8 }} />
// </button>

// // text + centered
// <LoadingDots text="Loading comments…" />

// // bounce variant, bigger and spaced
// <LoadingDots variant="bounce" dotCount={4} size="10px" gap="10px" />


// score bar
// <ScoreBar correct={7} incorrect={2} skipped={1} />

// <ScoreBar correct={12} incorrect={3} skipped={5} showLegend={false} height={10} />

// <ScoreBar
//   segments={[
//     { key: "correct", label: "Correct", value: 8, color: "#10b981" },
//     { key: "incorrect", label: "Incorrect", value: 3, color: "#ef4444" },
//     { key: "skipped", label: "Skipped", value: 1, color: "#f59e0b" },
//     { key: "bonus", label: "Bonus", value: 2, color: "#6366f1" },
//   ]}
// />

// <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//   <span>Score</span>
//   <div style={{ width: 160 }}>
//     <ScoreBar correct={3} incorrect={1} skipped={0} showLegend={false} height={8} />
//   </div>
// </div>
