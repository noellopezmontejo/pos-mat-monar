using System;
using System.Collections.Generic;

namespace PosVentasEspeciales.Models
{
    public class SaleRequest
    {
        public string customer_id { get; set; }
        public string type { get; set; } // REMISSION o ANTICIPO
        public string payment_method { get; set; } // PAGO_EN_CAJA, CONTRA_ENTREGA, CREDIT_STORE
        public bool is_delivery { get; set; }
        public string delivery_address { get; set; }
        public List<SaleRequestItem> items { get; set; }

        public SaleRequest()
        {
            items = new List<SaleRequestItem>();
        }
    }

    public class SaleRequestItem
    {
        public string product_id { get; set; }
        public decimal quantity { get; set; }
        public long price { get; set; } // en centavos
        public string unit { get; set; }
    }

    public class SaleResponse
    {
        public string id { get; set; }
        public string folio { get; set; }
        public string type { get; set; }
        public string status { get; set; }
        public long total_amount { get; set; }
        public string created_at { get; set; }
    }
}
