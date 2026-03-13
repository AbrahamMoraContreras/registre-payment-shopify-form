import fastapi
import fastapi.middleware.cors
from pydantic import BaseModel, Field
from typing import Optional

app = fastapi.FastAPI(
    title="Transaction API",
    description="API para registro de transacciones de pago",
    version="1.0.0"
)

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Lista de bancos venezolanos
BANCOS = {
    "0001": "BANCO CENTRAL DE VENEZUELA",
    "0102": "BANCO DE VENEZUELA, S.A. BANCO UNIVERSAL",
    "0104": "BANCO VENEZOLANO DE CRÉDITO, S.A BANCO UNIVERSAL",
    "0105": "BANCO MERCANTIL C.A., BANCO UNIVERSAL",
    "0108": "BANCO PROVINCIAL, S.A. BANCO UNIVERSAL",
    "0114": "BANCO DEL CARIBE C.A., BANCO UNIVERSAL",
    "0115": "BANCO EXTERIOR C.A., BANCO UNIVERSAL",
    "0128": "BANCO CARONÍ C.A., BANCO UNIVERSAL",
    "0134": "BANESCO BANCO UNIVERSAL, C.A.",
    "0137": "BANCO SOFITASA BANCO UNIVERSAL, C.A.",
    "0138": "BANCO PLAZA, BANCO UNIVERSAL",
    "0146": "BANCO DE LA GENTE EMPRENDEDORA C.A.",
    "0151": "BANCO FONDO COMÚN, C.A BANCO UNIVERSAL",
    "0156": "100% BANCO, BANCO COMERCIAL, C.A",
    "0157": "DELSUR, BANCO UNIVERSAL C.A.",
    "0163": "BANCO DEL TESORO C.A., BANCO UNIVERSAL",
    "0166": "BANCO AGRÍCOLA DE VENEZUELA C.A., BANCO UNIVERSAL",
    "0168": "BANCRECER S.A., BANCO MICROFINANCIERO",
    "0169": "R4, BANCO MICROFINANCIERO, C.A.",
    "0171": "BANCO ACTIVO C.A., BANCO UNIVERSAL",
    "0172": "BANCAMIGA BANCO UNIVERSAL, C.A.",
    "0173": "BANCO INTERNACIONAL DE DESARROLLO C.A., BANCO UNIVERSAL",
    "0174": "BANPLUS BANCO UNIVERSAL, C.A.",
    "0175": "BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL C.A.",
    "0177": "BANCO DE LA FUERZA ARMADA NACIONAL BOLIVARIANA, B.U.",
    "0178": "N58 BANCO DIGITAL, BANCO MICROFINANCIERO",
    "0191": "BANCO NACIONAL DE CRÉDITO C.A., BANCO UNIVERSAL",
    "0601": "INSTITUTO MUNICIPAL DE CRÉDITO POPULAR",
}


class TransactionBase(BaseModel):
    """Modelo base para transacciones"""
    reference_number: str = Field(
        ...,
        description="Número de referencia de la transacción",
        examples=["123456789"]
    )
    bank_name: str = Field(
        ...,
        description="Código del banco (ej: 0134 para Banesco)",
        examples=["0134"]
    )
    amount: float = Field(
        ...,
        gt=0,
        description="Monto de la transacción en USD",
        examples=[91.63]
    )
    token: str = Field(
        ...,
        description="Token de la orden de pago (viene en la URL)",
        examples=["abc123xyz"]
    )


class PagoMovilRequest(TransactionBase):
    """Request para registrar un Pago Móvil"""
    transaction_type: str = Field(default="pago_movil", description="Tipo de transacción")
    document_type: str = Field(
        ...,
        description="Tipo de documento (V, J, E)",
        examples=["V"]
    )
    document_number: str = Field(
        ...,
        description="Número de documento de identidad",
        examples=["12345678"]
    )
    phone_number: str = Field(
        ...,
        min_length=11,
        max_length=11,
        description="Número telefónico (11 dígitos)",
        examples=["04141234567"]
    )
    description: Optional[str] = Field(
        None,
        max_length=200,
        description="Descripción del pago"
    )


