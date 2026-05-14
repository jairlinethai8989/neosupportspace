"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AgentAvatarUploaderProps {
  currentAvatarUrl?: string;
  agentName: string;
  onUploadSuccess?: (url: string) => void;
}

export function AgentAvatarUploader({
  currentAvatarUrl,
  agentName,
  onUploadSuccess,
}: AgentAvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    if (!name) return "AG";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Minimal validation (2MB limit as per migration 006)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      setIsUploading(true);
      // Construct a local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // We will prepare a FormData to send to our Next.js API Route handler
      const formData = new FormData();
      formData.append("avatar", file);

      // Call API Endpoint (We will create this API Route shortly)
      const response = await fetch("/api/agent/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Server responded with an error.");
      }

      const data = await response.json();
      toast.success("Profile picture updated successfully");
      
      if (onUploadSuccess && data.url) {
        onUploadSuccess(data.url);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image. Please try again.");
      setPreviewUrl(currentAvatarUrl || null); // Revert preview on error
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-medium tracking-tight">Profile Picture</CardTitle>
        <CardDescription className="text-muted-foreground">
          A picture helps customers recognize you across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border border-border">
            <AvatarImage src={previewUrl || ""} alt={agentName} className="object-cover" />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-medium">
              {getInitials(agentName)}
            </AvatarFallback>
          </Avatar>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="w-fit border-border hover:bg-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="mr-2 h-4 w-4" />
            Change Picture
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. Max size of 2MB.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
