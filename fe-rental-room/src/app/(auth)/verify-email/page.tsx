import React from 'react';

import { Suspense } from "react"
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form"

export default function VerifyEmailPage() {
	return (
		<div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
			<Suspense fallback={<div className="text-center">Đang tải...</div>}>
				<VerifyEmailForm />
			</Suspense>
		</div>
	);
}
