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

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
} as unknown as { publicKey: string; privateKey: string; urlEndpoint: string }) as unknown as ImageKitInstance;

export async function GET(req: NextRequest) {
    try {
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
