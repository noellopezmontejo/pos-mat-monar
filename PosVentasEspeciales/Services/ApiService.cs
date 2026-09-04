using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;
using PosVentasEspeciales.Models;

namespace PosVentasEspeciales.Services
{
    public class ApiService
    {
        private static string _baseUrl = "http://localhost:4002/api";
        private static JavaScriptSerializer _serializer = new JavaScriptSerializer();

        public static string BaseUrl
        {
            get { return _baseUrl; }
            set { _baseUrl = value; }
        }

        public static User CurrentUser { get; set; }
        public static string AuthToken { get; set; }

        public static LoginResponse Login(string username, string password)
        {
            try
            {
                string url = string.Format("{0}/auth/login", _baseUrl);
                var req = new LoginRequest { username = username, password = password };
                string jsonBody = _serializer.Serialize(req);
                string jsonResp = PostHttp(url, jsonBody);
                var res = _serializer.Deserialize<LoginResponse>(jsonResp);
                if (res != null && res.user != null && !string.IsNullOrEmpty(res.token))
                {
                    CurrentUser = res.user;
                    AuthToken = res.token;
                }
                return res;
            }
            catch (WebException wex)
            {
                string err = ExtractErrorMessage(wex);
                return new LoginResponse { error = !string.IsNullOrEmpty(err) ? err : "Usuario o contraseña inválidos." };
            }
            catch (Exception ex)
            {
                return new LoginResponse { error = "Error de conexión con el servidor: " + ex.Message };
            }
        }

        public static List<Product> SearchProducts(string query)
        {
            try
            {
                string url = string.Format("{0}/products/search?query={1}", _baseUrl, Uri.EscapeDataString(query ?? ""));
                string json = GetHttp(url);
                return _serializer.Deserialize<List<Product>>(json) ?? new List<Product>();
            }
            catch
            {
                return GetMockProducts(query);
            }
        }

        public static List<Customer> SearchCustomers(string query)
        {
            try
            {
                string url = string.IsNullOrEmpty(query)
                    ? string.Format("{0}/customers", _baseUrl)
                    : string.Format("{0}/customers/search?query={1}", _baseUrl, Uri.EscapeDataString(query));
                string json = GetHttp(url);
                return _serializer.Deserialize<List<Customer>>(json) ?? new List<Customer>();
            }
            catch
            {
                return GetMockCustomers(query);
            }
        }

        public static SaleResponse CreateSale(SaleRequest request)
        {
            try
            {
                string url = string.Format("{0}/sales", _baseUrl);
                string jsonBody = _serializer.Serialize(request);
                string jsonResponse = PostHttp(url, jsonBody);
                var res = _serializer.Deserialize<SaleResponse>(jsonResponse);
                if (res == null || string.IsNullOrEmpty(res.folio))
                {
                    throw new Exception("El servidor no devolvió el folio de la venta.");
                }
                return res;
            }
            catch (WebException wex)
            {
                string err = ExtractErrorMessage(wex);
                throw new Exception(!string.IsNullOrEmpty(err) ? err : "Error HTTP al crear la venta.");
            }
            catch (Exception ex)
            {
                throw new Exception("Error al comunicar con el servidor: " + ex.Message);
            }
        }

        private static string GetHttp(string url)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "GET";
            request.Timeout = 6000;
            request.ContentType = "application/json";
            if (!string.IsNullOrEmpty(AuthToken))
            {
                request.Headers["Authorization"] = "Bearer " + AuthToken;
            }

            using (var response = (HttpWebResponse)request.GetResponse())
            using (var stream = response.GetResponseStream())
            using (var reader = new StreamReader(stream, Encoding.UTF8))
            {
                return reader.ReadToEnd();
            }
        }

        private static string PostHttp(string url, string jsonBody)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "POST";
            request.Timeout = 8000;
            request.ContentType = "application/json";
            if (!string.IsNullOrEmpty(AuthToken))
            {
                request.Headers["Authorization"] = "Bearer " + AuthToken;
            }

            byte[] bytes = Encoding.UTF8.GetBytes(jsonBody);
            request.ContentLength = bytes.Length;

            using (var stream = request.GetRequestStream())
            {
                stream.Write(bytes, 0, bytes.Length);
            }

