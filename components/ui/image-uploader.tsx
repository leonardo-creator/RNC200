"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileType, Camera, ImageIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface ImageUploaderProps {
  imageUrl: string | null
  onImageChange: (url: string | null) => void
  className?: string
  disabled?: boolean
}

export const ImageUploader = ({ imageUrl, onImageChange, className, disabled = false }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [fileType, setFileType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMobile()

  // Efeito para garantir que o input file seja configurado corretamente
  useEffect(() => {
    if (fileInputRef.current) {
      // Configuração padrão para aceitar todos os tipos de imagem
      fileInputRef.current.setAttribute("accept", "image/jpeg,image/png,image/gif,image/bmp,image/webp,image/svg+xml")
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    if (disabled) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      handleFile(file)
    }
  }

  const handleCameraCapture = (e: React.MouseEvent) => {
    e.stopPropagation() // Impede a propagação do evento para o container
    if (disabled || !fileInputRef.current) return

    // Configura o input para aceitar apenas câmera em dispositivos móveis
    fileInputRef.current.setAttribute("capture", "environment")
    fileInputRef.current.setAttribute("accept", "image/*")
    fileInputRef.current.click()

    // Restaura as configurações originais após o clique
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute("capture")
        fileInputRef.current.setAttribute("accept", "image/jpeg,image/png,image/gif,image/bmp,image/webp,image/svg+xml")
      }
    }, 1000)
  }

  const handleGallerySelect = (e: React.MouseEvent) => {
    e.stopPropagation() // Impede a propagação do evento para o container
    if (disabled || !fileInputRef.current) return

    // Configura o input para aceitar qualquer imagem da galeria
    fileInputRef.current.removeAttribute("capture")
    fileInputRef.current.setAttribute("accept", "image/jpeg,image/png,image/gif,image/bmp,image/webp,image/svg+xml")
    fileInputRef.current.click()
  }

  const handleContainerClick = () => {
    if (disabled || isMobile) return
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFile = (file: File) => {
    // Verifica se o arquivo é uma imagem
    if (!file.type.match(/^image\/(jpeg|png|gif|bmp|webp|svg\+xml)$/)) {
      alert("Por favor, selecione uma imagem válida (JPEG, PNG, GIF, BMP, WEBP ou SVG).")
      return
    }

    setIsLoading(true)
    setFileType(file.type)

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === "string") {
        onImageChange(e.target.result)
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      setIsLoading(false)
      alert("Erro ao processar a imagem. Por favor, tente novamente.")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onImageChange(null)
    setFileType(null)
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all",
        isDragging ? "border-[#3D00FF] bg-[#3D00FF]/5" : "border-gray-300",
        disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
        isLoading ? "animate-pulse" : "",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleContainerClick}
    >
      {imageUrl ? (
        <>
          <div className="absolute inset-0">
            <Image src={imageUrl || "/placeholder.svg"} alt="Imagem carregada" fill style={{ objectFit: "cover" }} />
          </div>
          {!disabled && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="destructive"
                size="icon"
                onClick={handleRemoveImage}
                className="h-8 w-8 rounded-full shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {fileType && (
            <div className="absolute bottom-2 left-2 z-10 bg-white/80 px-2 py-1 rounded text-xs flex items-center">
              <FileType className="h-3 w-3 mr-1" />
              {fileType.split("/")[1].toUpperCase()}
            </div>
          )}
        </>
      ) : (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-10 h-10 border-4 border-[#3D00FF]/30 border-t-[#3D00FF] rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-500">Processando imagem...</p>
            </div>
          ) : (
            <>
              <Upload className={cn("h-10 w-10 text-gray-400 mb-2", isMobile && "h-6 w-6 mb-1")} />
              <p className={cn("text-sm text-gray-500 mb-2 text-center px-2", isMobile && "text-xs mb-1")}>
                {disabled
                  ? "Visualização apenas"
                  : isMobile
                    ? "Selecione uma opção abaixo"
                    : "Arraste uma imagem ou clique para selecionar"}
              </p>
              <p className={cn("text-xs text-gray-400 mb-2 text-center", isMobile && "text-[10px] mb-1")}>
                Formatos: JPEG, PNG, GIF, BMP, WEBP, SVG
              </p>

              {!disabled && (
                <div className={cn("flex gap-2 mt-1", isMobile && "gap-1 mt-0.5")}>
                  {isMobile && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCameraCapture}
                        className="flex items-center gap-1 text-xs py-2 px-3 h-auto min-h-[36px]"
                      >
                        <Camera className={cn("h-3 w-3", isMobile && "h-3 w-3")} />
                        Câmera
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGallerySelect}
                        className="flex items-center gap-1 text-xs py-2 px-3 h-auto min-h-[36px]"
                      >
                        <ImageIcon className={cn("h-3 w-3", isMobile && "h-3 w-3")} />
                        Galeria
                      </Button>
                    </>
                  )}

                  {!isMobile && (
                    <Button variant="outline" size="sm" onClick={handleGallerySelect}>
                      Selecionar Imagem
                    </Button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/bmp,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
