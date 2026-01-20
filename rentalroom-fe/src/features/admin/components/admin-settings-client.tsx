"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Database, Lock } from "lucide-react";

export function AdminSettingsClient() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
          Cài đặt hệ thống
        </h1>
        <p className="text-muted-foreground mt-1">Quản lý cấu hình và quyền hạn hệ thống</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: "var(--primary)" }} />
              <CardTitle>Thông báo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Thông báo thanh toán quá hạn</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Thông báo hợp đồng sắp hết hạn</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <Button className="w-full mt-4" size="sm" style={{ backgroundColor: "var(--primary)", color: "white" }}>
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" style={{ color: "var(--primary)" }} />
              <CardTitle>Bảo mật</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Xác thực hai yếu tố</p>
              <p className="text-xs text-muted-foreground">Bật để tăng cường bảo mật tài khoản</p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Cấu hình 2FA
            </Button>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: "var(--primary)" }} />
              <CardTitle>Quyền hạn</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p>• Admin có quyền quản lý toàn bộ hệ thống</p>
              <p>• Landlord quản lý tài sản của mình</p>
              <p>• Tenant chỉ xem thông tin cá nhân</p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Xem chi tiết
            </Button>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" style={{ color: "var(--primary)" }} />
              <CardTitle>Sao lưu dữ liệu</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Sao lưu cuối cùng</p>
              <p className="text-xs text-muted-foreground">19 tháng 12, 2025 lúc 14:30</p>
            </div>
            <Button size="sm" className="w-full" style={{ backgroundColor: "var(--primary)", color: "white" }}>
              Sao lưu ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
