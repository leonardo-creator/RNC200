"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SignaturePad } from "../ui/signature-pad"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface AssinaturasSectionProps {
  updateFormData?: (field: string, value: any) => void
  formData?: any
  readOnly?: boolean
}

export const AssinaturasSection = ({ updateFormData, formData, readOnly = false }: AssinaturasSectionProps) => {
  const [dataAbertura, setDataAbertura] = useState(formData?.dataAbertura || "")
  const [dataFechamento, setDataFechamento] = useState(formData?.dataFechamento || "")
  const [assinaturas, setAssinaturas] = useState({
    contratanteAbertura: "",
    contratadaAbertura: "",
    contratanteFechamento: "",
    contratadaFechamento: "",
  })
  const isMobile = useMobile()

  // Modificar os handlers para atualizar diretamente:
  const handleDataAberturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDataAbertura(value)
    if (updateFormData) updateFormData("dataAbertura", value)
  }

  const handleDataFechamentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDataFechamento(value)
    if (updateFormData) updateFormData("dataFechamento", value)
  }

  const handleAssinaturaChange = (tipo: keyof typeof assinaturas, valor: string) => {
    if (readOnly) return
    setAssinaturas((prev) => ({ ...prev, [tipo]: valor }))
    if (updateFormData) updateFormData(`assinatura_${tipo}`, valor)
  }

  return (
    <Card className="border-2 border-brk-blue">
      <CardContent className={cn("p-4", isMobile && "p-2")}>
        {/* Título da seção em dispositivos móveis */}
        {isMobile && (
          <div className="bg-brk-blue text-white font-bold p-1 text-center rounded-sm mb-2 text-sm">ASSINATURAS</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coluna de Abertura */}
          <div className={cn("border border-gray-300 p-4 space-y-4", isMobile && "p-2 space-y-2")}>
            <div className="flex items-center space-x-2">
              <Label htmlFor="dataAbertura" className="text-brk-blue font-bold whitespace-nowrap">
                DATA DE ABERTURA:
              </Label>
              <Input
                id="dataAbertura"
                type="date"
                value={dataAbertura}
                onChange={readOnly ? undefined : handleDataAberturaChange}
                className="flex-1"
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Coluna de Fechamento */}
          <div className={cn("border border-gray-300 p-4 space-y-4", isMobile && "p-2 space-y-2")}>
            <div className="flex items-center space-x-2">
              <Label htmlFor="dataFechamento" className="text-brk-blue font-bold whitespace-nowrap">
                DATA DE FECHAMENTO:
              </Label>
              <Input
                id="dataFechamento"
                type="date"
                value={dataFechamento}
                onChange={readOnly ? undefined : handleDataFechamentoChange}
                className="flex-1"
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