            using (var response = (HttpWebResponse)request.GetResponse())
            using (var stream = response.GetResponseStream())
            using (var reader = new StreamReader(stream, Encoding.UTF8))
            {
                return reader.ReadToEnd();
            }
        }

        private static string ExtractErrorMessage(WebException wex)
        {
            if (wex.Response != null)
            {
                try
                {
                    using (var stream = wex.Response.GetResponseStream())
                    using (var reader = new StreamReader(stream, Encoding.UTF8))
                    {
                        string body = reader.ReadToEnd();
                        try
                        {
                            var dict = _serializer.Deserialize<Dictionary<string, object>>(body);
                            if (dict != null)
                            {
                                if (dict.ContainsKey("error")) return dict["error"].ToString();
                                if (dict.ContainsKey("message")) return dict["message"].ToString();
                            }
                        }
                        catch { }
                        return body;
                    }
                }
                catch { }
            }
            return wex.Message;
        }

        private static List<Product> GetMockProducts(string query)
        {
            var list = new List<Product>
            {
                new Product { id = "1", name = "Malla Electrosoldada 6x6-10/10", legacy_code = "MAL-6610", barcode = "7501001", sale_unit = "PZ", price_1 = 16336, price_2 = 15500, price_3 = 14800, price_4 = 14200, price_5 = 13800, price_6 = 13200 },
                new Product { id = "2", name = "Cemento Gris Tolteca 50kg", legacy_code = "CEM-TOL50", barcode = "7501002", sale_unit = "BTO", price_1 = 24500, price_2 = 23800, price_3 = 23200, price_4 = 22800, price_5 = 22400, price_6 = 21900 },
                new Product { id = "3", name = "Varilla Corrugada 3/8 R-42", legacy_code = "VAR-3842", barcode = "7501003", sale_unit = "TRAMO", price_1 = 18950, price_2 = 18200, price_3 = 17600, price_4 = 17100, price_5 = 16700, price_6 = 16200 },
                new Product { id = "4", name = "Piso Aspen Azul 35.7x35.7 (1.78m2)", legacy_code = "PIS335-PQ55299", barcode = "7501004", sale_unit = "CAJA", price_1 = 16336, price_2 = 15500, price_3 = 14900, price_4 = 14400, price_5 = 13900, price_6 = 13500 },
                new Product { id = "5", name = "Farol Roma II Tecno Lite FTL-4001/BA", legacy_code = "FAR279-FTL4001BA", barcode = "7501005", sale_unit = "PZ", price_1 = 67050, price_2 = 64000, price_3 = 61500, price_4 = 59000, price_5 = 57000, price_6 = 55000 },
                new Product { id = "6", name = "Calhidra Extra 25kg", legacy_code = "CAL-EXT25", barcode = "7501006", sale_unit = "BTO", price_1 = 8500, price_2 = 8100, price_3 = 7800, price_4 = 7500, price_5 = 7200, price_6 = 6900 },
                new Product { id = "7", name = "Armex 15x15-4 6m", legacy_code = "ARM-15154", barcode = "7501007", sale_unit = "PZ", price_1 = 19500, price_2 = 18700, price_3 = 18100, price_4 = 17600, price_5 = 17100, price_6 = 16600 }
            };

            if (string.IsNullOrEmpty(query)) return list;
            string q = query.ToLower();
            return list.FindAll(p => p.name.ToLower().Contains(q) || (p.legacy_code != null && p.legacy_code.ToLower().Contains(q)) || (p.barcode != null && p.barcode.Contains(q)));
        }

        private static List<Customer> GetMockCustomers(string query)
        {
            var list = new List<Customer>
            {
                new Customer { id = "c1", name = "CONSTRUCTORA DEL SURESTE SA DE CV", legacy_code = "CTE-001", rfc = "CSU980115XX1", phone = "961 123 4567", address = "Av. Central 123, Tuxtla Gutiérrez, Chis." },
                new Customer { id = "c2", name = "ARQ. ROBERTO MENDEZ CASTILLO", legacy_code = "CTE-002", rfc = "MECR800412YY2", phone = "965 987 6543", address = "Calle 3a Poniente 45, Villaflores, Chis." },
                new Customer { id = "c3", name = "INGENIERIA Y PROYECTOS MONAR", legacy_code = "CTE-003", rfc = "IPM150620ZZ3", phone = "965 652 0818", address = "Primera Sur 97, Villaflores, Chis." }
            };

            if (string.IsNullOrEmpty(query)) return list;
            string q = query.ToLower();
            return list.FindAll(c => c.name.ToLower().Contains(q) || (c.legacy_code != null && c.legacy_code.ToLower().Contains(q)) || (c.rfc != null && c.rfc.ToLower().Contains(q)));
        }
    }
}
