using System;

namespace PosVentasEspeciales.Models
{
    public class FiscalClient
    {
        public string rfc { get; set; }
        public string business_name { get; set; }
    }

    public class Customer
    {
        public string id { get; set; }
        public string name { get; set; }
        public string legacy_code { get; set; }
        public string rfc { get; set; }
        public string phone { get; set; }
        public string address { get; set; }
        public string customer_type { get; set; }
        public int credit_limit { get; set; }
        public int credit_days { get; set; }
        public FiscalClient fiscal_client { get; set; }

        public string RFCDisplay
        {
            get
            {
                if (!string.IsNullOrEmpty(rfc)) return rfc;
                if (fiscal_client != null && !string.IsNullOrEmpty(fiscal_client.rfc)) return fiscal_client.rfc;
                return "XAXX010101000";
            }
        }

        public static Customer DefaultCustomer
        {
            get
            {
                return new Customer
                {
                    id = null,
                    name = "PÚBLICO EN GENERAL",
                    legacy_code = "0000",
                    rfc = "XAXX010101000",
                    address = "Mostrador",
                    customer_type = "P1"
                };
            }
        }

        public override string ToString()
        {
            return string.Format("[{0}] {1}", legacy_code ?? "0", name);
        }
    }
}
