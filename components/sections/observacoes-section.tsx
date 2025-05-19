"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ImageUploader } from "../ui/image-uploader"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ObservacoesSectionProps {
  updateFormData?: (field: string, value: any) => void
  formData?: any
  readOnly?: boolean
}

export const ObservacoesSection = ({ updateFormData, formData, readOnly = false }: ObservacoesSectionProps) => {
  const [problema, setProblema] = useState(formData?.problema || "")
  const [figura1Desc, setFigura1Desc] = useState(formData?.figura1Desc || "")
  const [figura2Desc, setFigura2Desc] = useState(formData?.figura2Desc || "")
  const [imagem1, setImagem1] = useState<string | null>(formData?.imagem1 || null)
  const [imagem2, setImagem2] = useState<string | null>(formData?.imagem2 || null)
  const isMobile = useMobile()

  // Modificar os handlers para atualizar diretamente:
  const handleProblemaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setProblema(value)
    if (updateFormData) updateFormData("problema", value)
  }

  const handleFigura1DescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFigura1Desc(value)
    if (updateFormData) updateFormData("figura1Desc", value)
  }

  const handleFigura2DescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFigura2Desc(value)
    if (updateFormData) updateFormData("figura2Desc", value)
  }

  const handleImagem1Change = (url: string | null) => {
    setImagem1(url)
    if (updateFormData) updateFormData("imagem1", url)
  }

  const handleImagem2Change = (url: string | null) => {
    setImagem2(url)
    if (updateFormData) updateFormData("imagem2", url)
  }

  return (
    <Card className="border-2 border-brk-blue">
      <CardContent className={cn("p-4 space-y-4", isMobile && "p-2 space-y-2")}>
        {/* Título da seção em dispositivos móveis */}
        {isMobile && (
          <div className="bg-brk-blue text-white font-bold p-1 text-center rounded-sm mb-2 text-xs">
            OBSERVAÇÕES/IMAGENS
          </div>
        )}

        <div className={cn("text-brk-blue font-bold", isMobile && "text-xs")}>PROBLEMA IDENTIFICADO</div>

        <Textarea
          id="problema"
          value={problema}
          onChange={readOnly ? undefined : handleProblemaChange}
          placeholder="Descreva o problema identificado"
          className={cn("min-h-[100px] text-base", isMobile && "min-h-[70px] text-xs")}
          readOnly={readOnly}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="text-xs text-brk-blue font-semibold mb-1">Figura 1:</div>
            <ImageUploader
              imageUrl={imagem1}
              onImageChange={readOnly ? () => {} : handleImagem1Change}
              className={cn("h-48 w-full", isMobile && "h-32")}
              disabled={readOnly}
            />
            <div className="flex items-center space-x-1 mt-1">
              <Label
                htmlFor="figura1"
                className={cn("text-brk-blue font-bold whitespace-nowrap", isMobile && "text-xs")}
              >
                Descrição:
              </Label>
              <Input
                id="figura1"
                value={figura1Desc}
                onChange={readOnly ? undefined : handleFigura1DescChange}
                placeholder="Descrição da figura 1"
                readOnly={readOnly}
                className={isMobile ? "text-xs h-7" : ""}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-brk-blue font-semibold mb-1">Figura 2:</div>
            <ImageUploader
              imageUrl={imagem2}
              onImageChange={readOnly ? () => {} : handleImagem2Change}
              className={cn("h-48 w-full", isMobile && "h-32")}
              disabled={readOnly}
            />
            <div className="flex items-center space-x-1 mt-1">
              <Label
                htmlFor="figura2"
                className={cn("text-brk-blue font-bold whitespace-nowrap", isMobile && "text-xs")}
              >
                Descrição:
              </Label>
              <Input
                id="figura2"
                value={figura2Desc}
                onChange={readOnly ? undefined : handleFigura2DescChange}
                placeholder="Descrição da figura 2"
                readOnly={readOnly}
                className={isMobile ? "text-xs h-7" : ""}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
