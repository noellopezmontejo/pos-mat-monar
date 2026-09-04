using System;

namespace PosVentasEspeciales.Services
{
    public static class NumberToWords
    {
        public static string ConvertToSpanishWords(decimal amount)
        {
            long enteros = (long)Math.Floor(amount);
            int centavos = (int)Math.Round((amount - enteros) * 100);
            string letrasCentavos = string.Format("{0:00}/100 M.N.", centavos);

            if (enteros == 0) return string.Format("(CERO PESOS {0})", letrasCentavos);

            string[] unidades = { "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE" };
            string[] decenas = { "", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA" };
            string[] centenas = { "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS" };

            Func<long, string> traducirSeccion = (n) =>
            {
                string str = "";
                long c = n / 100;
                long d = (n % 100) / 10;
                long u = n % 10;

                if (n == 100) return "CIEN ";
                if (c > 0) str += centenas[c] + " ";

                long rest = n % 100;
                if (rest > 0)
                {
                    if (rest == 11) str += "ONCE ";
                    else if (rest == 12) str += "DOCE ";
                    else if (rest == 13) str += "TRECE ";
                    else if (rest == 14) str += "CATORCE ";
                    else if (rest == 15) str += "QUINCE ";
                    else if (rest >= 16 && rest <= 19) str += "DIECI" + unidades[u] + " ";
                    else if (rest == 20) str += "VEINTE ";
                    else if (rest >= 21 && rest <= 29) str += "VEINTI" + unidades[u] + " ";
                    else
                    {
                        if (d > 0)
                        {
                            str += decenas[d];
                            if (u > 0) str += " Y " + unidades[u];
                            str += " ";
                        }
                        else if (u > 0)
                        {
                            str += unidades[u] + " ";
                        }
                    }
                }
                return str;
            };

            long nVal = enteros;
            string letras = "";

            long millones = nVal / 1000000;
            nVal = nVal % 1000000;
            long miles = nVal / 1000;
            long unidadesSimples = nVal % 1000;

            if (millones > 0)
            {
                letras += millones == 1 ? "UN MILLON " : traducirSeccion(millones) + "MILLONES ";
            }
            if (miles > 0)
            {
                letras += miles == 1 ? "MIL " : traducirSeccion(miles) + "MIL ";
            }
            if (unidadesSimples > 0)
            {
                letras += traducirSeccion(unidadesSimples);
            }

            string palabraPeso = enteros == 1 ? "PESO" : "PESOS";
            return string.Format("({0} {1} {2})", letras.Trim(), palabraPeso, letrasCentavos).ToUpper();
        }
    }
}
