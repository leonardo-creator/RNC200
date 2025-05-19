"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export const CabecalhoSection = () => {
  const isMobile = useMobile()

  return (
    <Card className="border-2 border-blue-900">
      <CardContent className={cn("p-4 flex flex-col md:flex-row justify-between items-center", isMobile && "p-1.5")}>
        <div>
          <p className={cn("text-blue-900 text-xl md:text-2xl font-bold", isMobile && "text-sm text-center")}>
            REGISTRO DE NÃO CONFORMIDADE | RNC
          </p>
          <p className={cn("text-blue-600 text-lg font-bold", isMobile && "text-xs text-center")}>
            N°: {new Date().toLocaleDateString("pt-BR")} | A+
            {Math.floor(Math.random() * 10000)
              .toString()
              .padStart(4, "0")}
          </p>
        </div>
        <div className={cn("mt-4 md:mt-0", isMobile && "mt-1")}>
          <Image
            src="/brk-logo.png"
            alt="Logo BRK"
            width={isMobile ? 60 : 150}
            height={isMobile ? 40 : 100}
            className={cn("h-auto w-32 md:w-40", isMobile && "w-16")}
          />
        </div>
      </CardContent>
    </Card>
  )
}