class TransferenciaRequest(TransactionBase):
    """Request para registrar una Transferencia Bancaria"""
    transaction_type: str = Field(default="transferencia", description="Tipo de transacción")
    document_type: str = Field(
        ...,
        description="Tipo de documento (V, J, E)",
        examples=["V"]
    )
    document_number: str = Field(
        ...,
        description="Número de documento de identidad",
        examples=["12345678"]
    )
    account_number: str = Field(
        ...,
        min_length=20,
        max_length=20,
        description="Número de cuenta (20 dígitos)",
        examples=["01340000000000000000"]
    )
    description: Optional[str] = Field(
        None,
        max_length=200,
        description="Descripción del pago"
    )


class TransactionResponse(BaseModel):
    """Respuesta del registro de transacción"""
    success: bool
    message: str
    transaction_id: Optional[str] = None
    reference_number: str
    bank_name: str
    amount: float
    token: str


class OrderInfo(BaseModel):
    """Información de la orden de compra"""
    order_number: str
    date: str
    store: str
    subtotal: float
    tax: float
    total: float
    installments: int
    installment_value: float
    status: str
    payment_destination: dict


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    success: bool = False
    error: str
    details: Optional[dict] = None


# Almacenamiento en memoria para demo (en producción usar base de datos)
transactions_db: dict = {}
orders_db: dict = {
    "demo_token": {
        "order_number": "ORD-2024-00847",
        "date": "10 de marzo, 2026",
        "store": "TechStore Venezuela",
        "products": [
            {"name": "Audífonos Inalámbricos Sony WH-1000XM5", "quantity": 1, "price": 45.00},
            {"name": "Cargador USB-C 65W", "quantity": 2, "price": 12.50},
            {"name": "Funda protectora para laptop 15\"", "quantity": 1, "price": 8.99},
        ],
        "subtotal": 78.99,
        "tax": 12.64,
        "total": 91.63,
        "installments": 3,
        "installment_value": 30.54,
        "status": "Pendiente de Pago",
        "payment_destination": {
            "bank": "BANESCO BANCO UNIVERSAL, C.A.",
            "rif": "J-07013380-5",
            "phone": "04141234567",
            "account": "01340000000000000000",
        }
    }
}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/banks")
async def get_banks() -> dict:
    """Obtener lista de bancos disponibles"""
    banks_list = [{"code": code, "name": name} for code, name in BANCOS.items()]
    return {"banks": banks_list}


@app.get("/order/{token}")
async def get_order(token: str) -> dict:
    """
    Obtener información de una orden de compra por su token
    
    - **token**: Token único de la orden (viene en la URL)
    """
    order = orders_db.get(token)
    if not order:
        raise fastapi.HTTPException(
            status_code=404,
            detail=f"Orden con token '{token}' no encontrada"
        )
    return {"order": order, "token": token}


