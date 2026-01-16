"use client";

import { Contract } from "@/types";
import {
    Home,
    MapPin,
    Maximize,
    User,
    Users,
    AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ContractStatus } from "@/types/enums";

interface ContractInfoProps {
    contract: Contract;
}

export function ContractInfo({ contract }: ContractInfoProps) {
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">

                {/* Room Highlights */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="w-5 h-5 text-primary" />
                                Thông tin phòng
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                                    <div className="p-2 bg-primary/10 text-primary rounded-md">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Địa chỉ & Phòng</p>
                                        <p className="font-semibold text-base mt-0.5">{contract.room?.roomNumber}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                                            {contract.room?.property?.address || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                                    <div className="p-2 bg-accent text-accent-foreground rounded-md">
                                        <Maximize className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Diện tích & Loại</p>
                                        <p className="font-semibold text-base mt-0.5">{contract.room?.area || 0} m²</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Phòng tiêu chuẩn</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Residents Section */}
                {contract.residents && contract.residents.length > 0 && (
                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Danh sách cư dân ({contract.residents.length + 1} người)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Primary Tenant */}
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{contract.tenant?.user?.fullName}</p>
                                            <p className="text-xs text-muted-foreground">Người thuê chính</p>
                                        </div>
                                    </div>

                                    {/* Additional Residents */}
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {contract.residents.map((resident: any, index: number) => (
                                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                                            <div className="p-2 bg-muted rounded-full">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{resident.fullName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {resident.relationship === 'SPOUSE' && 'Vợ/chồng'}
                                                        {resident.relationship === 'CHILD' && 'Con'}
                                                        {resident.relationship === 'PARENT' && 'Cha/mẹ'}
                                                        {resident.relationship === 'FRIEND' && 'Bạn'}
                                                        {resident.relationship === 'OTHER' && 'Khác'}
                                                    </span>
                                                    {resident.citizenId && (
                                                        <>
                                                            <span className="text-xs text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground">CCCD: {resident.citizenId}</span>
                                                        </>
                                                    )}
                                                    {resident.phoneNumber && (
                                                        <>
                                                            <span className="text-xs text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground">{resident.phoneNumber}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {contract.maxOccupants && (
                                    <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                                        <p className="text-sm text-muted-foreground">
                                            Giới hạn cư dân: <span className="font-semibold text-foreground">{contract.residents.length + 1}/{contract.maxOccupants} người</span>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">

                {/* Status Alert if needed */}
                {contract.status === ContractStatus.EXPIRED && (
                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-sm text-destructive">Hợp đồng hết hạn</h4>
                                    <p className="text-xs text-destructive/80 mt-1">
                                        Đã kết thúc vào {format(new Date(contract.endDate), "dd/MM/yyyy")}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tenant Profile */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Người thuê (Bên B)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center text-center p-2">
                                <Avatar className="w-20 h-20 mb-3 border-2 border-muted">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${contract.tenant?.user?.fullName}&background=random`} />
                                    <AvatarFallback>{contract.tenant?.user?.fullName?.substring(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-bold text-lg">{contract.tenant?.user?.fullName || "Chưa cập nhật"}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{contract.tenant?.user?.email}</p>

                                <div className="w-full space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Điện thoại</span>
                                        <span className="font-medium">{contract.tenant?.user?.phoneNumber || "---"}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">CCCD/CMND</span>
                                        <span className="font-medium">{contract.tenant?.citizenId || "---"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Landlord Profile */}
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Chủ nhà (Bên A)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar className="w-12 h-12 border">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${contract.landlord?.user?.fullName}&background=0ea5e9&color=fff`} />
                                    <AvatarFallback>LA</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{contract.landlord?.user?.fullName || "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">Chủ sở hữu bất động sản</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="ml-auto font-medium truncate max-w-[120px]" title={contract.landlord?.user?.email}>
                                        {contract.landlord?.user?.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                    <span className="text-muted-foreground">SĐT:</span>
                                    <span className="ml-auto font-medium">{contract.landlord?.user?.phoneNumber || "---"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
        </div>
    );
}
