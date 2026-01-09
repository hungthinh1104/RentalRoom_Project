'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Lock, Bell, Save, Mail, Shield, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import { PaymentConfigForm } from '@/features/payments/components/PaymentConfigForm';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function LandlordSettingsPage() {
    const { data: session } = useSession();
    const { toast } = useToast();

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notificationPrefs, setNotificationPrefs] = useState({
        emailContracts: true,
        emailPayments: true,
        emailMaintenance: true,
        emailIncome: true,
    });

    const [twoFactorState, setTwoFactorState] = useState({
        isEnabled: false,
        verificationCode: '',
        isEnabling: false,
    });

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Lỗi',
                description: 'Mật khẩu mới không khớp',
                variant: 'destructive',
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast({
                title: 'Lỗi',
                description: 'Mật khẩu phải có ít nhất 6 ký tự',
                variant: 'destructive',
            });
            return;
        }

        try {
            await api.patch('/users/me/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            
            toast({
                title: 'Thành công',
                description: 'Đã thay đổi mật khẩu',
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Không thể thay đổi mật khẩu';
            toast({
                title: 'Lỗi',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    };

    const handleSaveNotifications = async () => {
        try {
            // Note: Backend API for user preferences not implemented yet
            // For now, just save to localStorage
            localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
            toast({
                title: 'Thành công',
                description: 'Đã lưu cài đặt thông báo',
            });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu cài đặt',
                variant: 'destructive',
            });
        }
    };

    const handleResendVerification = async () => {
        try {
            await api.post('/auth/resend-verification', { email: session?.user?.email });
            toast({
                title: 'Đã gửi',
                description: 'Vui lòng kiểm tra email để xác thực tài khoản',
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Không thể gửi email xác thực';
            toast({
                title: 'Lỗi',
                description: message,
                variant: 'destructive',
            });
        }
    };

    const handleEnable2FA = async () => {
        setTwoFactorState({ ...twoFactorState, isEnabling: true });
        try {
            // TODO: Backend API for 2FA not implemented yet
            // Would need: POST /users/me/2fa/enable
            toast({
                title: 'Chưa hỗ trợ',
                description: 'Tính năng 2FA đang được phát triển',
                variant: 'destructive',
            });
            setTwoFactorState({ ...twoFactorState, isEnabling: false });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể gửi mã xác thực',
                variant: 'destructive',
            });
            setTwoFactorState({ ...twoFactorState, isEnabling: false });
        }
    };

    const handleConfirm2FA = async () => {
        if (twoFactorState.verificationCode.length !== 6) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng nhập mã 6 số',
                variant: 'destructive',
            });
            return;
        }

        try {
            // TODO: Backend API: POST /users/me/2fa/verify { code }
            toast({
                title: 'Chưa hỗ trợ',
                description: 'Tính năng 2FA đang được phát triển',
                variant: 'destructive',
            });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Mã xác thực không đúng',
                variant: 'destructive',
            });
        }
    };

    const handleDisable2FA = async () => {
        try {
            // TODO: Backend API: POST /users/me/2fa/disable
            toast({
                title: 'Chưa hỗ trợ',
                description: 'Tính năng 2FA đang được phát triển',
                variant: 'destructive',
            });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể tắt 2FA',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Cài Đặt</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Quản lý cài đặt tài khoản và tùy chọn cá nhân
                </p>
            </div>

            <Tabs defaultValue="password" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-card border-2 border-border p-1 h-auto gap-1">
                    <TabsTrigger value="password" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                        <Lock className="h-4 w-4" />
                        <span className="hidden sm:inline">Mật khẩu</span>
                        <span className="sm:hidden">MK</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Bảo mật</span>
                        <span className="sm:hidden">BM</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Thông báo</span>
                        <span className="sm:hidden">TB</span>
                    </TabsTrigger>
                    <TabsTrigger value="verification" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Xác thực</span>
                        <span className="sm:hidden">XT</span>
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Thanh toán</span>
                        <span className="sm:hidden">TT</span>
                    </TabsTrigger>
                </TabsList>

                {/* Password Tab */}
                <TabsContent value="password" className="space-y-6">
                    <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 lg:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Thay Đổi Mật Khẩu</h2>
                        <div className="space-y-5 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="current-password" className="text-sm font-semibold">
                                    Mật khẩu hiện tại
                                </Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                    }
                                    className="bg-background border-2 h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-sm font-semibold">
                                    Mật khẩu mới
                                </Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    className="bg-background border-2 h-11"
                                />
                                <p className="text-xs font-medium text-muted-foreground">Tối thiểu 6 ký tự</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-sm font-semibold">
                                    Xác nhận mật khẩu mới
                                </Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    className="bg-background border-2 h-11"
                                />
                            </div>

                            <Button onClick={handlePasswordChange} className="gap-2 h-11 font-semibold mt-2">
                                <Lock className="h-4 w-4" />
                                Cập nhật mật khẩu
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 lg:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Xác Thực Hai Yếu Tố (2FA)</h2>

                        {!twoFactorState.isEnabled && !twoFactorState.isEnabling && (
                            <div className="space-y-5">
                                <div className="flex items-start gap-4 p-5 bg-primary/5 border-2 border-primary/20 rounded-xl">
                                    <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-2 text-lg">
                                            Tăng cường bảo mật tài khoản
                                        </h3>
                                        <p className="text-sm text-foreground/80 leading-relaxed">
                                            Khi bật 2FA, bạn sẽ nhận mã xác thực 6 số qua email mỗi khi đăng nhập.
                                        </p>
                                    </div>
                                </div>

                                <Button onClick={handleEnable2FA} className="gap-2 h-11 font-semibold">
                                    <Shield className="h-4 w-4" />
                                    Bật xác thực hai yếu tố
                                </Button>
                            </div>
                        )}

                        {!twoFactorState.isEnabled && twoFactorState.isEnabling && (
                            <div className="space-y-5 max-w-md">
                                <div className="flex items-start gap-4 p-5 bg-warning/10 border-2 border-warning/30 rounded-xl">
                                    <Mail className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-2 text-lg">Mã đã được gửi</h3>
                                        <p className="text-sm text-foreground/80">
                                            Kiểm tra email <span className="font-semibold text-foreground">{session?.user?.email}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="2fa-code" className="text-sm font-semibold">
                                        Mã xác thực (6 số)
                                    </Label>
                                    <Input
                                        id="2fa-code"
                                        type="text"
                                        maxLength={6}
                                        value={twoFactorState.verificationCode}
                                        onChange={(e) =>
                                            setTwoFactorState({ ...twoFactorState, verificationCode: e.target.value.replace(/\D/g, '') })
                                        }
                                        placeholder="123456"
                                        className="bg-background border-2 font-mono text-2xl tracking-widest text-center h-14"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={handleConfirm2FA} className="gap-2 flex-1 h-11 font-semibold">
                                        <Shield className="h-4 w-4" />
                                        Xác nhận
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setTwoFactorState({ ...twoFactorState, isEnabling: false, verificationCode: '' })}
                                        className="h-11 font-semibold border-2"
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </div>
                        )}

                        {twoFactorState.isEnabled && (
                            <div className="space-y-5">
                                <div className="flex items-start gap-4 p-5 bg-success/10 border-2 border-success/30 rounded-xl">
                                    <Shield className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-2 text-lg">
                                            2FA đã được kích hoạt
                                        </h3>
                                        <p className="text-sm text-foreground/80">
                                            Tài khoản được bảo vệ bởi xác thực hai yếu tố
                                        </p>
                                    </div>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="gap-2 h-11 font-semibold">
                                            <AlertTriangle className="h-4 w-4" />
                                            Tắt 2FA
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-xl">Tắt xác thực hai yếu tố?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-base">
                                                Tài khoản sẽ kém an toàn hơn nếu tắt 2FA. Bạn có chắc chắn?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="h-11">Hủy</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDisable2FA} className="bg-destructive hover:bg-destructive/90 h-11">
                                                Tắt 2FA
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 lg:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Thông Báo Email</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between py-3">
                                <div className="flex-1">
                                    <Label htmlFor="email-contracts" className="text-base font-semibold cursor-pointer">
                                        Hợp đồng mới và cập nhật
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Nhận thông báo khi có hợp đồng mới
                                    </p>
                                </div>
                                <Switch
                                    id="email-contracts"
                                    checked={notificationPrefs.emailContracts}
                                    onCheckedChange={(checked) =>
                                        setNotificationPrefs({ ...notificationPrefs, emailContracts: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between border-t-2 border-border pt-6 pb-3">
                                <div className="flex-1">
                                    <Label htmlFor="email-payments" className="text-base font-semibold cursor-pointer">
                                        Thanh toán và hóa đơn
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Thông báo khi có thanh toán mới
                                    </p>
                                </div>
                                <Switch
                                    id="email-payments"
                                    checked={notificationPrefs.emailPayments}
                                    onCheckedChange={(checked) =>
                                        setNotificationPrefs({ ...notificationPrefs, emailPayments: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between border-t-2 border-border pt-6 pb-3">
                                <div className="flex-1">
                                    <Label htmlFor="email-maintenance" className="text-base font-semibold cursor-pointer">
                                        Yêu cầu bảo trì
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Thông báo bảo trì mới
                                    </p>
                                </div>
                                <Switch
                                    id="email-maintenance"
                                    checked={notificationPrefs.emailMaintenance}
                                    onCheckedChange={(checked) =>
                                        setNotificationPrefs({ ...notificationPrefs, emailMaintenance: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between border-t-2 border-border pt-6 pb-3">
                                <div className="flex-1">
                                    <Label htmlFor="email-income" className="text-base font-semibold cursor-pointer">
                                        Thu nhập và thuế
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Cảnh báo ngưỡng thuế
                                    </p>
                                </div>
                                <Switch
                                    id="email-income"
                                    checked={notificationPrefs.emailIncome}
                                    onCheckedChange={(checked) =>
                                        setNotificationPrefs({ ...notificationPrefs, emailIncome: checked })
                                    }
                                />
                            </div>

                            <Button onClick={handleSaveNotifications} className="gap-2 h-11 font-semibold mt-4">
                                <Save className="h-4 w-4" />
                                Lưu cài đặt
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Verification Tab */}
                <TabsContent value="verification" className="space-y-6">
                    <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 lg:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Xác Thực Tài Khoản</h2>
                        <div className="space-y-5">
                            {session?.user?.isVerified ? (
                                <div className="flex items-start gap-4 p-5 bg-success/10 border-2 border-success/30 rounded-xl">
                                    <div className="w-3 h-3 rounded-full bg-success flex-shrink-0 mt-2"></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-2 text-lg">
                                            Tài khoản đã được xác thực
                                        </h3>
                                        <p className="text-sm text-foreground/80">
                                            Email <span className="font-semibold">{session.user.email}</span> đã xác nhận
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex items-start gap-4 p-5 bg-warning/10 border-2 border-warning/30 rounded-xl">
                                        <div className="w-3 h-3 rounded-full bg-warning flex-shrink-0 mt-2"></div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-foreground mb-2 text-lg">
                                                Tài khoản chưa xác thực
                                            </h3>
                                            <p className="text-sm text-foreground/80">
                                                Vui lòng kiểm tra email
                                            </p>
                                        </div>
                                    </div>

                                    <Button onClick={handleResendVerification} variant="outline" className="gap-2 h-11 font-semibold border-2">
                                        <Mail className="h-4 w-4" />
                                        Gửi lại email xác thực
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Payment Config Tab */}
                <TabsContent value="payment" className="space-y-6">
                    <div className="bg-card border-2 border-border rounded-xl p-4 sm:p-6 lg:p-8">
                        <PaymentConfigForm />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
