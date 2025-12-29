"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface RoomGalleryProps {
  images: string[] | undefined;
  roomNumber: string;
}

export function RoomGallery({ images, roomNumber }: RoomGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <CardContent className="px-5 flex items-center justify-center w-full h-full">
          <p className="text-muted-foreground">No images available</p>
        </CardContent>
      </Card>
    );
  }

  const selectedImageUrl = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="w-full h-96 bg-muted rounded-lg overflow-hidden relative">
        <Image
          src={selectedImageUrl}
          alt={`Room ${roomNumber} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((imageUrl, index) => (
            <button
              key={imageUrl}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${index === selectedIndex ? "border-primary" : "border-border hover:border-primary/50"
                }`}
            >
              <Image src={imageUrl} alt={`Thumbnail ${index + 1}`} width={80} height={80} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="text-sm text-muted-foreground">
        Image {selectedIndex + 1} of {images.length}
      </div>
    </div>
  );
}
