export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white overflow-auto" style={{ height: "auto" }}>
      <style>{`html, body { overflow: auto !important; height: auto !important; }`}</style>
      {children}
    </div>
  );
}
