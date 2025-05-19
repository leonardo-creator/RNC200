"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface AcoesSectionProps {
  updateFormData?: (field: string, value: any) => void
  formData?: any
  readOnly?: boolean
}

export const AcoesSection = ({ updateFormData, formData, readOnly = false }: AcoesSectionProps) => {
  const [acaoCorretiva, setAcaoCorretiva] = useState<string | undefined>(formData?.acaoCorretiva)
  const [acoes, setAcoes] = useState(
    formData?.acoes || [
      { acao: "", responsavel: "", prazo: "" },
      { acao: "", responsavel: "", prazo: "" },
      { acao: "", responsavel: "", prazo: "" },
    ],
  )
  const isMobile = useMobile()

  const handleAcaoCorretivaChange = (value: string) => {
    setAcaoCorretiva(value)
    if (updateFormData) updateFormData("acaoCorretiva", value)
  }

  const handleAcaoChange = (index: number, field: keyof (typeof acoes)[0], value: string) => {
    if (readOnly) return
    const newAcoes = [...acoes]
    newAcoes[index][field] = value
    setAcoes(newAcoes)
    if (updateFormData) updateFormData("acoes", newAcoes)
  }

  return (
    <Card className="border-2 border-brk-blue">
      <CardContent className={cn("p-3 space-y-3", isMobile && "p-2 space-y-2")}>
        {/* Título da seção em dispositivos móveis */}
        {isMobile && (
          <div className="bg-brk-blue text-white font-bold p-1 text-center rounded-sm mb-2 text-sm">AÇÕES</div>
        )}

        <div className="text-brk-blue font-bold">DISPOSIÇÕES GERAIS</div>

        <RadioGroup
          value={acaoCorretiva}
          onValueChange={readOnly ? undefined : handleAcaoCorretivaChange}
          className={cn("flex flex-wrap gap-4", isMobile && "gap-2")}
          disabled={readOnly}
        >
          <div className="flex items-center space-x-2 touch-feedback">
            <RadioGroupItem value="corrigir" id="corrigir" />
            <Label htmlFor="corrigir" className={isMobile ? "text-base" : ""}>
              CORRIGIR
            </Label>
          </div>
          <div className="flex items-center space-x-2 touch-feedback">
            <RadioGroupItem value="reprovarSuspender" id="reprovarSuspender" />
            <Label htmlFor="reprovarSuspender" className={isMobile ? "text-base" : ""}>
              REPROVAR/SUSPENDER
            </Label>
          </div>
          <div className="flex items-center space-x-2 touch-feedback">
            <RadioGroupItem value="autorizarConcessao" id="autorizarConcessao" />
            <Label htmlFor="autorizarConcessao" className={isMobile ? "text-base" : ""}>
              AUTORIZAR SOB CONCESSÃO
            </Label>
          </div>
          <div className="flex items-center space-x-2 touch-feedback">
            <RadioGroupItem value="informar" id="informar" />
            <Label htmlFor="informar" className={isMobile ? "text-base" : ""}>
              INFORMAR
            </Label>
          </div>
        </RadioGroup>

        <div className={cn("overflow-x-auto", isMobile && "-mx-2 px-2")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cn("w-[60%] text-brk-blue font-bold", isMobile && "text-xs")}>
                  AÇÕES A EXECUTAR/CONCESSÕES OBTIDAS
                </TableHead>
                <TableHead className={cn("w-[20%] text-brk-blue font-bold", isMobile && "text-xs")}>
                  Responsável
                </TableHead>
                <TableHead className={cn("w-[20%] text-brk-blue font-bold", isMobile && "text-xs")}>Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acoes.map((acao, index) => (
                <TableRow key={index}>
                  <TableCell className={cn("p-2", isMobile && "p-1")}>
                    <Input
                      value={acao.acao}
                      onChange={readOnly ? undefined : (e) => handleAcaoChange(index, "acao", e.target.value)}
                      readOnly={readOnly}
                      className={isMobile ? "text-sm" : ""}
                    />
                  </TableCell>
                  <TableCell className={cn("p-2", isMobile && "p-1")}>
                    <Input
                      value={acao.responsavel}
                      onChange={readOnly ? undefined : (e) => handleAcaoChange(index, "responsavel", e.target.value)}
                      readOnly={readOnly}
                      className={isMobile ? "text-sm" : ""}
                    />
                  </TableCell>
                  <TableCell className={cn("p-2", isMobile && "p-1")}>
                    <Input
                      type="date"
                      value={acao.prazo}
                      onChange={readOnly ? undefined : (e) => handleAcaoChange(index, "prazo", e.target.value)}
                      readOnly={readOnly}
                      className={isMobile ? "text-sm" : ""}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
