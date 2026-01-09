#!/bin/bash
# Utility Invoice Generation - API Test Examples

# 1️⃣  CREATE METER READINGS (Landlord)
curl -X POST http://localhost:3000/billing/meter-readings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <LANDLORD_TOKEN>" \
  -d '{
    "contractId": "contract-123",
    "month": "2024-01",
    "readings": [
      {
        "serviceId": "service-electric",
        "currentReading": 1150
      },
      {
        "serviceId": "service-water",
        "currentReading": 75
      }
    ]
  }'

# Expected Response:
# {
#   "contractId": "contract-123",
#   "month": "2024-01",
#   "readings": [
#     {
#       "id": "reading-1",
#       "serviceId": "service-electric",
#       "currentReading": 1150,
#       "previousReading": 1000,
#       "usage": 150,
#       "amount": 750000
#     },
#     {
#       "id": "reading-2",
#       "serviceId": "service-water",
#       "currentReading": 75,
#       "previousReading": 50,
#       "usage": 25,
#       "amount": 250000
#     }
#   ],
#   "totalAmount": 1000000
# }

echo "✅ Step 1: Meter readings created"

---

# 2️⃣  GENERATE INVOICE FROM METER READINGS (Landlord)
curl -X POST http://localhost:3000/billing/utilities/invoice/contract-123/2024-01 \
  -H "Authorization: Bearer <LANDLORD_TOKEN>"

# Expected Response:
# {
#   "invoice": {
#     "id": "invoice-123",
#     "contractId": "contract-123",
#     "tenantId": "tenant-456",
#     "invoiceNumber": "UTL-2024-01-contract",
#     "issueDate": "2026-01-06T00:00:00Z",
#     "dueDate": "2026-01-21T00:00:00Z",
#     "totalAmount": 1000000,
#     "status": "PENDING"
#   },
#   "readings": [
#     {
#       "id": "reading-1",
#       "serviceId": "service-electric",
#       "usage": 150,
#       "amount": 750000,
#       "month": "2024-01"
#     },
#     {
#       "id": "reading-2",
#       "serviceId": "service-water",
#       "usage": 25,
#       "amount": 250000,
#       "month": "2024-01"
#     }
#   ],
#   "totalAmount": 1000000,
#   "lineItemCount": 2
# }

echo "✅ Step 2: Invoice generated from meter readings"

---

# 3️⃣  GET INVOICE DETAILS (Tenant or Landlord)
curl -X GET http://localhost:3000/billing/invoices/invoice-123 \
  -H "Authorization: Bearer <TENANT_TOKEN>"

# Expected Response:
# {
#   "id": "invoice-123",
#   "invoiceNumber": "UTL-2024-01-contract",
#   "totalAmount": 1000000,
#   "status": "PENDING",
#   "issueDate": "2026-01-06T00:00:00Z",
#   "dueDate": "2026-01-21T00:00:00Z",
#   "lineItems": [
#     {
#       "id": "line-item-1",
#       "serviceId": "service-electric",
#       "itemType": "UTILITY",
#       "description": "Điện - 150 kWh × 5,000 ₫/đơn vị",
#       "quantity": 150,
#       "unitPrice": 5000,
#       "amount": 750000
#     },
#     {
#       "id": "line-item-2",
#       "serviceId": "service-water",
#       "itemType": "UTILITY",
#       "description": "Nước - 25 m³ × 10,000 ₫/đơn vị",
#       "quantity": 25,
#       "unitPrice": 10000,
#       "amount": 250000
#     }
#   ]
# }

echo "✅ Step 3: Invoice details retrieved"

---

# 4️⃣  TENANT VIEWS UTILITY BILLING (Tenant)
curl -X GET "http://localhost:3000/billing/utilities?month=2024-01" \
  -H "Authorization: Bearer <TENANT_TOKEN>"

# Expected Response:
# {
#   "contract": {
#     "id": "contract-123",
#     "roomId": "room-456"
#   },
#   "services": [
#     {
#       "id": "service-electric",
#       "serviceName": "Điện",
#       "unit": "kWh",
#       "unitPrice": 5000,
#       "billingMethod": "METERED"
#     },
#     {
#       "id": "service-water",
#       "serviceName": "Nước",
#       "unit": "m³",
#       "unitPrice": 10000,
#       "billingMethod": "METERED"
#     }
#   ],
#   "latestReadings": [
#     {
#       "id": "reading-1",
#       "serviceId": "service-electric",
#       "usage": 150,
#       "amount": 750000,
#       "month": "2024-01"
#     },
#     {
#       "id": "reading-2",
#       "serviceId": "service-water",
#       "usage": 25,
#       "amount": 250000,
#       "month": "2024-01"
#     }
#   ],
#   "totalAmount": 1000000
# }

echo "✅ Step 4: Tenant viewing utility billing"

---

# 5️⃣  MAKE PAYMENT (Tenant)
# This will integrate with payment system
curl -X POST http://localhost:3000/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TENANT_TOKEN>" \
  -d '{
    "invoiceId": "invoice-123",
    "amount": 1000000,
    "paymentMethod": "bank_transfer",
    "bankCode": "970422",
    "accountName": "Tenant Name"
  }'

echo "✅ Step 5: Payment initiated"

---

# 6️⃣  VERIFY PAYMENT (Landlord)
curl -X GET http://localhost:3000/billing/invoices/invoice-123 \
  -H "Authorization: Bearer <LANDLORD_TOKEN>"

# After payment, status should be "PAID"
# {
#   "id": "invoice-123",
#   "status": "PAID",
#   "paidAt": "2026-01-10T10:30:00Z",
#   ...
# }

echo "✅ Step 6: Payment verified - Invoice marked as PAID"
