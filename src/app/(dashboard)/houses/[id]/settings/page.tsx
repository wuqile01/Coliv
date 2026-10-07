import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HouseSettingsForm } from "@/components/houses/HouseSettingsForm";

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
      aria-label="返回"
    >
      <ArrowLeft className="h-5 w-5" />
    </Link>
  );
}

export default async function HouseSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BackLink href={`/houses/${house.id}`} />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">房屋设置</h2>
          <p className="text-sm text-muted-foreground mt-1">{house.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">基础设置</CardTitle>
              <CardDescription>用于账单生成、清洁排班与费用分摊的默认规则。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <HouseSettingsForm
            houseId={house.id}
            defaults={{
              name: house.name,
              address: house.address ?? "",
              roomCount: house.roomCount,
              billDay: house.billDay,
              cleaningCycle: house.cleaningCycle,
              defaultSplitMethod: house.defaultSplitMethod,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
