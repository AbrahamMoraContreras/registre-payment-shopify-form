"use client"

import { useState} from "react"
import { useSearchParams } from "next/navigation"
import { Formik, Form } from "formik"
import * as Yup from "yup"
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Grid,
  FormHelperText,
  Divider,
  Chip,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material"
import ThemeRegistry from "../components/theme-registry"

const bancos = [
  { codigo: "0001", nombre: "BANCO CENTRAL DE VENEZUELA" },
  { codigo: "0102", nombre: "BANCO DE VENEZUELA, S.A. BANCO UNIVERSAL" },
  { codigo: "0104", nombre: "BANCO VENEZOLANO DE CRÉDITO, S.A BANCO UNIVERSAL" },
  { codigo: "0105", nombre: "BANCO MERCANTIL C.A., BANCO UNIVERSAL" },
  { codigo: "0108", nombre: "BANCO PROVINCIAL, S.A. BANCO UNIVERSAL" },
  { codigo: "0114", nombre: "BANCO DEL CARIBE C.A., BANCO UNIVERSAL" },
  { codigo: "0115", nombre: "BANCO EXTERIOR C.A., BANCO UNIVERSAL" },
  { codigo: "0128", nombre: "BANCO CARONÍ C.A., BANCO UNIVERSAL" },
  { codigo: "0134", nombre: "BANESCO BANCO UNIVERSAL, C.A." },
  { codigo: "0137", nombre: "BANCO SOFITASA BANCO UNIVERSAL, C.A." },
  { codigo: "0138", nombre: "BANCO PLAZA, BANCO UNIVERSAL" },
  { codigo: "0146", nombre: "BANCO DE LA GENTE EMPRENDEDORA C.A." },
  { codigo: "0151", nombre: "BANCO FONDO COMÚN, C.A BANCO UNIVERSAL" },
  { codigo: "0156", nombre: "100% BANCO, BANCO COMERCIAL, C.A" },
  { codigo: "0157", nombre: "DELSUR, BANCO UNIVERSAL C.A." },
  { codigo: "0163", nombre: "BANCO DEL TESORO C.A., BANCO UNIVERSAL" },
  { codigo: "0166", nombre: "BANCO AGRÍCOLA DE VENEZUELA C.A., BANCO UNIVERSAL" },
  { codigo: "0168", nombre: "BANCRECER S.A., BANCO MICROFINANCIERO" },
  { codigo: "0169", nombre: "R4, BANCO MICROFINANCIERO, C.A." },
  { codigo: "0171", nombre: "BANCO ACTIVO C.A., BANCO UNIVERSAL" },
  { codigo: "0172", nombre: "BANCAMIGA BANCO UNIVERSAL, C.A." },
  { codigo: "0173", nombre: "BANCO INTERNACIONAL DE DESARROLLO C.A., BANCO UNIVERSAL" },
  { codigo: "0174", nombre: "BANPLUS BANCO UNIVERSAL, C.A." },
  { codigo: "0175", nombre: "BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL C.A." },
  { codigo: "0177", nombre: "BANCO DE LA FUERZA ARMADA NACIONAL BOLIVARIANA, B.U." },
  { codigo: "0178", nombre: "N58 BANCO DIGITAL, BANCO MICROFINANCIERO" },
  { codigo: "0191", nombre: "BANCO NACIONAL DE CRÉDITO C.A., BANCO UNIVERSAL" },
  { codigo: "0601", nombre: "INSTITUTO MUNICIPAL DE CRÉDITO POPULAR" },
]

const tiposDocumento = ["V", "J", "E"]

const tiposTransaccion = [
  { value: "pago_movil", label: "Pago Móvil" },
  { value: "transferencia", label: "Transferencia Bancaria" },
]

interface FormValues {
  tipoTransaccion: string
  banco: string
  tipoDocumento: string
  numeroDocumento: string
  numeroTelefonico: string
  numeroCuenta: string
  referencia: string
  monto: string
  descripcion: string
}

const initialValues: FormValues = {
  tipoTransaccion: "",
  banco: "",
  tipoDocumento: "",
  numeroDocumento: "",
  numeroTelefonico: "",
  numeroCuenta: "",
  referencia: "",
  monto: "",
  descripcion: "",
}

