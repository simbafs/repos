export function Cell({
  children,
  action,
}: {
  children?: React.ReactNode;
  action?: () => void;
}) {
  return (
    <div className="border p-2 break-all" onDoubleClick={action}>
      {children}
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[2fr_2fr_8rem_8rem_8rem] hover:bg-blue-200">
      {children}
    </div>
  );
}
