"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LogOut, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLogout } from "../hooks/use-auth"
import { cn } from "@/lib/utils"

interface LogoutButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
	/**
	 * Callback after successful logout
	 */
	onLogoutSuccess?: () => void;
	/**
	 * Show icon
	 * @default true
	 */
	showIcon?: boolean;
	/**
	 * Button text
	 * @default "Đăng xuất"
	 */
	children?: React.ReactNode;
}

/**
 * Logout Button Component
 * Handles user logout with loading state
 * 
 * @example
 * // Default usage
 * <LogoutButton />
 * 
 * // Custom styling
 * <LogoutButton variant="ghost" size="sm">
 *   Sign Out
 * </LogoutButton>
 * 
 * // With callback
 * <LogoutButton onLogoutSuccess={() => toast.success("Đã đăng xuất")} />
 */
export function LogoutButton({ 
	onLogoutSuccess,
	showIcon = true,
	children = "Đăng xuất",
	className,
	disabled,
	...props 
}: LogoutButtonProps) {
	const router = useRouter()
	const { mutate: logout, isPending } = useLogout()

	const handleLogout = () => {
		logout(undefined, {
			onSuccess: () => {
				onLogoutSuccess?.()
				router.push('/login')
			},
		})
	}

	return (
		<motion.div whileTap={{ scale: isPending ? 1 : 0.95 }}>
			<Button
				onClick={handleLogout}
				disabled={isPending || disabled}
				className={cn("gap-2", className)}
				{...props}
			>
				{isPending ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						Đang đăng xuất...
					</>
				) : (
					<>
						{showIcon && <LogOut className="w-4 h-4" />}
						{children}
					</>
				)}
			</Button>
		</motion.div>
	)
}
