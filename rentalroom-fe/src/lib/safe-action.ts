import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/auth";

// Base safe action client
const baseClient = createSafeActionClient();

// Action client with authentication middleware
export const action = baseClient.use(async ({ next }) => {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return next({
        ctx: {
            userId: session.user.id,
            userRole: session.user.role,
        },
    });
});

// Admin-only action client
export const adminAction = baseClient.use(async ({ next }) => {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Forbidden: Admins Only");
    }

    return next({
        ctx: {
            userId: session.user.id,
            role: session.user.role,
        },
    });
});
