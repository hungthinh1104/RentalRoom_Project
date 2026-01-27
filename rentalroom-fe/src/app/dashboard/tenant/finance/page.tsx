import { auth } from "@/auth";
import api from "@/lib/api/client";
import FinanceView, { type Invoice } from "./finance-view";
import { redirect } from "next/navigation";

export default async function TenantFinancePage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/login");
    }

    // Fetch data in parallel on the server
    // We use try/catch to handle errors gracefully, although the nearest error.tsx would catch them
    let initialInvoices: { items: Invoice[] } = { items: [] };
    let initialStats = null;

    try {
        const [invoicesRes, statsRes] = await Promise.all([
            api.get<{ items: Invoice[] }>("/invoices/my-invoices"),
            api.get("/invoices/stats"),
        ]);
        initialInvoices = invoicesRes.data;
        initialStats = statsRes.data;
    } catch (error) {
        console.error("Failed to fetch finance data:", error);
    }

    return (
        <FinanceView
            user={{
                ...session.user,
                fullName: (session.user as { fullName?: string }).fullName || session.user?.name || "",
            }}
            initialInvoices={initialInvoices}
            initialStats={initialStats}
        />
    );
}
