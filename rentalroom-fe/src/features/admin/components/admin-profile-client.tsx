"use client";

import { useState } from "react";
import { Shield, Users, Building2, FileText, Activity } from "lucide-react";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Session } from "next-auth";

interface AdminProfileClientProps {
  user: Session["user"];
}

export function AdminProfileClient({ user }: AdminProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: (user as { fullName?: string }).fullName || user?.name || "",
    email: user?.email || "",
    phoneNumber: "",
  });

  const stats = [
    {
      label: "Tổng người dùng",
      value: "0",
      icon: Users,
    },
    {
      label: "Tổng bất động sản",
      value: "0",
      icon: Building2,
    },
    {
      label: "Tổng hợp đồng",
      value: "0",
      icon: FileText,
    },
    {
      label: "Hoạt động",
      value: "0",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-3xl font-bold">Hồ Sơ Quản Trị Viên</h1>
        <p className="text-muted-foreground mt-1">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Cơ Bản</CardTitle>
              <CardDescription>Quản lý thông tin tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 pb-6 border-b border-border/30">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{formData.fullName || "Admin"}</p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Họ và Tên</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input
                      value={formData.email}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Số Điện Thoại</Label>
                  <Input
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      style={{ backgroundColor: "var(--primary)", color: "white" }}
                    >
                      Lưu Thay Đổi
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Chỉnh Sửa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bảo Mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Đổi Mật Khẩu</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Cập nhật mật khẩu tài khoản của bạn thường xuyên để bảo vệ tài khoản
                </p>
                <Button variant="outline" size="sm">
                  Đổi Mật Khẩu
                </Button>
              </div>
              <div className="pt-4 border-t border-border/30">
                <p className="text-sm font-medium mb-2">Xác Thực Hai Yếu Tố</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Bật xác thực hai yếu tố để bảo vệ tài khoản của bạn
                </p>
                <Button variant="outline" size="sm">
                  Cài Đặt 2FA
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống Kê Hệ Thống</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsGrid stats={stats} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quyền Hạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--success)" }}
                ></div>
                <span className="text-sm">Quản lý toàn bộ hệ thống</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--success)" }}
                ></div>
                <span className="text-sm">Quản lý người dùng</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--success)" }}
                ></div>
                <span className="text-sm">Quản lý bất động sản</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--success)" }}
                ></div>
                <span className="text-sm">Xem báo cáo tài chính</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