// Datos ficticios de la orden de compra
const ordenCompra = {
  numeroOrden: "ORD-2024-00847",
  fecha: "10 de marzo, 2026",
  tienda: "TechStore Venezuela",
  productos: [
    {
      nombre: "Audífonos Inalámbricos Sony WH-1000XM5",
      cantidad: 1,
      precio: 45.00,
    },
    {
      nombre: "Cargador USB-C 65W",
      cantidad: 2,
      precio: 12.50,
    },
    {
      nombre: "Funda protectora para laptop 15\"",
      cantidad: 1,
      precio: 8.99,
    },
  ],
  subtotal: 78.99,
  iva: 12.64,
  total: 91.63,
  cuotas: {
    cantidad: 3,
    valorCuota: 91.63 / 3,
  },
  estado: "Pendiente de Pago",
  metodosAceptados: ["Pago Móvil", "Transferencia Bancaria"],
  cuentaDestino: {
    banco: "BANESCO BANCO UNIVERSAL, C.A.",
    rif: "J-07013380-5",
    telefono: "04141234567",
    cuenta: "01340000000000000000",
  },
}

const getValidationSchema = (tipoTransaccion: string) => {
  const baseSchema = {
    tipoTransaccion: Yup.string().required("Seleccione un tipo de transacción"),
    banco: Yup.string().required("Seleccione un banco"),
    tipoDocumento: Yup.string().required("Seleccione un tipo de documento"),
    numeroDocumento: Yup.string()
      .required("Ingrese el número de documento")
      .matches(/^[0-9]+$/, "Solo se permiten números"),
    referencia: Yup.string().required("Ingrese la referencia"),
    monto: Yup.string()
      .required("Ingrese el monto pagado")
      .matches(/^\d+(\.\d{1,2})?$/, "Ingrese un monto válido (ej: 91.63)"),
    descripcion: Yup.string().max(200, "Máximo 200 caracteres"),
  }

  if (tipoTransaccion === "pago_movil") {
    return Yup.object({
      ...baseSchema,
      numeroTelefonico: Yup.string()
        .required("Ingrese el número telefónico")
        .matches(/^[0-9]{11}$/, "Debe tener 11 dígitos"),
    })
  }

  if (tipoTransaccion === "transferencia") {
    return Yup.object({
      ...baseSchema,
      numeroCuenta: Yup.string()
        .required("Ingrese el número de cuenta")
        .matches(/^[0-9]{20}$/, "Debe tener 20 dígitos"),
    })
  }

  return Yup.object(baseSchema)
}

interface ApiResponse {
  success: boolean
  message: string
  transaction_id?: string
  reference_number: string
  bank_name: string
  amount: number
  token: string
}

