"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, MapPin, Loader2, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"

const labelClass = cn("text-brk-blue font-bold", useMobile && "text-sm")

interface IdentificacaoSectionProps {
  updateFormData?: (field: string, value: any) => void
  formData?: any
  readOnly?: boolean
}

interface LocationResult {
  address: string
  accuracy: number
  source: string
  coordinates: {
    latitude: number
    longitude: number
  }
}

export const IdentificacaoSection = ({ updateFormData, formData, readOnly = false }: IdentificacaoSectionProps) => {
  const { toast } = useToast()
  const [statusAtividade, setStatusAtividade] = useState<string | undefined>(formData?.statusAtividade)
  const [empresa, setEmpresa] = useState<string | undefined>(formData?.empresa)
  const [contrato, setContrato] = useState<string>(formData?.contrato || "")
  const [escopo, setEscopo] = useState<string>(formData?.escopo || "")
  const [localNc, setLocalNc] = useState<string>(formData?.localNc || "")
  const [respFrente, setRespFrente] = useState<string>(formData?.respFrente || "")
  const [tipoSelecionado, setTipoSelecionado] = useState<string[]>(formData?.tipo || [])
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<string[]>(formData?.natureza || [])
  const [obraSelecionada, setObraSelecionada] = useState<string[]>(formData?.obra || [])
  const [grau, setGrau] = useState<string | undefined>(formData?.grau)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [locationSource, setLocationSource] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [bestLocation, setBestLocation] = useState<LocationResult | null>(null)
  const locationAttempts = useRef<LocationResult[]>([])
  const geocodingProviders = useRef([
    { name: "OpenStreetMap", url: "https://nominatim.openstreetmap.org/reverse" },
    { name: "LocationIQ", url: "https://us1.locationiq.com/v1/reverse.php" },
  ])
  const isMobile = useMobile()

  // Modificar os handlers para atualizar diretamente:
  const handleStatusAtividadeChange = (value: string) => {
    setStatusAtividade(value)
    if (updateFormData) updateFormData("statusAtividade", value)
  }

  const handleEmpresaChange = (value: string) => {
    setEmpresa(value)
    if (updateFormData) updateFormData("empresa", value)
  }

  const handleContratoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setContrato(value)
    if (updateFormData) updateFormData("contrato", value)
  }

  const handleEscopoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEscopo(value)
    if (updateFormData) updateFormData("escopo", value)
  }

  const handleLocalNcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalNc(value)
    if (updateFormData) updateFormData("localNc", value)
  }

  const handleRespFrenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRespFrente(value)
    if (updateFormData) updateFormData("respFrente", value)
  }

  const handleTipoChange = (tipo: string) => {
    if (readOnly) return
    const newTipos = tipoSelecionado.includes(tipo)
      ? tipoSelecionado.filter((item) => item !== tipo)
      : [...tipoSelecionado, tipo]
    setTipoSelecionado(newTipos)
    if (updateFormData) updateFormData("tipo", newTipos)
  }

  const handleNaturezaChange = (natureza: string) => {
    if (readOnly) return
    const newNaturezas = naturezaSelecionada.includes(natureza)
      ? naturezaSelecionada.filter((item) => item !== natureza)
      : [...naturezaSelecionada, natureza]
    setNaturezaSelecionada(newNaturezas)
    if (updateFormData) updateFormData("natureza", newNaturezas)
  }

  const handleObraChange = (obra: string) => {
    if (readOnly) return
    const newObras = obraSelecionada.includes(obra)
      ? obraSelecionada.filter((item) => item !== obra)
      : [...obraSelecionada, obra]
    setObraSelecionada(newObras)
    if (updateFormData) updateFormData("obra", newObras)
  }

  const handleGrauChange = (value: string) => {
    setGrau(value)
    if (updateFormData) updateFormData("grau", value)
  }

  // Função para calcular a pontuação de qualidade da localização
  const calculateLocationQuality = (accuracy: number): number => {
    // Quanto menor a accuracy, melhor (representa o raio de incerteza em metros)
    if (accuracy < 10) return 100 // Excelente precisão (< 10 metros)
    if (accuracy < 50) return 80 // Muito boa precisão
    if (accuracy < 100) return 60 // Boa precisão
    if (accuracy < 500) return 40 // Precisão moderada
    if (accuracy < 1000) return 20 // Baixa precisão
    return 10 // Precisão muito baixa
  }

  // Função para obter a cor baseada na qualidade da localização
  const getQualityColor = (quality: number): string => {
    if (quality >= 80) return "bg-green-500"
    if (quality >= 60) return "bg-green-400"
    if (quality >= 40) return "bg-yellow-500"
    if (quality >= 20) return "bg-orange-500"
    return "bg-red-500"
  }

  // Função para obter a descrição da qualidade
  const getQualityDescription = (quality: number): string => {
    if (quality >= 80) return "Excelente"
    if (quality >= 60) return "Boa"
    if (quality >= 40) return "Moderada"
    if (quality >= 20) return "Baixa"
    return "Muito baixa"
  }

  // Função para obter o endereço a partir das coordenadas usando múltiplas APIs
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    // Tentar cada provedor de geocodificação em sequência
    for (const provider of geocodingProviders.current) {
      try {
        let url = ""
        const headers: HeadersInit = {
          "Accept-Language": "pt-BR",
        }

        if (provider.name === "OpenStreetMap") {
          url = `${provider.url}?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        } else if (provider.name === "LocationIQ") {
          // Nota: LocationIQ requer uma chave API, usando apenas como exemplo
          // Na implementação real, você precisaria de uma chave API válida
          url = `${provider.url}?key=YOUR_LOCATIONIQ_API_KEY&lat=${latitude}&lon=${longitude}&format=json`
        }

        const response = await fetch(url, { headers })

        if (!response.ok) {
          throw new Error(`Falha ao obter o endereço de ${provider.name}`)
        }

        const data = await response.json()

        // Formatar o endereço de forma mais compacta
        if (data.address) {
          const addr = data.address
          const rua = addr.road || addr.street || ""
          const numero = addr.house_number || ""
          const bairro = addr.suburb || addr.neighbourhood || addr.district || ""
          const cidade = addr.city || addr.town || addr.village || ""
          const estado = addr.state || ""
          const cep = addr.postcode || ""

          // Formato mais compacto para evitar ultrapassar margens
          let endereco = `${rua}${numero ? `, ${numero}` : ""}`
          if (bairro) endereco += ` - ${bairro}`
          if (cidade) endereco += `, ${cidade}`
          if (estado) endereco += ` - ${estado}`
          if (cep) endereco += ` CEP: ${cep}`

          // Adicionar coordenadas em formato mais compacto
          endereco += ` (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`

          return endereco
        }
      } catch (error) {
        console.warn(`Erro ao obter endereço de ${provider.name}:`, error)
        // Continua para o próximo provedor
      }
    }

    // Fallback para coordenadas se nenhum provedor funcionar - formato compacto
    return `Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)}`
  }

  // Função para iniciar o monitoramento contínuo de localização
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingLocation(true)
    locationAttempts.current = []

    // Opções avançadas para geolocalização
    const options = {
      enableHighAccuracy: true, // Solicita a melhor precisão possível
      timeout: 15000, // Tempo limite de 15 segundos
      maximumAge: 0, // Não usar cache
    }

    // Primeiro, tenta obter uma posição única rapidamente
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, options)

    // Em seguida, inicia o monitoramento contínuo para refinar a posição
    const id = navigator.geolocation.watchPosition(handlePositionSuccess, handlePositionError, options)

    setWatchId(id)

    // Define um tempo limite para parar o monitoramento após 30 segundos
    setTimeout(() => {
      stopLocationTracking()
    }, 30000)
  }

  // Função para parar o monitoramento de localização
  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    // Se ainda estiver carregando e tiver pelo menos uma localização, use a melhor
    if (isLoadingLocation && locationAttempts.current.length > 0) {
      finalizeBestLocation()
    }
  }

  // Função para processar uma posição bem-sucedida
  const handlePositionSuccess = async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords

    try {
      // Obter o endereço a partir das coordenadas
      const address = await getAddressFromCoordinates(latitude, longitude)

      // Calcular a qualidade desta localização
      const quality = calculateLocationQuality(accuracy)

      // Adicionar esta tentativa à lista
      const locationResult: LocationResult = {
        address,
        accuracy,
        source: "GPS",
        coordinates: { latitude, longitude },
      }

      locationAttempts.current.push(locationResult)

      // Se esta for a primeira localização ou for melhor que a atual, atualize a interface
      if (!bestLocation || accuracy < bestLocation.accuracy) {
        setBestLocation(locationResult)
        setLocationAccuracy(accuracy)
        setLocationSource("GPS")

        // Atualizar o campo com a melhor localização até o momento
        updateLocationField(locationResult)
      }

      // Se a precisão for excelente (< 10m), podemos parar o monitoramento
      if (accuracy < 10) {
        stopLocationTracking()
      }
    } catch (error) {
      console.error("Erro ao processar localização:", error)
    }
  }

  // Função para lidar com erros de posição
  const handlePositionError = (error: GeolocationPositionError) => {
    console.error("Erro de geolocalização:", error)

    // Se já tivermos pelo menos uma localização, use-a mesmo com erro
    if (locationAttempts.current.length > 0) {
      finalizeBestLocation()
      return
    }

    setIsLoadingLocation(false)

    let errorMessage = "Não foi possível obter sua localização."

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Permissão para acessar a localização foi negada."
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Informação de localização não está disponível."
        break
      case error.TIMEOUT:
        errorMessage = "Tempo esgotado ao tentar obter a localização."
        break
    }

    toast({
      title: "Erro de geolocalização",
      description: errorMessage,
      variant: "destructive",
    })
  }

  // Função para finalizar e usar a melhor localização obtida
  const finalizeBestLocation = () => {
    setIsLoadingLocation(false)

    // Ordenar as tentativas por precisão (menor é melhor)
    const sortedAttempts = [...locationAttempts.current].sort((a, b) => a.accuracy - b.accuracy)

    if (sortedAttempts.length > 0) {
      const best = sortedAttempts[0]
      setBestLocation(best)
      setLocationAccuracy(best.accuracy)
      setLocationSource(best.source)

      // Atualizar o campo com a melhor localização
      updateLocationField(best)

      toast({
        title: "Localização obtida",
        description: `Localização obtida com precisão de ${best.accuracy.toFixed(1)} metros.`,
      })
    }
  }

  // Função para atualizar o campo de localização
  const updateLocationField = (location: LocationResult) => {
    // Limitar o tamanho do endereço para evitar problemas de layout
    let address = location.address

    // Se o endereço for muito longo, truncar e adicionar reticências
    if (address.length > 80) {
      // Tentar truncar em um ponto lógico como vírgula ou hífen
      const breakPoints = [",", " - ", " CEP:", " ("]
      let breakPoint = -1

      for (const point of breakPoints) {
        const index = address.lastIndexOf(point, 80)
        if (index > 0) {
          breakPoint = index
          break
        }
      }

      if (breakPoint > 0) {
        // Quebrar o endereço em duas partes
        const firstPart = address.substring(0, breakPoint + 1)
        const secondPart = address.substring(breakPoint + 1)

        // Formatar com quebra de linha para visualização no formulário
        address = `${firstPart.trim()}\n${secondPart.trim()}`
      }
    }

    // Formatar o endereço com as coordenadas para referência
    const formattedAddress = address.includes(location.coordinates.latitude.toString())
      ? address
      : `${address} (${location.coordinates.latitude.toFixed(5)}, ${location.coordinates.longitude.toFixed(5)})`

    setLocalNc(formattedAddress)
    if (updateFormData) updateFormData("localNc", formattedAddress)
  }

  // Função principal para obter a localização (substitui a anterior)
  const getLocation = () => {
    if (readOnly) return

    // Limpar estados anteriores
    setBestLocation(null)
    setLocationAccuracy(null)
    setLocationSource(null)

    // Iniciar o monitoramento de localização
    startLocationTracking()
  }

  // Tentar obter a localização automaticamente quando o componente for montado
  useEffect(() => {
    // Verificar se o campo já está preenchido
    if (!localNc && !readOnly) {
      // Perguntar ao usuário se deseja compartilhar a localização
      const shouldGetLocation = window.confirm(
        "Deseja preencher automaticamente o campo 'Local da NC' com sua localização atual?",
      )

      if (shouldGetLocation) {
        getLocation()
      }
    }

    // Limpar o monitoramento quando o componente for desmontado
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  return (
    <Card className="border-2 border-brk-blue">
      <CardContent className={cn("p-3 space-y-3", isMobile && "p-2 space-y-2")}>
        {/* Título da seção em dispositivos móveis */}
        {isMobile && (
          <div className="bg-brk-blue text-white font-bold p-1 text-center rounded-sm mb-2 text-sm">IDENTIFICAÇÃO</div>
        )}

        {/* Status Atividade */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <Label className={labelClass}>STATUS ATIVIDADE:</Label>
          <div className="md:col-span-3">
            <RadioGroup
              value={statusAtividade}
              onValueChange={readOnly ? undefined : handleStatusAtividadeChange}
              className={cn("flex flex-col sm:flex-row gap-2", isMobile && "gap-1")}
              disabled={readOnly}
            >
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="liberada" id="liberada" />
                <Label htmlFor="liberada" className={isMobile ? "text-base" : ""}>
                  Liberada
                </Label>
              </div>
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="liberadaRestricao" id="liberadaRestricao" />
                <Label htmlFor="liberadaRestricao" className={isMobile ? "text-base" : ""}>
                  Liberada c/ Restrição
                </Label>
              </div>
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="suspensaParalisada" id="suspensaParalisada" />
                <Label htmlFor="suspensaParalisada" className={isMobile ? "text-base" : ""}>
                  Suspensa/Paralisada
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Contratante */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <Label className={labelClass}>CONTRATANTE:</Label>
          <div className="md:col-span-3">
            <p className="text-brk-blue">BRK</p>
          </div>
        </div>

        {/* Contratada e Contrato */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3">
            <Label htmlFor="empresa" className={labelClass}>
              CONTRATADA:
            </Label>
            <Select value={empresa} onValueChange={readOnly ? undefined : handleEmpresaChange} disabled={readOnly}>
              <SelectTrigger id="empresa" className="mt-1">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Empresa 1</SelectItem>
                <SelectItem value="2">Empresa 2</SelectItem>
                <SelectItem value="3">Empresa 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contrato" className={labelClass}>
              CONTRATO:
            </Label>
            <Input
              id="contrato"
              className="mt-1"
              value={contrato}
              onChange={readOnly ? undefined : handleContratoChange}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Escopo */}
        <div>
          <Label htmlFor="escopo" className={labelClass}>
            ESCOPO:
          </Label>
          <Input
            id="escopo"
            className="mt-1"
            value={escopo}
            onChange={readOnly ? undefined : handleEscopoChange}
            readOnly={readOnly}
          />
        </div>

        {/* Local NC */}
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="localnc" className={labelClass}>
              LOCAL DA NC:
            </Label>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                disabled={isLoadingLocation}
                className="flex items-center gap-1 text-xs touch-feedback"
              >
                {isLoadingLocation ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Obtendo localização...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-3 w-3" />
                    <span>Localização precisa</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="relative">
            <Input
              id="localnc"
              className="mt-1 pr-10"
              value={localNc}
              onChange={readOnly ? undefined : handleLocalNcChange}
              readOnly={readOnly}
              placeholder={
                isLoadingLocation
                  ? "Obtendo localização precisa..."
                  : "Digite o local ou use o botão para obter sua localização atual"
              }
            />

            {isLoadingLocation && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-brk-blue" />
              </div>
            )}

            {locationAccuracy !== null && !isLoadingLocation && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {locationAccuracy < 50 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : locationAccuracy < 200 ? (
                  <MapPin className="h-4 w-4 text-yellow-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            )}
          </div>

          {/* Indicador de precisão da localização */}
          {locationAccuracy !== null && !readOnly && (
            <div className="mt-1 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span>Precisão da localização:</span>
                <Badge
                  variant="outline"
                  className={`text-white ${getQualityColor(calculateLocationQuality(locationAccuracy))}`}
                >
                  {getQualityDescription(calculateLocationQuality(locationAccuracy))}({locationAccuracy.toFixed(1)}m)
                </Badge>
              </div>
              <Progress
                value={calculateLocationQuality(locationAccuracy)}
                className="h-1"
                indicatorClassName={getQualityColor(calculateLocationQuality(locationAccuracy))}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Fonte: {locationSource || "N/A"}</span>
                {isLoadingLocation && <span>Refinando localização...</span>}
              </div>
            </div>
          )}
        </div>

        {/* Resp Frente */}
        <div>
          <Label htmlFor="respfrente" className={labelClass}>
            RESP. FRENTE:
          </Label>
          <Input
            id="respfrente"
            className="mt-1"
            value={respFrente}
            onChange={readOnly ? undefined : handleRespFrenteChange}
            readOnly={readOnly}
          />
        </div>

        {/* Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <Label className={labelClass}>TIPO:</Label>
          <div className="md:col-span-3 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 touch-feedback">
              <Checkbox
                id="saa"
                checked={tipoSelecionado.includes("saa")}
                onCheckedChange={readOnly ? undefined : () => handleTipoChange("saa")}
                disabled={readOnly}
              />
              <Label htmlFor="saa" className={isMobile ? "text-base" : ""}>
                SAA
              </Label>
            </div>
            <div className="flex items-center space-x-2 touch-feedback">
              <Checkbox
                id="ses"
                checked={tipoSelecionado.includes("ses")}
                onCheckedChange={readOnly ? undefined : () => handleTipoChange("ses")}
                disabled={readOnly}
              />
              <Label htmlFor="ses" className={isMobile ? "text-base" : ""}>
                SES
              </Label>
            </div>
          </div>
        </div>

        {/* Natureza */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <Label className={labelClass}>NATUREZA:</Label>
          <div className={cn("md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2", isMobile && "gap-1")}>
            {[
              { id: "execucao", label: "EXECUÇÃO" },
              { id: "qualidade", label: "QUALIDADE" },
              { id: "seguranca", label: "SEGURANÇA" },
              { id: "projeto", label: "PROJETO" },
              { id: "outros", label: "OUTROS" },
              { id: "material", label: "MATERIAL" },
              { id: "interferencia", label: "INTERFERÊNCIA" },
              { id: "mAmbiente", label: "M. AMBIENTE" },
              { id: "organizComportamento", label: "ORGANIZ/COMPORTAMENTO" },
            ].map((item) => (
              <div key={item.id} className="flex items-center space-x-2 touch-feedback">
                <Checkbox
                  id={item.id}
                  checked={naturezaSelecionada.includes(item.id)}
                  onCheckedChange={readOnly ? undefined : () => handleNaturezaChange(item.id)}
                  disabled={readOnly}
                />
                <Label htmlFor={item.id} className={isMobile ? "text-sm" : ""}>
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Obra */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <Label className={labelClass}>OBRA:</Label>
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { id: "rce", label: "RCE" },
              { id: "rda", label: "RDA" },
              { id: "ligacoes", label: "LIGAÇÕES" },
              { id: "adutora", label: "ADUTORA" },
              { id: "outro", label: "OUTROS" },
              { id: "coletor", label: "COLETOR" },
              { id: "lr", label: "LR" },
              { id: "eee", label: "EEE" },
              { id: "reservatorio", label: "RESERVATÓRIO" },
              { id: "ete", label: "ETE" },
              { id: "eta", label: "ETA" },
              { id: "barragem", label: "BARRAGEM" },
              { id: "pavimentacao", label: "PAVIMENTAÇÃO" },
            ].map((item) => (
              <div key={item.id} className="flex items-center space-x-2 touch-feedback">
                <Checkbox
                  id={item.id}
                  checked={obraSelecionada.includes(item.id)}
                  onCheckedChange={readOnly ? undefined : () => handleObraChange(item.id)}
                  disabled={readOnly}
                />
                <Label htmlFor={item.id} className={isMobile ? "text-sm" : ""}>
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Grau */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <Label className={labelClass}>GRAU:</Label>
          <div className="md:col-span-3">
            <RadioGroup
              value={grau}
              onValueChange={readOnly ? undefined : handleGrauChange}
              className="flex flex-col sm:flex-row gap-4"
              disabled={readOnly}
            >
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="leve" id="leve" />
                <Label htmlFor="leve" className={isMobile ? "text-base" : ""}>
                  LEVE
                </Label>
              </div>
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="media" id="media" />
                <Label htmlFor="media" className={isMobile ? "text-base" : ""}>
                  MÉDIA
                </Label>
              </div>
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="grave" id="grave" />
                <Label htmlFor="grave" className={isMobile ? "text-base" : ""}>
                  GRAVE
                </Label>
              </div>
              <div className="flex items-center space-x-2 touch-feedback">
                <RadioGroupItem value="gravissima" id="gravissima" />
                <Label htmlFor="gravissima" className={isMobile ? "text-base" : ""}>
                  GRAVÍSSIMA
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