@app.post("/transaction/pago-movil", response_model=TransactionResponse)
async def register_pago_movil(transaction: PagoMovilRequest) -> TransactionResponse:
    """
    Registrar una transacción de Pago Móvil
    
    - **reference_number**: Número de referencia de la transacción
    - **bank_name**: Código del banco
    - **amount**: Monto pagado en USD
    - **token**: Token de la orden de pago
    - **document_type**: Tipo de documento (V, J, E)
    - **document_number**: Número de documento
    - **phone_number**: Número telefónico (11 dígitos)
    - **description**: Descripción opcional del pago
    """
    # Validar que el token existe
    if transaction.token not in orders_db:
        raise fastapi.HTTPException(
            status_code=404,
            detail=f"Token '{transaction.token}' no válido"
        )
    
    # Validar que el banco existe
    if transaction.bank_name not in BANCOS:
        raise fastapi.HTTPException(
            status_code=400,
            detail=f"Código de banco '{transaction.bank_name}' no válido"
        )
    
    # Generar ID de transacción
    import uuid
    transaction_id = str(uuid.uuid4())[:8].upper()
    
    # Guardar transacción
    transactions_db[transaction_id] = {
        "id": transaction_id,
        "type": "pago_movil",
        "reference_number": transaction.reference_number,
        "bank_code": transaction.bank_name,
        "bank_name": BANCOS[transaction.bank_name],
        "amount": transaction.amount,
        "token": transaction.token,
        "document_type": transaction.document_type,
        "document_number": transaction.document_number,
        "phone_number": transaction.phone_number,
        "description": transaction.description,
        "status": "pending_verification"
    }
    
    # Actualizar estado de la orden
    orders_db[transaction.token]["status"] = "Pago Registrado - Pendiente Verificación"
    
    return TransactionResponse(
        success=True,
        message="Pago móvil registrado exitosamente. Pendiente de verificación.",
        transaction_id=transaction_id,
        reference_number=transaction.reference_number,
        bank_name=BANCOS[transaction.bank_name],
        amount=transaction.amount,
        token=transaction.token
    )


@app.post("/transaction/transferencia", response_model=TransactionResponse)
async def register_transferencia(transaction: TransferenciaRequest) -> TransactionResponse:
    """
    Registrar una transacción de Transferencia Bancaria
    
    - **reference_number**: Número de referencia de la transacción
    - **bank_name**: Código del banco
    - **amount**: Monto pagado en USD
    - **token**: Token de la orden de pago
    - **document_type**: Tipo de documento (V, J, E)
    - **document_number**: Número de documento
    - **account_number**: Número de cuenta (20 dígitos)
    - **description**: Descripción opcional del pago
    """
    # Validar que el token existe
    if transaction.token not in orders_db:
        raise fastapi.HTTPException(
            status_code=404,
            detail=f"Token '{transaction.token}' no válido"
        )
    
    # Validar que el banco existe
    if transaction.bank_name not in BANCOS:
        raise fastapi.HTTPException(
            status_code=400,
            detail=f"Código de banco '{transaction.bank_name}' no válido"
        )
    
    # Generar ID de transacción
    import uuid
    transaction_id = str(uuid.uuid4())[:8].upper()
    
    # Guardar transacción
    transactions_db[transaction_id] = {
        "id": transaction_id,
        "type": "transferencia",
        "reference_number": transaction.reference_number,
        "bank_code": transaction.bank_name,
        "bank_name": BANCOS[transaction.bank_name],
        "amount": transaction.amount,
        "token": transaction.token,
        "document_type": transaction.document_type,
        "document_number": transaction.document_number,
        "account_number": transaction.account_number,
        "description": transaction.description,
        "status": "pending_verification"
    }
    
    # Actualizar estado de la orden
    orders_db[transaction.token]["status"] = "Pago Registrado - Pendiente Verificación"
    
    return TransactionResponse(
        success=True,
        message="Transferencia bancaria registrada exitosamente. Pendiente de verificación.",
        transaction_id=transaction_id,
        reference_number=transaction.reference_number,
        bank_name=BANCOS[transaction.bank_name],
        amount=transaction.amount,
        token=transaction.token
    )


@app.get("/transaction/{transaction_id}")
async def get_transaction(transaction_id: str) -> dict:
    """
    Obtener información de una transacción por su ID
    """
    transaction = transactions_db.get(transaction_id.upper())
    if not transaction:
        raise fastapi.HTTPException(
            status_code=404,
            detail=f"Transacción '{transaction_id}' no encontrada"
        )
    return {"transaction": transaction}


@app.get("/transactions/{token}")
async def get_transactions_by_token(token: str) -> dict:
    """
    Obtener todas las transacciones asociadas a un token de orden
    """
    transactions = [
        t for t in transactions_db.values() 
        if t.get("token") == token
    ]
    return {"transactions": transactions, "count": len(transactions)}
