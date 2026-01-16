import { UsersTable } from "@/features/admin/components/UsersTable";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi, quản lý và kiểm soát quyền truy cập của người dùng hệ thống.
        </p>
      </div>

      <UsersTable />
    </div>
  );
}
