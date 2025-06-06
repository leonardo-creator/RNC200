"use client"

import { Label } from "@/components/ui/label"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IdentificacaoSection } from "./sections/identificacao-section"
import { ObservacoesSection } from "./sections/observacoes-section"
import { AcoesSection } from "./sections/acoes-section"
import { AssinaturasSection } from "./sections/assinaturas-section"
import { CabecalhoSection } from "./sections/cabecalho-section"
import { Eye, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMobile } from "@/hooks/use-mobile"

export const RncForm = () => {
  const { toast } = useToast()
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("portrait")
  const formRef = useRef<HTMLDivElement>(null)
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const isMobile = useMobile()

  // Estados para controlar as seções colapsáveis em dispositivos móveis
  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    observacoes: false,
    acoes: false,
    assinaturas: false,
  })

  // Função para alternar a expansão de uma seção
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Estados para armazenar os dados do formulário
  const [formData, setFormData] = useState({
    statusAtividade: "",
    empresa: "",
    contrato: "",
    escopo: "",
    localNc: "",
    respFrente: "",
    tipo: [] as string[],
    natureza: [] as string[],
    obra: [] as string[],
    grau: "",
    problema: "",
    figura1Desc: "",
    figura2Desc: "",
    imagem1: null as string | null,
    imagem2: null as string | null,
    acaoCorretiva: "",
    acoes: [
      { acao: "", responsavel: "", prazo: "" },
      { acao: "", responsavel: "", prazo: "" },
      { acao: "", responsavel: "", prazo: "" },
      { acao: "", responsavel: "", prazo: "" },
    ],
    dataAbertura: "",
    dataFechamento: "",
    assinatura_contratanteAbertura: "",
    assinatura_contratadaAbertura: "",
    assinatura_contratanteFechamento: "",
    assinatura_contratadaFechamento: "",
  })

  // Pré-carrega a imagem do logo com tratamento de erro melhorado
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Cria uma nova imagem
        const img = new Image()
        img.crossOrigin = "anonymous"

        // Configura os manipuladores de eventos
        img.onload = () => {
          console.log("Logo carregado com sucesso")
          setLogoImage(img)
          setLogoLoaded(true)
          setLogoError(false)
        }

        img.onerror = (e) => {
          console.warn("Erro ao carregar o logo:", e)
          setLogoImage(null)
          setLogoLoaded(false)
          setLogoError(true)
        }

        // Inicia o carregamento da imagem
        img.src = "/brk-logo.png"
      } catch (error) {
        console.error("Erro ao inicializar o carregamento do logo:", error)
        setLogoImage(null)
        setLogoLoaded(false)
        setLogoError(true)
      }
    }

    loadLogo()
  }, [])

  // Função para atualizar os dados do formulário
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Função para converter uma imagem base64 para um objeto Image
  const loadImageFromBase64 = (base64: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
        img.src = base64
      } catch (error) {
        reject(error)
      }
    })
  }

  // Função para formatar a data atual no formato brasileiro
  const formatarDataBR = () => {
    const data = new Date()
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Função para gerar um ID de documento
  const gerarIdDocumento = (): string => {
    const dataHoje = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const idAleatorio = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `RNC-${dataHoje}-${idAleatorio}`
  }

  // Função para gerar o PDF com design corporativo
  const gerarPDF = async () => {
    setIsGeneratingPdf(true)
    toast({
      title: "Gerando PDF",
      description: "Aguarde enquanto o PDF está sendo gerado...",
    })

    try {
      // Configuração do PDF para A4 com a orientação selecionada
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: "mm",
        format: "a4",
        compress: true,
        precision: 16,
        putOnlyUsedFonts: true,
      })

      // ID do documento para referência
      const documentId = gerarIdDocumento()      // Esquema de cores corporativo baseado no novo logo BRK
      const corPrimaria = [61, 0, 255] as const // #3D00FF - Azul/roxo do logo BRK
      const corSecundaria = [100, 116, 139] as const // #64748B - Cinza azulado para detalhes
      const corTerciaria = [241, 245, 249] as const // #F1F5F9 - Cinza claro para fundos
      const corTexto = [15, 23, 42] as const // #0F172A - Quase preto para texto principal
      const corTextoSecundario = [71, 85, 105] as const // #475569 - Cinza para texto secundário
      const corDestaque = [61, 0, 255] as const // #3D00FF - Mesma cor do logo para destaques
      const corBranco = [255, 255, 255] as const // #FFFFFF - Branco

      // Definição de margens
      const margemEsquerda = 20
      const margemDireita = 20
      const margemSuperior = 20
      const margemInferior = 20
      const larguraUtil = pdf.internal.pageSize.getWidth() - margemEsquerda - margemDireita

      // Função para verificar espaço e adicionar nova página
      const adicionarNovaPaginaSeNecessario = (alturaRequerida: number, posicaoAtual: number): number => {
        if (posicaoAtual + alturaRequerida > pdf.internal.pageSize.getHeight() - margemInferior - 10) {
          pdf.addPage()
          addHeader(pdf.getNumberOfPages())
          return margemSuperior + 30 // Posição Y após o cabeçalho na nova página
        }
        return posicaoAtual
      }

      // Função para quebrar texto em múltiplas linhas
      const quebrarTexto = (texto: string, larguraMaxima: number, tamanhoFonte: number): string[] => {
        pdf.setFontSize(tamanhoFonte)
        return pdf.splitTextToSize(texto || "", larguraMaxima)
      }

      // Função para calcular altura de texto multi-linha
      const calcularAlturaTexto = (linhas: string[], alturaLinha: number): number => {
        return linhas.length * alturaLinha
      }
      
      // Flag para indicar se estamos no modo de cálculo do total de páginas
      let isCalculatingMode = false;
        // Função para adicionar cabeçalho corporativo em cada página
      const addHeader = (pageNumber: number, totalPages: number = 0) => {        // Fundo do cabeçalho
        pdf.setFillColor(...corTerciaria)
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 40, "F")
        
        // Se estivermos no modo de cálculo, mostrar apenas o essencial no cabeçalho
        if (isCalculatingMode) {
          // Somente adicionar linhas e espaços para o layout básico no modo de cálculo
          pdf.setDrawColor(...corPrimaria)
          pdf.setFillColor(...corPrimaria)
          pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 5, "F")
          return;
        }

        // Linha decorativa superior
        pdf.setDrawColor(...corPrimaria)
        pdf.setFillColor(...corPrimaria)
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 5, "F")

        // Logo à esquerda - com tratamento de erro melhorado
        if (logoImage && logoLoaded) {
          try {
            pdf.addImage(logoImage, "PNG", margemEsquerda, 10, 40, 20)
          } catch (error) {
            console.warn("Não foi possível adicionar o logo ao PDF:", error)
            // Adiciona texto alternativo se a imagem falhar
            pdf.setFont("helvetica", "bold")
            pdf.setFontSize(14)
            pdf.setTextColor(...corPrimaria)
            pdf.text("BRK", margemEsquerda, 20)
          }
        } else {
          // Fallback se a imagem não estiver disponível
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(14)
          pdf.setTextColor(...corPrimaria)
          pdf.text("BRK", margemEsquerda, 20)
        }

        // Título do documento - centralizado e sem sobreposição
        const titulo = "          REGISTRO DE NÃO CONFORMIDADE"
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(16)
        pdf.setTextColor(...corPrimaria)

        // Calcula a largura do título para centralizá-lo
        const tituloWidth = (pdf.getStringUnitWidth(titulo) * 16) / pdf.internal.scaleFactor
        const centroX = pdf.internal.pageSize.getWidth() / 2 - tituloWidth / 2

        // Posiciona o título centralizado
        pdf.text(titulo, centroX, 18)        // Data posicionada abaixo do título e logo, para evitar conflito visual
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(10)
        pdf.setTextColor(...corTextoSecundario)
        const dataFormatada = new Date().toLocaleDateString("pt-BR")
        // Movida para baixo para dar mais espaçamento
        pdf.text(`Data: ${dataFormatada}`, margemEsquerda + 45, 35)

        // ID do documento à direita, sem sobrepor o título
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11)
        pdf.setTextColor(...corDestaque)
        const idText = `ID: ${documentId}`
        const idWidth = (pdf.getStringUnitWidth(idText) * 11) / pdf.internal.scaleFactor
        pdf.text(idText, pdf.internal.pageSize.getWidth() - margemDireita - idWidth, 30)        // Número da página à direita com informação total de páginas
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(10)
        pdf.setTextColor(...corTextoSecundario)
        
        // Sempre mostra "Página X de Y" com o número correto
        const pageText = `Página ${pageNumber} de ${totalPages}`
        console.log(`Renderizando numeração: ${pageText}`);
        
        // Posiciona o texto alinhado à direita
        const pageWidth = (pdf.getStringUnitWidth(pageText) * 10) / pdf.internal.scaleFactor
        pdf.text(pageText, pdf.internal.pageSize.getWidth() - margemDireita - pageWidth, 35)

        // Linha separadora abaixo do cabeçalho
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.2)
        pdf.line(margemEsquerda, 40, pdf.internal.pageSize.getWidth() - margemDireita, 40)
      }      // Função para adicionar rodapé corporativo
      const addFooter = (pageNumber: number, totalPages: number = 1) => {
        const footerY = pdf.internal.pageSize.getHeight() - 15

        // Linha separadora acima do rodapé
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.2)
        pdf.line(margemEsquerda, footerY - 5, pdf.internal.pageSize.getWidth() - margemDireita, footerY - 5)

        // Informações do rodapé
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTextoSecundario)

        // Data e hora de geração
        const dataGeracao = formatarDataBR()
        pdf.text(`Documento gerado em: ${dataGeracao}`, margemEsquerda, footerY)

        // Informações da empresa
        pdf.text("BRK - Registro de Não Conformidade", pdf.internal.pageSize.getWidth() / 2 - 25, footerY)

        // Número da página
        const pageText = `Página ${pageNumber} de ${totalPages}`
        const pageWidth = (pdf.getStringUnitWidth(pageText) * 8) / pdf.internal.scaleFactor
        pdf.text(pageText, pdf.internal.pageSize.getWidth() - margemDireita - pageWidth, footerY)
      }

      // Função para adicionar título de seção com estilo corporativo
      const addSectionTitle = (title: string, y: number): number => {
        // Fundo do título
        pdf.setFillColor(...corPrimaria)
        pdf.rect(margemEsquerda, y, larguraUtil, 8, "F")

        // Texto do título
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(10)
        pdf.setTextColor(...corBranco)
        pdf.text(title, margemEsquerda + 5, y + 5.5)

        return y + 8
      }

      // Função para adicionar subtítulo
      const addSubtitle = (title: string, y: number): number => {
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(10)
        pdf.setTextColor(...corPrimaria)
        pdf.text(title, margemEsquerda, y)

        // Linha sob o subtítulo
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.1)
        pdf.line(
          margemEsquerda,
          y + 1,
          margemEsquerda + (pdf.getStringUnitWidth(title) * 10) / pdf.internal.scaleFactor + 5,
          y + 1,
        )

        return y + 5
      }

      // Função para adicionar campo de texto com label
      const addTextField = (label: string, value: string, x: number, y: number, width: number): number => {
        // Label
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(9)
        pdf.setTextColor(...corTexto)
        pdf.text(label, x, y)

        const labelWidth = (pdf.getStringUnitWidth(label) * 9) / pdf.internal.scaleFactor + 2
        const valueX = x + labelWidth
        const valueWidth = width - labelWidth

        // Valor
        if (value) {
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(...corTexto)

          const linhas = quebrarTexto(value, valueWidth, 9)
          pdf.text(linhas, valueX, y)

          return calcularAlturaTexto(linhas, 4) + 2
        } else {
          // Placeholder para campo vazio
          pdf.setDrawColor(...corSecundaria)
          pdf.setLineWidth(0.1)
          pdf.line(valueX, y, x + width, y)
          return 4
        }
      }

      // Função para adicionar checkbox estilizado
      const addStyledCheckbox = (x: number, y: number, checked: boolean, label: string, size: number = 3): number => {
        // Desenha o checkbox usando a função comum
        drawCheckbox(x, y - size, size, checked)

        // Label (ajustado o espaçamento baseado no tamanho)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTexto)
        pdf.text(label, x + size + 2, y)

        const labelWidth = (pdf.getStringUnitWidth(label) * 8) / pdf.internal.scaleFactor + 7
        return labelWidth
      }

      // Nova função para desenhar checkbox de forma consistente
      const drawCheckbox = (x: number, y: number, size: number, checked: boolean) => {
        if (checked) {
          // Checkbox marcado
          pdf.setFillColor(...corDestaque)
          pdf.rect(x, y, size, size, "F")
          
          // Marca de verificação (ajustada para o tamanho)
          pdf.setDrawColor(...corBranco)
          pdf.setLineWidth(0.2)
          const checkScale = size / 4
          pdf.line(x + 0.8 * checkScale, y + 1.5 * checkScale, x + 1.5 * checkScale, y + 2.5 * checkScale)
          pdf.line(x + 1.5 * checkScale, y + 2.5 * checkScale, x + 3.2 * checkScale, y + 0.5 * checkScale)
        } else {
          // Checkbox vazio
          pdf.setDrawColor(...corPrimaria)
          pdf.setLineWidth(0.1)
          pdf.setFillColor(...corBranco)
          pdf.rect(x, y, size, size, "S")
        }
      }

      // Função para adicionar imagem com alta qualidade
      const addHighQualityImage = async (
        imgSrc: string | null,
        x: number,
        y: number,
        width: number,
        height: number,      ): Promise<boolean> => {
        if (!imgSrc) return false

        try {
          const img = await loadImageFromBase64(imgSrc)          // Determina o formato da imagem
          let format: "JPEG" | "PNG" = "JPEG"
          if (imgSrc.startsWith("data:image/png")) {
            format = "PNG"
          }

          // Adiciona a imagem
          pdf.addImage({
            imageData: img,
            format: format,
            x: x,
            y: y,
            width: width,
            height: height,
            compression: "FAST",
            rotation: 0,
            alias: new Date().getTime().toString(),
          })

          // Adiciona borda sutil ao redor da imagem
          pdf.setDrawColor(...corSecundaria)
          pdf.setLineWidth(0.1)
          pdf.rect(x, y, width, height, "S")

          return true
        } catch (error) {
          console.warn("Erro ao adicionar imagem ao PDF:", error)
          return false
        }      }
      
      // Criar um documento temporário para calcular o número de páginas
      // Ativamos o modo de cálculo para minimizar a renderização durante essa fase
      isCalculatingMode = true;
      
      // Posição inicial após o cabeçalho (simplificado durante o cálculo)
      let yPos = margemSuperior + 30
      
      // Adiciona cabeçalho simplificado para primeira página durante cálculo
      // Sem número total de páginas ainda
      addHeader(1, 0)

      // Adiciona informações gerais do documento - VERSÃO MAIS COMPACTA
      yPos = addSectionTitle("INFORMAÇÕES GERAIS", yPos)
      yPos += 5

      // Cria uma tabela estruturada para informações gerais
      const colWidth = larguraUtil / 2 - 5

      // Desenha um retângulo de fundo para toda a área de informações gerais
      pdf.setFillColor(248, 250, 252) // Cor de fundo muito suave
      pdf.rect(margemEsquerda, yPos, larguraUtil, 60, "F")

      // Adiciona uma borda sutil
      pdf.setDrawColor(...corSecundaria)
      pdf.setLineWidth(0.1)
      pdf.rect(margemEsquerda, yPos, larguraUtil, 60, "S")

      // Status Atividade com layout compacto
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corPrimaria)
      pdf.text("Status da Atividade:", margemEsquerda + 5, yPos + 5)

      // Opções de status em layout horizontal compacto
      const statusOptions = [
        { label: "Liberada", value: "liberada" },
        { label: "Liberada c/ Restrição", value: "liberadaRestricao" },
        { label: "Suspensa/Paralisada", value: "suspensaParalisada" },
      ]

      let currentX = margemEsquerda + 45
      statusOptions.forEach((option) => {
        // Checkbox com estilo compacto usando a função comum
        const checkSize = 4;
        drawCheckbox(currentX, yPos + 2, checkSize, formData.statusAtividade === option.value)

        // Label
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTexto)
        pdf.text(option.label, currentX + 5, yPos + 5)

        // Calcula o espaço necessário para esta opção
        const labelWidth = (pdf.getStringUnitWidth(option.label) * 8) / pdf.internal.scaleFactor + 12
        currentX += labelWidth
      })

      // Cria uma grade compacta para os campos principais
      const campos = [
        { label: "Contratante:", value: "BRK", x: margemEsquerda + 5, y: yPos + 15 },
        { label: "Contrato:", value: formData.contrato || "", x: margemEsquerda + colWidth / 2 + 10, y: yPos + 15 },
        { label: "Contratada:", value: formData.empresa || "", x: margemEsquerda + 5, y: yPos + 25 },
        {
          label: "Local da NC:",
          value: formData.localNc || "",
          x: margemEsquerda + 5,
          y: yPos + 35,
          isMultiline: true,
        },
        { label: "Resp. Frente:", value: formData.respFrente || "", x: margemEsquerda + 5, y: yPos + 45 },
        { label: "Escopo:", value: formData.escopo || "", x: margemEsquerda + 5, y: yPos + 55, isMultiline: true },
      ]

      // Substituir o loop que renderiza os campos por este novo loop que trata campos multilinhas
      campos.forEach((campo) => {
        // Label em negrito e cor primária
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(8)
        pdf.setTextColor(...corPrimaria)
        pdf.text(campo.label, campo.x, campo.y)

        // Valor com estilo compacto
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(...corTexto)

        const labelWidth = (pdf.getStringUnitWidth(campo.label) * 8) / pdf.internal.scaleFactor

        if (campo.value) {
          // Para campos que podem ter múltiplas linhas
          if (campo.isMultiline) {
            // Determinar a largura máxima disponível para o texto
            const maxWidth = campo.label === "Local da NC:" ? larguraUtil - 20 : larguraUtil - 20

            // Quebrar o texto em múltiplas linhas se necessário
            const linhas = quebrarTexto(campo.value, maxWidth, 8)

            // Renderizar as linhas
            pdf.text(linhas, campo.x + labelWidth + 2, campo.y)

            // Se for o campo "Local da NC" e tiver mais de uma linha, ajustar a posição dos campos seguintes
            if (campo.label === "Local da NC:" && linhas.length > 1) {
              // Ajustar a posição Y dos campos seguintes
              const ajuste = (linhas.length - 1) * 4

              // Ajustar os campos que vêm depois do "Local da NC"
              for (let i = campos.indexOf(campo) + 1; i < campos.length; i++) {
                campos[i].y += ajuste
              }

              // Aumentar a altura total da seção de informações gerais
              yPos += ajuste
            }
          } else {
            pdf.text(campo.value, campo.x + labelWidth + 2, campo.y)
          }
        } else {
          // Linha para campo vazio
          pdf.setDrawColor(...corSecundaria)
          pdf.setLineWidth(0.1)

          // Para o escopo, linha mais longa
          if (campo.label === "Escopo:") {
            pdf.line(campo.x + labelWidth + 2, campo.y, campo.x + larguraUtil - 15, campo.y)
          } else {
            const lineWidth = campo.x < margemEsquerda + colWidth / 2 ? colWidth / 2 - 15 : colWidth - 15
                        pdf.line(campo.x + labelWidth + 2, campo.y, campo.x + lineWidth, campo.y)
          }
        }
      });
        yPos += 65; // Classificação com estilo melhorado
      yPos = addSectionTitle("CLASSIFICAÇÃO", yPos)
      yPos += 5
        // Altura da área de classificação para melhor organizar os itens
      const alturaClassificacao = 110; // Ajustado para uso mais eficiente do espaço em relação ao "Grau"
      
      // Desenha um retângulo de fundo para toda a área de classificação
      pdf.setFillColor(248, 250, 252) // Cor de fundo muito suave
      pdf.rect(margemEsquerda, yPos, larguraUtil, alturaClassificacao, "F")

      // Adiciona uma borda sutil
      pdf.setDrawColor(...corSecundaria)
      pdf.setLineWidth(0.1)
      pdf.rect(margemEsquerda, yPos, larguraUtil, alturaClassificacao, "S")
        // ------ SEÇÃO TIPO ------
      
      // Cabeçalho da seção TIPO
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corPrimaria)
      pdf.text("Tipo:", margemEsquerda + 5, yPos + 10)
      
      const tipoOptions = [
        { label: "SAA", value: "saa" },
        { label: "SES", value: "ses" },
      ]
        // Posicionamento dos checkboxes do TIPO
      let currentXTipo = margemEsquerda + 30;        tipoOptions.forEach((option) => {
        const checkSize = 4;
        
        // Checkbox - usando a função comum
        drawCheckbox(currentXTipo, yPos + 7, checkSize, formData.tipo.includes(option.value))
        
        // Label
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTexto)
        pdf.text(option.label, currentXTipo + 6, yPos + 10)
        
        currentXTipo += 80; // Espaçamento aumentado para distribuir melhor na largura total
      })
        // ------ SEÇÃO NATUREZA ------
      
      // Cabeçalho da seção NATUREZA
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corPrimaria)
      pdf.text("Natureza:", margemEsquerda + 5, yPos + 25)
      
      const naturezaOptions = [
        { label: "EXECUÇÃO", value: "execucao" },
        { label: "QUALIDADE", value: "qualidade" },
        { label: "SEGURANÇA", value: "seguranca" },
        { label: "PROJETO", value: "projeto" },
        { label: "MATERIAL", value: "material" },
        { label: "INTERFERÊNCIA", value: "interferencia" },
        { label: "M. AMBIENTE", value: "mAmbiente" },
        { label: "ORGANIZ/COMPORTAMENTO", value: "organizComportamento" },
      ]
      // Layout em grade organizada para Natureza usando largura total
      // Dividir em 4 colunas x 2 linhas
      const naturezaColCount = 4;
      const naturezaRowCount = 2;
      const naturezaColWidth = (larguraUtil - 50) / naturezaColCount;
      const naturezaRowHeight = 12;
      const naturezaStartX = margemEsquerda + 30;
      const naturezaStartY = yPos + 25;
      
      for (let row = 0; row < naturezaRowCount; row++) {
        for (let col = 0; col < naturezaColCount; col++) {
          const index = row * naturezaColCount + col;
          if (index < naturezaOptions.length) {
            const option = naturezaOptions[index];
            const optionX = naturezaStartX + (col * naturezaColWidth);
            const optionY = naturezaStartY + (row * naturezaRowHeight);
            
            // Checkbox com tamanho consistente
            const checkSize = 4;
            // Checkbox - usando a função comum
            drawCheckbox(optionX, optionY - 3, checkSize, formData.natureza.includes(option.value))
            
            // Label
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(7) // Tamanho menor para caber
            pdf.setTextColor(...corTexto)
            pdf.text(option.label, optionX + 6, optionY)
          }
        }
      }
        // ------ SEÇÃO OBRA ------
      
      // Cabeçalho da seção OBRA
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corPrimaria)
      pdf.text("Obra:", margemEsquerda + 5, yPos + 50)
      
      const obraOptions = [
        { label: "RCE", value: "rce" },
        { label: "RDA", value: "rda" },
        { label: "LIGAÇÕES", value: "ligacoes" },
        { label: "ADUTORA", value: "adutora" },
        { label: "OUTROS", value: "outro" },
        { label: "COLETOR", value: "coletor" },
        { label: "LR", value: "lr" },
        { label: "EEE", value: "eee" },
        { label: "RESERVATÓRIO", value: "reservatorio" },
        { label: "ETE", value: "ete" },
        { label: "ETA", value: "eta" },
        { label: "BARRAGEM", value: "barragem" },
        { label: "PAVIMENTAÇÃO", value: "pavimentacao" },
      ]
      
      // Disposição em grade para obra usando largura total - 4 colunas por 4 linhas
      const obraColCount = 5;
      const obraRowCount = 3;
      const obraColWidth = (larguraUtil - 40) / obraColCount;
      const obraRowHeight = 10;
      const obraStartX = margemEsquerda + 30;
      const obraStartY = yPos + 50;
      
      for (let row = 0; row < obraRowCount; row++) {
        for (let col = 0; col < obraColCount; col++) {
          const index = row * obraColCount + col;
          if (index < obraOptions.length) {
            const option = obraOptions[index];
            const optionX = obraStartX + (col * obraColWidth);
            const optionY = obraStartY + (row * obraRowHeight);
            
            // Checkbox
            const checkSize = 4;
            // Checkbox - usando a função comum
            drawCheckbox(optionX, optionY - 3, checkSize, formData.obra.includes(option.value))
            
            // Label
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(6) // Tamanho menor para caber
            pdf.setTextColor(...corTexto)
            pdf.text(option.label, optionX + 5, optionY)
          }
        }
      }
        // ------ SEÇÃO GRAU ------
      
      // Cabeçalho da seção GRAU
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corPrimaria)
      pdf.text("Grau:", margemEsquerda + 5, yPos + 85)
      
      const grauOptions = [
        { label: "LEVE", value: "leve" },
        { label: "MÉDIA", value: "media" },
        { label: "GRAVE", value: "grave" },
        { label: "GRAVÍSSIMA", value: "gravissima" },
      ]
        // Layout horizontal para opções de grau usando largura total
      let grauX = margemEsquerda + 30;
      grauOptions.forEach((option) => {
        const checkSize = 4;
        
        // Checkbox - usando a função comum
        drawCheckbox(grauX, yPos + 82, checkSize, formData.grau === option.value)
          // Label
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTexto)
        pdf.text(option.label, grauX + 6, yPos + 85)
        grauX += 20; // Espaçamento aumentado para distribuir melhor na largura total
      })

      yPos += 95 // Ajustar posição para a próxima seção considerando a altura da classificação      // Problema Identificado
      yPos = addSectionTitle("PROBLEMA IDENTIFICADO", yPos)
      yPos += 5

      const problemaLinhas = quebrarTexto(formData.problema || "", larguraUtil, 9)
      const alturaLinhaProblema = 4
      
      // Se o problema é muito grande e precisa de nova página
      if (problemaLinhas.length > 15) {
        // Verifica se há espaço suficiente
        if (yPos + 15 * alturaLinhaProblema > pdf.internal.pageSize.getHeight() - margemInferior - 20) {
          // Altura para as linhas que cabem nesta página
          const alturaProblemaAtual = 15 * alturaLinhaProblema + 6 // 6px de padding vertical
          
          // Desenha o fundo do texto do problema identificado nesta página
          pdf.setFillColor(248, 250, 252) // Cor de fundo muito suave, igual às outras seções
          pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblemaAtual, "F")
          
          pdf.addPage()
          addHeader(pdf.getNumberOfPages())
          yPos = margemSuperior + 30        } else {
          // Altura para as primeiras 15 linhas
          const alturaProblemaAtual = 15 * alturaLinhaProblema + 6 // 6px de padding vertical
          
          // Desenha o fundo do texto do problema identificado
          pdf.setFillColor(248, 250, 252) // Cor de fundo muito suave, igual às outras seções
          pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblemaAtual, "F")
          
          // Adiciona uma borda sutil
          pdf.setDrawColor(...corSecundaria)
          pdf.setLineWidth(0.1)
          pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblemaAtual, "S")
        }

        // Exibe as primeiras 15 linhas
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.setTextColor(...corTexto) // Texto escuro em vez de branco
        pdf.text(problemaLinhas.slice(0, 15), margemEsquerda + 2, yPos + 3)
        yPos += 15 * alturaLinhaProblema + 5        // Adiciona nova página para o restante do texto
        pdf.addPage()
        addHeader(pdf.getNumberOfPages())
        yPos = margemSuperior + 30
        
        // Calcula a altura correta para o texto restante
        const linhasRestantes = problemaLinhas.slice(15)
        const alturaProblemaRestante = linhasRestantes.length * alturaLinhaProblema + 6
          // Desenha o fundo do texto do problema identificado na nova página
        pdf.setFillColor(248, 250, 252) // Cor de fundo muito suave, igual às outras seções
        pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblemaRestante, "F")
        
        // Adiciona uma borda sutil
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.1)
        pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblemaRestante, "S")
        
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.setTextColor(...corTexto) // Texto escuro em vez de branco
        pdf.text(linhasRestantes, margemEsquerda + 2, yPos + 3)
        yPos += linhasRestantes.length * alturaLinhaProblema + 10      } else {
        // Calcula a altura correta para o texto completo
        const alturaProblema = problemaLinhas.length * alturaLinhaProblema + 6 // 6px de padding vertical
        
        // Desenha o fundo do texto do problema identificado
        pdf.setFillColor(248, 250, 252) // Cor de fundo muito suave, igual às outras seções
        pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblema, "F")
        
        // Adiciona uma borda sutil
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.1)
        pdf.rect(margemEsquerda, yPos - 2, larguraUtil, alturaProblema, "S")
        
        // Exibe todo o texto
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.setTextColor(...corTexto) // Texto escuro em vez de branco
        pdf.text(problemaLinhas, margemEsquerda + 2, yPos + 3)
        yPos += problemaLinhas.length * alturaLinhaProblema + 10
      }

      // Evidências (Imagens)
      // Evidências (Imagens) - Sempre em uma nova página para evitar quebra
      pdf.addPage()
      addHeader(pdf.getNumberOfPages())
      yPos = margemSuperior + 30
      yPos = addSectionTitle("EVIDÊNCIAS", yPos)
      yPos += 5

      // A altura das imagens já está garantida na nova página
      const alturaImagens = 80 // Altura estimada para imagens e legendas

      // Verifica se há espaço suficiente para as imagens
      // const alturaImagens = 80 // Altura estimada para imagens e legendas

      // if (yPos + alturaImagens > pdf.internal.pageSize.getHeight() - margemInferior - 20) {
      //   pdf.addPage()
      //   addHeader(pdf.getNumberOfPages())
      //   yPos = margemSuperior + 30
      // }

      // Layout para as imagens lado a lado
      const imageWidth = larguraUtil / 2 - 5
      const imageHeight = 60

      // Figura 1
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corTexto)
      pdf.text("Figura 1:", margemEsquerda, yPos)

      // Descrição da figura 1
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(...corTextoSecundario)
      pdf.text(formData.figura1Desc || "", margemEsquerda + 20, yPos)

      // Figura 2
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corTexto)
      pdf.text("Figura 2:", margemEsquerda + imageWidth + 10, yPos)

      // Descrição da figura 2
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(...corTextoSecundario)
      pdf.text(formData.figura2Desc || "", margemEsquerda + imageWidth + 30, yPos)

      yPos += 5

      // Adiciona as imagens
      if (formData.imagem1) {
        await addHighQualityImage(formData.imagem1, margemEsquerda, yPos, imageWidth, imageHeight)
      } else {
        // Placeholder para imagem 1
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.1)
        pdf.rect(margemEsquerda, yPos, imageWidth, imageHeight, "S")

        pdf.setFont("helvetica", "italic")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTextoSecundario)
        pdf.text("Sem imagem", margemEsquerda + imageWidth / 2 - 15, yPos + imageHeight / 2)
      }

      if (formData.imagem2) {
        await addHighQualityImage(formData.imagem2, margemEsquerda + imageWidth + 10, yPos, imageWidth, imageHeight)
      } else {
        // Placeholder para imagem 2
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.1)
        pdf.rect(margemEsquerda + imageWidth + 10, yPos, imageWidth, imageHeight, "S")

        pdf.setFont("helvetica", "italic")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTextoSecundario)
        pdf.text("Sem imagem", margemEsquerda + imageWidth + 10 + imageWidth / 2 - 15, yPos + imageHeight / 2)
      }

      yPos += imageHeight + 15

      // Ações Corretivas
      yPos = adicionarNovaPaginaSeNecessario(100, yPos)
      yPos = addSectionTitle("AÇÕES CORRETIVAS", yPos)
      yPos += 5

      // Disposições Gerais
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corTexto)
      pdf.text("Disposições Gerais:", margemEsquerda, yPos)

      currentX = margemEsquerda + 40

      const acaoOptions = [
        { label: "CORRIGIR", value: "corrigir" },
        { label: "REPROVAR/SUSPENDER", value: "reprovarSuspender" },
        { label: "AUTORIZAR SOB CONCESSÃO", value: "autorizarConcessao" },
        { label: "INFORMAR", value: "informar" },
      ]

      // Organiza as opções em duas linhas se necessário
      if (pdfOrientation === "portrait") {
        // Primeira linha
        for (let i = 0; i < 2; i++) {
          if (i < acaoOptions.length) {
            const option = acaoOptions[i]
            const width = addStyledCheckbox(currentX, yPos, formData.acaoCorretiva === option.value, option.label, 4)
            currentX += width + 10
          }
        }

        yPos += 8

        // Segunda linha
        currentX = margemEsquerda + 40
        for (let i = 2; i < 4; i++) {
          if (i < acaoOptions.length) {
            const option = acaoOptions[i]
            const width = addStyledCheckbox(currentX, yPos, formData.acaoCorretiva === option.value, option.label, 4)
            currentX += width + 10
          }
        }
      } else {
        // Em paisagem, pode colocar tudo em uma linha
        acaoOptions.forEach((option) => {
          const width = addStyledCheckbox(currentX, yPos, formData.acaoCorretiva === option.value, option.label, 4)
          currentX += width + 10
        })
      }

      yPos += 12

      // Tabela de ações
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(9)
      pdf.setTextColor(...corTexto)
      pdf.text("Ações a Executar / Concessões Obtidas:", margemEsquerda, yPos)
      yPos += 5

      // Cabeçalho da tabela
      pdf.setFillColor(...corPrimaria)
      pdf.rect(margemEsquerda, yPos, larguraUtil, 8, "F")

      // Colunas da tabela
      const colWidths = [larguraUtil * 0.6, larguraUtil * 0.2, larguraUtil * 0.2]

      // Títulos das colunas
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(8)
      pdf.setTextColor(...corBranco)

      pdf.text("AÇÃO", margemEsquerda + 5, yPos + 5.5)
      pdf.text("RESPONSÁVEL", margemEsquerda + colWidths[0] + 5, yPos + 5.5)
      pdf.text("PRAZO", margemEsquerda + colWidths[0] + colWidths[1] + 5, yPos + 5.5)

      yPos += 8

      // Linhas da tabela
      formData.acoes.forEach((acao, index) => {
        // Altura da linha
        const rowHeight = 8

        // Fundo alternado para melhor legibilidade
        if (index % 2 === 0) {
          pdf.setFillColor(...corTerciaria)
          pdf.rect(margemEsquerda, yPos, larguraUtil, rowHeight, "F")
        }

        // Conteúdo das células
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(...corTexto)

        // Célula 1: Ação
        const acaoText = quebrarTexto(acao.acao || "", colWidths[0] - 10, 8)
        pdf.text(acaoText.length > 0 ? acaoText : [""], margemEsquerda + 5, yPos + 5)

        // Célula 2: Responsável
        const respText = quebrarTexto(acao.responsavel || "", colWidths[1] - 10, 8)
        pdf.text(respText.length > 0 ? respText : [""], margemEsquerda + colWidths[0] + 5, yPos + 5)

        // Célula 3: Prazo
        const prazoText = quebrarTexto(acao.prazo || "", colWidths[2] - 10, 8)
        pdf.text(prazoText.length > 0 ? prazoText : [""], margemEsquerda + colWidths[0] + colWidths[1] + 5, yPos + 5)

        // Linhas divisórias
        pdf.setDrawColor(...corSecundaria)
        pdf.setLineWidth(0.1)

        // Linha horizontal inferior
        pdf.line(margemEsquerda, yPos + rowHeight, margemEsquerda + larguraUtil, yPos + rowHeight)

        // Linhas verticais
        pdf.line(margemEsquerda + colWidths[0], yPos, margemEsquerda + colWidths[0], yPos + rowHeight)
        pdf.line(
          margemEsquerda + colWidths[0] + colWidths[1],
          yPos,
          margemEsquerda + colWidths[0] + colWidths[1],
          yPos + rowHeight,
        )

        yPos += rowHeight
      })      // Borda externa da tabela
      pdf.setDrawColor(...corSecundaria)
      pdf.setLineWidth(0.2)
      pdf.rect(margemEsquerda, yPos - 8 * formData.acoes.length, larguraUtil, 8 * formData.acoes.length, "S");
      
      yPos += 5

      // Assinaturas - tentamos manter na mesma página que a tabela de ações
      // Reduzimos a altura necessária para as assinaturas para 50 unidades em vez de 120
      // para evitar quebra de página desnecessária
      yPos = adicionarNovaPaginaSeNecessario(0, yPos)
      yPos = addSectionTitle("DATAS", yPos)
      yPos += 10

      // Cria duas colunas para as assinaturas
      const signatureColWidth = larguraUtil / 2 - 5      // Versão mais compacta para as assinaturas
      const signatureHeight = 30; // Reduzido de 100 para 60
      
      // Coluna de Abertura
      pdf.setFillColor(...corTerciaria)
      pdf.rect(margemEsquerda, yPos, signatureColWidth, signatureHeight, "F")

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(10)
      pdf.setTextColor(...corPrimaria)
      pdf.text("ABERTURA", margemEsquerda + signatureColWidth / 2 - 15, yPos + 8)

      // Data de abertura
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(...corTexto)
      pdf.text(`Data: ${formData.dataAbertura || "___/___/______"}`, margemEsquerda + 10, yPos + 20)

      // Coluna de Fechamento
      pdf.setFillColor(...corTerciaria)
      pdf.rect(margemEsquerda + signatureColWidth + 10, yPos, signatureColWidth, signatureHeight, "F")

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(10)
      pdf.setTextColor(...corPrimaria)
      pdf.text("FECHAMENTO", margemEsquerda + signatureColWidth + 10 + signatureColWidth / 2 - 20, yPos + 8)

      // Data de fechamento
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(...corTexto)
      pdf.text(
        `Data: ${formData.dataFechamento || "___/___/______"}`,
        margemEsquerda + signatureColWidth + 20,
        yPos + 20,
      )
      
      // Agora que concluímos todo o documento, sabemos o número total de páginas
      const totalPages = pdf.getNumberOfPages();
      
      console.log(`Documento gerado com ${totalPages} páginas. Aplicando cabeçalhos e rodapés finais.`);
      
      // Desativa o modo de cálculo para exibir os cabeçalhos e rodapés completos
      isCalculatingMode = false;
      
      // Regeneramos todos os cabeçalhos e rodapés com o número correto de páginas
      for (let i = 1; i <= totalPages; i++) {
        // Muda para a página atual
        pdf.setPage(i);
        
        // Limpa o cabeçalho anterior (simplificado)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 40, 'F');
        
        // Adiciona o cabeçalho completo com a numeração correta
        addHeader(i, totalPages);
        
        // Adiciona o rodapé com a numeração correta
        addFooter(i, totalPages);
      }

      // Salva o PDF
      pdf.save(`${documentId}.pdf`)

      toast({
        title: "PDF gerado com sucesso!",
        description: "O download do arquivo foi iniciado.",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="orientation" className="whitespace-nowrap">
            Orientação do PDF:
          </Label>
          <Select value={pdfOrientation} onValueChange={(value: "portrait" | "landscape") => setPdfOrientation(value)}>
            <SelectTrigger id="orientation" className="w-[180px]">
              <SelectValue placeholder="Selecione a orientação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Retrato</SelectItem>
              <SelectItem value="landscape">Paisagem</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            variant="outline"
            className="border-[#3D00FF] text-[#3D00FF] hover:bg-[#3D00FF]/10"
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewMode ? "Editar Formulário" : "Visualizar"}
          </Button>
          <Button onClick={gerarPDF} disabled={isGeneratingPdf} className="bg-[#3D00FF] hover:bg-[#3D00FF]/90">
            <FileText className="mr-2 h-4 w-4" />
            {isGeneratingPdf ? "Gerando PDF..." : "Gerar PDF"}
          </Button>
        </div>
      </div>

      <Card id="rnc-content" className="p-2 border-2 border-[#3D00FF] bg-white print:shadow-none" ref={formRef}>
        <div className="space-y-2">
          <CabecalhoSection />

          {/* Seção de Identificação com cabeçalho clicável em dispositivos móveis */}
          <div className="rounded-lg overflow-hidden">
            {isMobile && (
              <div
                className="bg-[#3D00FF]/10 p-2 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("identificacao")}
              >
                <h3 className="font-bold text-[#3D00FF]">IDENTIFICAÇÃO</h3>
                {expandedSections.identificacao ? (
                  <ChevronUp className="h-4 w-4 text-[#3D00FF]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#3D00FF]" />
                )}
              </div>
            )}
            {(!isMobile || expandedSections.identificacao) && (
              <IdentificacaoSection updateFormData={updateFormData} formData={formData} readOnly={isPreviewMode} />
            )}
          </div>

          {/* Seção de Observações com cabeçalho clicável em dispositivos móveis */}
          <div className="rounded-lg overflow-hidden">
            {isMobile && (
              <div
                className="bg-[#3D00FF]/10 p-2 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("observacoes")}
              >
                <h3 className="font-bold text-[#3D00FF]">OBSERVAÇÕES/IMAGENS</h3>
                {expandedSections.observacoes ? (
                  <ChevronUp className="h-4 w-4 text-[#3D00FF]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#3D00FF]" />
                )}
              </div>
            )}
            {(!isMobile || expandedSections.observacoes) && (
              <ObservacoesSection updateFormData={updateFormData} formData={formData} readOnly={isPreviewMode} />
            )}
          </div>

          {/* Seção de Ações com cabeçalho clicável em dispositivos móveis */}
          <div className="rounded-lg overflow-hidden">
            {isMobile && (
              <div
                className="bg-[#3D00FF]/10 p-2 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("acoes")}
              >
                <h3 className="font-bold text-[#3D00FF]">AÇÕES</h3>
                {expandedSections.acoes ? (
                  <ChevronUp className="h-4 w-4 text-[#3D00FF]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#3D00FF]" />
                )}
              </div>
            )}
            {(!isMobile || expandedSections.acoes) && (
              <AcoesSection updateFormData={updateFormData} formData={formData} readOnly={isPreviewMode} />
            )}
          </div>

          {/* Seção de Assinaturas com cabeçalho clicável em dispositivos móveis */}
          <div className="rounded-lg overflow-hidden">
            {isMobile && (
              <div
                className="bg-[#3D00FF]/10 p-2 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("assinaturas")}
              >
                <h3 className="font-bold text-[#3D00FF]">ASSINATURAS</h3>
                {expandedSections.assinaturas ? (
                  <ChevronUp className="h-4 w-4 text-[#3D00FF]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#3D00FF]" />
                )}
              </div>
            )}
            {(!isMobile || expandedSections.assinaturas) && (
              <AssinaturasSection updateFormData={updateFormData} formData={formData} readOnly={isPreviewMode} />
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
