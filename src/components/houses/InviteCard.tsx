"use client";

import { useState } from "react";
import { Check, Copy, Download, Link2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface InviteCardProps {
  houseId: string;
  houseName: string;
  inviteCode: string;
}

export function InviteCard({ houseId, houseName, inviteCode }: InviteCardProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const inviteUrl = typeof window === "undefined"
    ? `/join/${inviteCode}`
    : `${window.location.origin}/join/${inviteCode}`;

  async function copy(value: string, type: "code" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1600);
  }

  function downloadQr() {
    const svg = document.getElementById(`invite-qr-${houseId}`);
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${houseName}-邀请码.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">邀请码</CardTitle>
        <CardDescription>邀请码与二维码指向同一个加入页面。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-muted p-4">
          <code className="text-xl font-bold tracking-[0.18em]">{inviteCode}</code>
          <Button size="icon" variant="ghost" onClick={() => copy(inviteCode, "code")} aria-label="复制邀请码">
            {copied === "code" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => copy(inviteUrl, "link")}>
            {copied === "link" ? <Check className="h-4 w-4 mr-2 text-primary" /> : <Link2 className="h-4 w-4 mr-2" />}
            {copied === "link" ? "已复制" : "复制链接"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button><QrCode className="h-4 w-4 mr-2" />显示二维码</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>邀请加入「{houseName}」</DialogTitle>
                <DialogDescription>室友扫码后输入邀请码即可加入房屋。</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-2xl border bg-white p-4">
                  <QRCodeSVG
                    id={`invite-qr-${houseId}`}
                    value={inviteUrl}
                    size={220}
                    level="H"
                    marginSize={1}
                    fgColor="#111827"
                    bgColor="#ffffff"
                  />
                </div>
                <code className="text-lg font-bold tracking-[0.2em]">{inviteCode}</code>
                <Button variant="outline" onClick={downloadQr} className="w-full">
                  <Download className="h-4 w-4 mr-2" />下载二维码
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