export default function TransactionForm() {
  const searchParams = useSearchParams()
  const [currentTipoTransaccion, setCurrentTipoTransaccion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; transactionId?: string } | null>(null)
  
  // Get token from URL (e.g., ?token=demo_token)
  const token = searchParams.get("token") || "demo_token"
  //Token temporal: d61b9acb-06a5-4b3d-adee-e73b43318bc4
  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setSubmitResult(null)
    
    try {
      // Build the request payload using the specified field names
      const basePayload = {
        reference_number: values.referencia,  // Número de referencia
        bank_name: values.banco,              // Banco (código)
        amount: parseFloat(values.monto),     // Monto
        token: token,                         // Token de la URL
        document_type: values.tipoDocumento,
        document_number: values.numeroDocumento,
        description: values.descripcion || undefined,
      }
      
      let endpoint: string
      let payload: typeof basePayload & { phone_number?: string; account_number?: string }
      
      if (values.tipoTransaccion === "pago_movil") {
        endpoint = "/api/transaction/pago-movil"
        payload = {
          ...basePayload,
          phone_number: values.numeroTelefonico,
        }
      } else {
        endpoint = "/api/transaction/transferencia"
        payload = {
          ...basePayload,
          account_number: values.numeroCuenta,
        }
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      
      const data: ApiResponse = await response.json()
      
      if (response.ok && data.success) {
        setSubmitResult({
          success: true,
          message: data.message,
          transactionId: data.transaction_id,
        })
      } else {
        setSubmitResult({
          success: false,
          message: (data as { detail?: string }).detail || data.message || "Error al registrar la transacción",
        })
      }
    } catch (error) {
      console.error("Error submitting transaction:", error)
      setSubmitResult({
        success: false,
        message: "Error de conexión. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ThemeRegistry>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: 4,
          px: 2,
        }}
      >
        <Grid container spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
          {/* Sección izquierda - Información de la orden */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ boxShadow: 3, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    Resumen de Orden
                  </Typography>
                  <Chip label={ordenCompra.estado} color="warning" size="small" />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">N° de Orden:</Typography>
                    <Typography variant="body2" fontWeight="medium">{ordenCompra.numeroOrden}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                    <Typography variant="body2">{ordenCompra.fecha}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tienda:</Typography>
                    <Typography variant="body2">{ordenCompra.tienda}</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
                  Productos
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {ordenCompra.productos.map((producto, index) => (
                    <Box key={index} sx={{ bgcolor: "grey.50", p: 1.5, borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                        {producto.nombre}
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                          Cantidad: {producto.cantidad}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          ${producto.precio.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2">${ordenCompra.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">IVA (16%):</Typography>
                    <Typography variant="body2">${ordenCompra.iva.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                    <Typography variant="h6" fontWeight="bold">Total a Pagar:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      ${ordenCompra.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
                  Plan de Cuotas
                </Typography>

                <Box sx={{ bgcolor: "success.50", p: 2, borderRadius: 1, border: "1px solid", borderColor: "success.200" }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Cantidad de Cuotas:</Typography>
                      <Chip label={`${ordenCompra.cuotas.cantidad} cuotas`} color="success" size="small" />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Valor por Cuota:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${ordenCompra.cuotas.valorCuota.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">Total ({ordenCompra.cuotas.cantidad} x ${ordenCompra.cuotas.valorCuota.toFixed(2)}):</Typography>
                      <Typography variant="caption" fontWeight="medium">
                        ${ordenCompra.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
                  Datos para el Pago
                </Typography>
                
                <Box sx={{ bgcolor: "primary.50", p: 2, borderRadius: 1, border: "1px solid", borderColor: "primary.100" }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">Banco:</Typography>
                      <Typography variant="caption" fontWeight="medium">{ordenCompra.cuentaDestino.banco}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">RIF:</Typography>
                      <Typography variant="caption" fontWeight="medium">{ordenCompra.cuentaDestino.rif}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">Teléfono (Pago Móvil):</Typography>
                      <Typography variant="caption" fontWeight="medium">{ordenCompra.cuentaDestino.telefono}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">Cuenta:</Typography>
                      <Typography variant="caption" fontWeight="medium">{ordenCompra.cuentaDestino.cuenta}</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Métodos aceptados: {ordenCompra.metodosAceptados.join(", ")}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sección derecha - Formulario de registro de pago */}
          <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              sx={{ textAlign: "center", fontWeight: "bold", color: "primary.main", mb: 3 }}
            >
              Registrar Pago
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
              Complete los datos de su transacción para confirmar el pago
            </Typography>

            <Formik
              initialValues={initialValues}
              validationSchema={getValidationSchema(currentTipoTransaccion)}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, errors, touched, handleChange, handleBlur, setFieldValue, resetForm }) => (
                <Form>
                  <Grid container spacing={3}>
                    {/* Tipo de Transacción */}
                    <Grid size={12}>
                      <FormControl
                        fullWidth
                        error={touched.tipoTransaccion && Boolean(errors.tipoTransaccion)}
                      >
                        <InputLabel id="tipo-transaccion-label">Tipo de Transacción</InputLabel>
                        <Select
                          labelId="tipo-transaccion-label"
                          id="tipoTransaccion"
                          name="tipoTransaccion"
                          value={values.tipoTransaccion}
                          label="Tipo de Transacción"
                          onChange={(e) => {
                            handleChange(e)
                            setCurrentTipoTransaccion(e.target.value)
                            // Reset campos específicos al cambiar tipo
                            setFieldValue("banco", "")
                            setFieldValue("tipoDocumento", "")
                            setFieldValue("numeroDocumento", "")
                            setFieldValue("numeroTelefonico", "")
                            setFieldValue("numeroCuenta", "")
                            setFieldValue("referencia", "")
                          }}
                          onBlur={handleBlur}
                        >
                          {tiposTransaccion.map((tipo) => (
                            <MenuItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.tipoTransaccion && errors.tipoTransaccion && (
                          <FormHelperText>{errors.tipoTransaccion}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Campos para Pago Móvil */}
                    {values.tipoTransaccion === "pago_movil" && (
                      <>
                        {/* Banco */}
                        <Grid size={12}>
                          <FormControl fullWidth error={touched.banco && Boolean(errors.banco)}>
                            <InputLabel id="banco-label">Banco</InputLabel>
                            <Select
                              labelId="banco-label"
                              id="banco"
                              name="banco"
                              value={values.banco}
                              label="Banco"
                              onChange={handleChange}
                              onBlur={handleBlur}
                            >
                              {bancos.map((banco) => (
                                <MenuItem key={banco.codigo} value={banco.codigo}>
                                  ({banco.codigo}) {banco.nombre}
                                </MenuItem>
                              ))}
                            </Select>
                            {touched.banco && errors.banco && (
                              <FormHelperText>{errors.banco}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid>

                        {/* Documento de Identidad */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormControl
                            fullWidth
                            error={touched.tipoDocumento && Boolean(errors.tipoDocumento)}
                          >
                            <InputLabel id="tipo-documento-label">Tipo Doc.</InputLabel>
                            <Select
                              labelId="tipo-documento-label"
                              id="tipoDocumento"
                              name="tipoDocumento"
                              value={values.tipoDocumento}
                              label="Tipo Doc."
                              onChange={handleChange}
                              onBlur={handleBlur}
                            >
                              {tiposDocumento.map((tipo) => (
                                <MenuItem key={tipo} value={tipo}>
                                  {tipo}
                                </MenuItem>
                              ))}
                            </Select>
                            {touched.tipoDocumento && errors.tipoDocumento && (
                              <FormHelperText>{errors.tipoDocumento}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            fullWidth
                            id="numeroDocumento"
                            name="numeroDocumento"
                            label="Número de Documento"
                            value={values.numeroDocumento}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.numeroDocumento && Boolean(errors.numeroDocumento)}
                            helperText={touched.numeroDocumento && errors.numeroDocumento}
                            slotProps={{
                              htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
                            }}
                          />
                        </Grid>

                        {/* Número Telefónico */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="numeroTelefonico"
                            name="numeroTelefonico"
                            label="Número Telefónico"
                            placeholder="04121234567"
                            value={values.numeroTelefonico}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.numeroTelefonico && Boolean(errors.numeroTelefonico)}
                            helperText={touched.numeroTelefonico && errors.numeroTelefonico}
                            slotProps={{
                              htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 11 },
                            }}
                          />
                        </Grid>

                        {/* Monto Pagado */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="monto"
                            name="monto"
                            label="Monto Pagado (USD)"
                            placeholder="0.00"
                            value={values.monto}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.monto && Boolean(errors.monto)}
                            helperText={touched.monto && errors.monto}
                            slotProps={{
                              input: {
                                startAdornment: <Typography sx={{ mr: 1, color: "text.secondary" }}>$</Typography>,
                              },
                              htmlInput: { inputMode: "decimal", step: "0.01" },
                            }}
                          />
                        </Grid>

                        {/* Referencia */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="referencia"
                            name="referencia"
                            label="Referencia"
                            value={values.referencia}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.referencia && Boolean(errors.referencia)}
                            helperText={touched.referencia && errors.referencia}
                          />
                        </Grid>

                        {/* Descripción */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="descripcion"
                            name="descripcion"
                            label="Descripción del Pago"
                            placeholder="Ej: Pago de compra en TechStore Venezuela"
                            value={values.descripcion}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.descripcion && Boolean(errors.descripcion)}
                            helperText={touched.descripcion && errors.descripcion}
                            multiline
                            rows={2}
                            slotProps={{
                              htmlInput: { maxLength: 200 },
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Campos para Transferencia Bancaria */}
                    {values.tipoTransaccion === "transferencia" && (
                      <>
                        {/* Banco */}
                        <Grid size={12}>
                          <FormControl fullWidth error={touched.banco && Boolean(errors.banco)}>
                            <InputLabel id="banco-transfer-label">Banco</InputLabel>
                            <Select
                              labelId="banco-transfer-label"
                              id="banco"
                              name="banco"
                              value={values.banco}
                              label="Banco"
                              onChange={handleChange}
                              onBlur={handleBlur}
                            >
                              {bancos.map((banco) => (
                                <MenuItem key={banco.codigo} value={banco.codigo}>
                                  ({banco.codigo}) {banco.nombre}
                                </MenuItem>
                              ))}
                            </Select>
                            {touched.banco && errors.banco && (
                              <FormHelperText>{errors.banco}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid>

                        {/* Documento de Identidad */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <FormControl
                            fullWidth
                            error={touched.tipoDocumento && Boolean(errors.tipoDocumento)}
                          >
                            <InputLabel id="tipo-documento-transfer-label">Tipo Doc.</InputLabel>
                            <Select
                              labelId="tipo-documento-transfer-label"
                              id="tipoDocumento"
                              name="tipoDocumento"
                              value={values.tipoDocumento}
                              label="Tipo Doc."
                              onChange={handleChange}
                              onBlur={handleBlur}
                            >
                              {tiposDocumento.map((tipo) => (
                                <MenuItem key={tipo} value={tipo}>
                                  {tipo}
                                </MenuItem>
                              ))}
                            </Select>
                            {touched.tipoDocumento && errors.tipoDocumento && (
                              <FormHelperText>{errors.tipoDocumento}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            fullWidth
                            id="numeroDocumento"
                            name="numeroDocumento"
                            label="Número de Documento"
                            value={values.numeroDocumento}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.numeroDocumento && Boolean(errors.numeroDocumento)}
                            helperText={touched.numeroDocumento && errors.numeroDocumento}
                            slotProps={{
                              htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
                            }}
                          />
                        </Grid>

                        {/* Número de Cuenta */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="numeroCuenta"
                            name="numeroCuenta"
                            label="Número de Cuenta"
                            placeholder="01020000000000000000"
                            value={values.numeroCuenta}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.numeroCuenta && Boolean(errors.numeroCuenta)}
                            helperText={touched.numeroCuenta && errors.numeroCuenta}
                            slotProps={{
                              htmlInput: { inputMode: "numeric", pattern: "[0-9]*", maxLength: 20 },
                            }}
                          />
                        </Grid>

                        {/* Monto Pagado */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="monto"
                            name="monto"
                            label="Monto Pagado (USD)"
                            placeholder="0.00"
                            value={values.monto}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.monto && Boolean(errors.monto)}
                            helperText={touched.monto && errors.monto}
                            slotProps={{
                              input: {
                                startAdornment: <Typography sx={{ mr: 1, color: "text.secondary" }}>$</Typography>,
                              },
                              htmlInput: { inputMode: "decimal", step: "0.01" },
                            }}
                          />
                        </Grid>

                        {/* Referencia */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="referencia"
                            name="referencia"
                            label="Referencia"
                            value={values.referencia}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.referencia && Boolean(errors.referencia)}
                            helperText={touched.referencia && errors.referencia}
                          />
                        </Grid>

                        {/* Descripción */}
                        <Grid size={12}>
                          <TextField
                            fullWidth
                            id="descripcion"
                            name="descripcion"
                            label="Descripción del Pago"
                            placeholder="Ej: Pago de compra en TechStore Venezuela"
                            value={values.descripcion}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.descripcion && Boolean(errors.descripcion)}
                            helperText={touched.descripcion && errors.descripcion}
                            multiline
                            rows={2}
                            slotProps={{
                              htmlInput: { maxLength: 200 },
                            }}
                          />
                        </Grid>
                      </>
                    )}

                    {/* Result Alert */}
                    {submitResult && (
                      <Grid size={12}>
                        <Alert 
                          severity={submitResult.success ? "success" : "error"}
                          onClose={() => setSubmitResult(null)}
                          sx={{ mb: 2 }}
                        >
                          {submitResult.message}
                          {submitResult.transactionId && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              ID de Transaccion: <strong>{submitResult.transactionId}</strong>
                            </Typography>
                          )}
                        </Alert>
                      </Grid>
                    )}

                    {/* Botón Submit */}
                    {values.tipoTransaccion && (
                      <Grid size={12}>
                        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                          >
                            {isSubmitting ? "Registrando..." : "Registrar Transaccion"}
                          </Button>
                          <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            size="large"
                            disabled={isSubmitting}
                            onClick={() => {
                              resetForm()
                              setCurrentTipoTransaccion("")
                              setSubmitResult(null)
                            }}
                          >
                            Limpiar
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
          </Grid>
        </Grid>
      </Box>
    </ThemeRegistry>
  )
}
