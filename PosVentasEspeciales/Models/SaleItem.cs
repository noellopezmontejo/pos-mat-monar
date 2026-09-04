using System;

namespace PosVentasEspeciales.Models
{
    public class SaleItem
    {
        public Product Product { get; set; }
        public decimal Quantity { get; set; }
        public int PriceLevel { get; set; } // 1 to 6
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get { return Quantity * UnitPrice; } }
        public decimal UnitTax { get { return UnitPrice - (UnitPrice / 1.16m); } }
        public decimal TotalTax { get { return Subtotal - (Subtotal / 1.16m); } }
        public decimal SubtotalWithoutTax { get { return Subtotal / 1.16m; } }

        public SaleItem(Product product, decimal quantity = 1, int priceLevel = 1)
        {
            Product = product;
            Quantity = quantity;
            PriceLevel = priceLevel;
            UnitPrice = product.GetPriceByLevel(priceLevel);
        }

        public void SetPriceLevel(int level)
        {
            PriceLevel = level;
            UnitPrice = Product.GetPriceByLevel(level);
        }
    }
}
