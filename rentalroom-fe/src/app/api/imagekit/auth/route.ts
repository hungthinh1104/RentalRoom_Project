import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import ImageKit from "imagekit-javascript";

interface ImageKitInstance {
    getAuthenticationParameters: () => {
        token: string;
        expire: number;
        signature: string;
    };
}

// Initialize ImageKit only if credentials are available
let imagekit: ImageKitInstance | null = null;

try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (publicKey && privateKey && urlEndpoint) {
        imagekit = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint,
        } as unknown as { publicKey: string; privateKey: string; urlEndpoint: string }) as unknown as ImageKitInstance;
    }
} catch (error) {
    console.warn("ImageKit initialization skipped:", error);
}

export async function GET(req: NextRequest) {
    try {
        if (!imagekit) {
            return NextResponse.json({ error: "ImageKit not configured" }, { status: 503 });
        }

        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const authenticationParameters = imagekit.getAuthenticationParameters();
        return NextResponse.json(authenticationParameters);
    } catch (error) {
        console.error("ImageKit Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
