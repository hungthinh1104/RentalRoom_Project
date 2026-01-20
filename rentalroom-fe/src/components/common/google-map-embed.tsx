import { cn } from "@/lib/utils";

interface GoogleMapEmbedProps {
    address: string;
    className?: string;
    title?: string;
}

export function GoogleMapEmbed({ address, className, title = "Bản đồ vị trí" }: GoogleMapEmbedProps) {
    // Encode the address for the URL
    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d0!2d0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2z${encodedAddress}!5e0!3m2!1sen!2s!4v1639392047634!5m2!1sen!2s`;

    // Alternative simple search embed format if the above CID/coordinates approach is too specific/empty
    // q=address format is safer for general addresses
    const simpleEmbedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

    return (
        <div className={cn("relative w-full h-[400px] bg-muted rounded-xl overflow-hidden border border-border shadow-sm", className)}>
            <iframe
                title={title}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={simpleEmbedUrl}
                className="absolute inset-0 grayscale-[20%] hover:grayscale-0 transition-all duration-500"
            />
        </div>
    );
}
