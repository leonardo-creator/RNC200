"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Pen, Trash2, Save, Undo, Redo, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface SignaturePadProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export const SignaturePad = ({ value, onChange, className, disabled = false }: SignaturePadProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const modalCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isLandscape, setIsLandscape] = useState(false)
  const isMobile = useMobile()

  // Detectar orientação do dispositivo
  useEffect(() => {
    if (!isMobile) return

    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    window.addEventListener("orientationchange", checkOrientation)

    return () => {
      window.removeEventListener("resize", checkOrientation)
      window.removeEventListener("orientationchange", checkOrientation)
    }
  }, [isMobile])

  // Inicializa o canvas quando o modal é aberto
  useEffect(() => {
    if (isOpen && modalCanvasRef.current) {
      const canvas = modalCanvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = "#000"

        // Se já existe uma assinatura, desenha ela no canvas
        if (value) {
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            // Adiciona ao histórico
            saveToHistory()
          }
          img.src = value
        } else {
          // Limpa o histórico
          setHistory([])
          setHistoryIndex(-1)
        }
      }
    }
  }, [isOpen, value, strokeWidth])

  // Atualiza o canvas principal quando o valor muda
  useEffect(() => {
    if (canvasRef.current && value) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = value
      }
    }
  }, [value])

  // Função para salvar o estado atual no histórico
  const saveToHistory = () => {
    if (!modalCanvasRef.current) return

    const canvas = modalCanvasRef.current
    const dataUrl = canvas.toDataURL("image/png")

    // Se estamos no meio do histórico, descarta os estados futuros
    if (historyIndex < history.length - 1) {
      setHistory((prev) => prev.slice(0, historyIndex + 1))
    }

    setHistory((prev) => [...prev, dataUrl])
    setHistoryIndex((prev) => prev + 1)
  }

  // Função para desfazer
  const undo = () => {
    if (historyIndex <= 0 || !modalCanvasRef.current) return

    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)

    const canvas = modalCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (ctx) {
      if (newIndex >= 0) {
        // Restaura o estado anterior
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
        }
        img.src = history[newIndex]
      } else {
        // Se não há estado anterior, limpa o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  // Função para refazer
  const redo = () => {
    if (historyIndex >= history.length - 1 || !modalCanvasRef.current) return

    const newIndex = historyIndex + 1
    setHistoryIndex(newIndex)

    const canvas = modalCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (ctx && newIndex < history.length) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[newIndex]
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!modalCanvasRef.current) return

    setIsDrawing(true)

    const canvas = modalCanvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX, clientY

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    setLastX(clientX - rect.left)
    setLastY(clientY - rect.top)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !modalCanvasRef.current) return

    e.preventDefault()

    const canvas = modalCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Atualiza a largura do traço
    ctx.lineWidth = strokeWidth

    const rect = canvas.getBoundingClientRect()

    let clientX, clientY

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastX(x)
    setLastY(y)
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      // Salva o estado atual no histórico
      saveToHistory()
    }
  }

  const clearSignature = () => {
    if (!modalCanvasRef.current) return

    const canvas = modalCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Adiciona o estado limpo ao histórico
      saveToHistory()
    }
  }

  const saveSignature = () => {
    if (!modalCanvasRef.current) return

    const canvas = modalCanvasRef.current
    const dataUrl = canvas.toDataURL("image/png")
    onChange(dataUrl)
    setIsOpen(false)
  }

  return (
    <>
      <div
        className={cn(
          "relative border rounded-lg flex items-center justify-center bg-gray-50 transition-all",
          disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-[#3D00FF]/50 hover:shadow-sm",
          className,
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {value ? (
          <canvas ref={canvasRef} width={300} height={150} className="w-full h-full cursor-pointer" />
        ) : (
          <div className="flex flex-col items-center justify-center cursor-pointer p-4">
            <Pen className={cn("h-6 w-6 text-gray-400 mb-2", isMobile && "h-4 w-4 mb-1")} />
            <p className={cn("text-sm text-gray-500 text-center", isMobile && "text-xs")}>
              {disabled ? "Visualização apenas" : isMobile ? "Toque para assinar" : "Clique para assinar"}
            </p>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn("sm:max-w-md", isMobile && "w-[calc(100%-32px)] p-3 max-w-full")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg", isMobile && "text-base")}>Assinatura</DialogTitle>
            <DialogDescription className={cn(isMobile && "text-xs")}>
              {isMobile && !isLandscape ? (
                <div className="flex items-center text-amber-600">
                  <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                  Gire o dispositivo para modo paisagem para ter mais espaço para assinar
                </div>
              ) : (
                "Desenhe sua assinatura no espaço abaixo."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-lg p-1 bg-white">
            <canvas
              ref={modalCanvasRef}
              width={isMobile ? (isLandscape ? 400 : 260) : 400}
              height={isMobile ? (isLandscape ? 160 : 140) : 200}
              className="w-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Controles de espessura do traço */}
          <div className="flex items-center justify-center space-x-4 mb-2">
            <span className={cn("text-sm text-gray-500", isMobile && "text-xs")}>Espessura:</span>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((width) => (
                <button
                  key={width}
                  className={cn(
                    "rounded-full flex items-center justify-center",
                    strokeWidth === width ? "bg-[#3D00FF] text-white" : "bg-gray-100",
                    isMobile ? "w-5 h-5" : "w-6 h-6",
                  )}
                  onClick={() => setStrokeWidth(width)}
                >
                  <div
                    className="bg-current rounded-full"
                    style={{
                      width: `${width * (isMobile ? 1.5 : 2)}px`,
                      height: `${width * (isMobile ? 1.5 : 2)}px`,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={cn("flex flex-wrap justify-between gap-2", isMobile && "gap-1")}>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={undo}
                disabled={historyIndex <= 0}
                className={cn("flex items-center", isMobile && "text-xs h-7 px-2")}
              >
                <Undo className={cn("h-4 w-4 mr-1", isMobile && "h-3 w-3")} />
                Desfazer
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={cn("flex items-center", isMobile && "text-xs h-7 px-2")}
              >
                <Redo className={cn("h-4 w-4 mr-1", isMobile && "h-3 w-3")} />
                Refazer
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={clearSignature}
                className={cn("flex items-center", isMobile && "text-xs h-7 px-2")}
              >
                <Trash2 className={cn("h-4 w-4 mr-1", isMobile && "h-3 w-3")} />
                Limpar
              </Button>
              <Button
                onClick={saveSignature}
                size={isMobile ? "sm" : "default"}
                className={cn("flex items-center bg-[#3D00FF] hover:bg-[#3D00FF]/90", isMobile && "text-xs h-7 px-2")}
              >
                <Save className={cn("h-4 w-4 mr-1", isMobile && "h-3 w-3")} />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
