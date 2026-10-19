"use client";
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
import { createShareUrl, type SharedBuild } from "@/lib/bmw/share";

export function ShareBuild({
  state,
  disabled,
}: {
  state: SharedBuild;
  disabled: boolean;
}) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [local, setLocal] = useState(false);
  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          setUrl(createShareUrl(window.location.href, state));
          setLocal(
            ["localhost", "127.0.0.1", "[::1]"].includes(
              window.location.hostname,
            ),
          );
          setStatus("");
        }
      }}
    >
      <PopoverTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        <Share2 /> Share
      </PopoverTrigger>
      <PopoverContent className="share-popover" align="end">
        <PopoverTitle>Share this view</PopoverTitle>
        <PopoverDescription>
          Opens this build, paint, camera and lighting.
        </PopoverDescription>
        <Input
          aria-label="Share link"
          value={url}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setStatus("Link copied");
            } catch {
              setStatus("Select and copy the link above.");
            }
          }}
        >
          {status === "Link copied" ? <Check /> : <Copy />}
          {status === "Link copied" ? "Copied" : "Copy link"}
        </Button>
        <p className="sr-only" role="status">
          {status}
        </p>
        {status && status !== "Link copied" && (
          <p className="share-note">{status}</p>
        )}
        {local && (
          <p className="share-note">
            This local preview link only works on this computer.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
