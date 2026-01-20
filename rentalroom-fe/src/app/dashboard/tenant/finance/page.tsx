
import { auth } from "@/auth";
import api from "@/lib/api/client";
import FinanceView from "./finance-view";
import { redirect } from "next/navigation";

export default async function TenantFinancePage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/login");
    }

    // Fetch data in parallel on the server
    // We use try/catch to handle errors gracefully, although the nearest error.tsx would catch them
    let initialInvoices = { items: [] };
    let initialStats = null;

    try {
        const [invoicesRes, statsRes] = await Promise.all([
            api.get("/invoices/my-invoices"),
            api.get("/invoices/stats"),
        ]);
        initialInvoices = invoicesRes.data as any;
        initialStats = statsRes.data;
    } catch (error) {
        console.error("Failed to fetch finance data:", error);
        // You could redirect to error page or let it render with empty data
    }

    return (
        <FinanceView
            user={session.user}
            initialInvoices={initialInvoices}
            initialStats={initialStats}
        />
    );
}
