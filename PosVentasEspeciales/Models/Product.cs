using System;
using System.Collections.Generic;

namespace PosVentasEspeciales.Models
{
    public class Product
    {
        public string id { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public string legacy_code { get; set; }
        public string barcode { get; set; }
        public string sale_unit { get; set; }
        public string base_unit { get; set; }
        
        // Precios en centavos (como vienen de la base de datos / API)
        public long price_1 { get; set; }
        public long price_2 { get; set; }
        public long price_3 { get; set; }
        public long price_4 { get; set; }
        public long price_5 { get; set; }
        public long price_6 { get; set; }

        public int min_stock { get; set; }
        public int max_stock { get; set; }

        // Propiedades de ayuda para visualización en pesos
        public decimal Price1Decimal { get { return price_1 / 100m; } }
        public decimal Price2Decimal { get { return price_2 / 100m; } }
        public decimal Price3Decimal { get { return price_3 / 100m; } }
        public decimal Price4Decimal { get { return price_4 / 100m; } }
        public decimal Price5Decimal { get { return price_5 / 100m; } }
        public decimal Price6Decimal { get { return price_6 / 100m; } }

        public decimal GetPriceByLevel(int level)
        {
            switch (level)
            {
                case 1: return Price1Decimal;
                case 2: return price_2 > 0 ? Price2Decimal : Price1Decimal;
                case 3: return price_3 > 0 ? Price3Decimal : Price1Decimal;
                case 4: return price_4 > 0 ? Price4Decimal : Price1Decimal;
                case 5: return price_5 > 0 ? Price5Decimal : Price1Decimal;
                case 6: return price_6 > 0 ? Price6Decimal : Price1Decimal;
                default: return Price1Decimal;
            }
        }

        public long GetPriceCentsByLevel(int level)
        {
            switch (level)
            {
                case 1: return price_1;
                case 2: return price_2 > 0 ? price_2 : price_1;
                case 3: return price_3 > 0 ? price_3 : price_1;
                case 4: return price_4 > 0 ? price_4 : price_1;
                case 5: return price_5 > 0 ? price_5 : price_1;
                case 6: return price_6 > 0 ? price_6 : price_1;
                default: return price_1;
            }
        }

        public List<PriceOption> GetPriceOptions()
        {
            var list = new List<PriceOption>();
            list.Add(new PriceOption(1, "P1 (Público)", Price1Decimal));
            if (price_2 > 0) list.Add(new PriceOption(2, "P2 (Mayoreo)", Price2Decimal));
            if (price_3 > 0) list.Add(new PriceOption(3, "P3 (Herrero/Contr.)", Price3Decimal));
            if (price_4 > 0) list.Add(new PriceOption(4, "P4 (Especial 1)", Price4Decimal));
            if (price_5 > 0) list.Add(new PriceOption(5, "P5 (Especial 2)", Price5Decimal));
            if (price_6 > 0) list.Add(new PriceOption(6, "P6 (Distribuidor)", Price6Decimal));
            return list;
        }

        public override string ToString()
        {
            return string.Format("[{0}] {1} - {2:C2}", legacy_code ?? barcode ?? id, name, Price1Decimal);
        }
    }

    public class PriceOption
    {
        public int Level { get; set; }
        public string Label { get; set; }
        public decimal Price { get; set; }
        public string DisplayText { get { return string.Format("{0} - ${1:N2}", Label, Price); } }

        public PriceOption(int level, string label, decimal price)
        {
            Level = level;
            Label = label;
            Price = price;
        }

        public override string ToString()
        {
            return DisplayText;
        }
    }
}
